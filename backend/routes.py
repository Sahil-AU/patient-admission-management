import re
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pymongo import DESCENDING, ReturnDocument
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

import database
from models import (
    DEPARTMENTS,
    DOCTORS,
    GENDERS,
    WARDS,
    Department,
    Doctor,
    PatientCreate,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
    Ward,
)

router = APIRouter()


def get_patients_collection() -> Collection:
    collection = database.patients_collection
    if collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patient database is unavailable.",
        )
    return collection


def get_object_id(patient_id: str) -> ObjectId:
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient ID must be a valid MongoDB ObjectId.",
        )
    return ObjectId(patient_id)


def serialize_patient(patient: dict[str, Any]) -> dict[str, Any]:
    patient["_id"] = str(patient["_id"])
    admission_date = patient.get("admission_date")
    if isinstance(admission_date, datetime):
        patient["admission_date"] = admission_date.date()
    return jsonable_encoder(patient)


def admission_date_to_datetime(admission_date: date) -> datetime:
    return datetime.combine(admission_date, time.min, tzinfo=timezone.utc)


def generate_patient_id(collection: Collection) -> str:
    highest_number = 1000
    for patient in collection.find({}, {"patient_id": 1}):
        existing_id = patient.get("patient_id", "")
        if existing_id.startswith("PAT-") and existing_id[4:].isdigit():
            highest_number = max(highest_number, int(existing_id[4:]))
    return f"PAT-{highest_number + 1}"


def database_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="The patient database is temporarily unavailable.",
    )


@router.post(
    "/api/patients",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_patient(
    patient_data: PatientCreate,
    collection: Collection = Depends(get_patients_collection),
):
    for _ in range(5):
        now = datetime.now(timezone.utc)
        patient = patient_data.model_dump()
        patient["admission_date"] = admission_date_to_datetime(
            patient["admission_date"]
        )
        patient["patient_id"] = generate_patient_id(collection)
        patient["status"] = "Admitted"
        patient["created_at"] = now
        patient["updated_at"] = now

        try:
            result = collection.insert_one(patient)
            patient["_id"] = result.inserted_id
            return serialize_patient(patient)
        except DuplicateKeyError:
            continue
        except PyMongoError:
            raise database_error() from None

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Could not generate a unique patient ID. Please try again.",
    )


@router.get("/api/patients", response_model=PatientListResponse)
def get_patients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    ward: Ward | None = None,
    department: Department | None = None,
    doctor: Doctor | None = None,
    collection: Collection = Depends(get_patients_collection),
):
    filters: dict[str, Any] = {}
    if search and search.strip():
        filters["name"] = {"$regex": re.escape(search.strip()), "$options": "i"}
    if ward:
        filters["ward"] = ward
    if department:
        filters["department"] = department
    if doctor:
        filters["doctor"] = doctor

    try:
        total = collection.count_documents(filters)
        cursor = (
            collection.find(filters)
            .sort("_id", DESCENDING)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        patients = [serialize_patient(patient) for patient in cursor]
        return {
            "items": patients,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    except PyMongoError:
        raise database_error() from None


@router.get("/api/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    collection: Collection = Depends(get_patients_collection),
):
    object_id = get_object_id(patient_id)
    try:
        patient = collection.find_one({"_id": object_id})
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )
        return serialize_patient(patient)
    except PyMongoError:
        raise database_error() from None


@router.put("/api/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    collection: Collection = Depends(get_patients_collection),
):
    object_id = get_object_id(patient_id)
    updated_data = patient_data.model_dump()
    updated_data["admission_date"] = admission_date_to_datetime(
        updated_data["admission_date"]
    )
    updated_data["updated_at"] = datetime.now(timezone.utc)

    try:
        patient = collection.find_one_and_update(
            {"_id": object_id},
            {"$set": updated_data},
            return_document=ReturnDocument.AFTER,
        )
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )
        return serialize_patient(patient)
    except PyMongoError:
        raise database_error() from None


@router.delete("/api/patients/{patient_id}")
def delete_patient(
    patient_id: str,
    collection: Collection = Depends(get_patients_collection),
):
    object_id = get_object_id(patient_id)
    try:
        result = collection.delete_one({"_id": object_id})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )
        return {"message": "Patient deleted successfully."}
    except PyMongoError:
        raise database_error() from None


@router.patch(
    "/api/patients/{patient_id}/discharge",
    response_model=PatientResponse,
)
def discharge_patient(
    patient_id: str,
    collection: Collection = Depends(get_patients_collection),
):
    object_id = get_object_id(patient_id)
    updated_at = datetime.now(timezone.utc)

    try:
        patient = collection.find_one_and_update(
            {"_id": object_id, "status": "Admitted"},
            {"$set": {"status": "Discharged", "updated_at": updated_at}},
            return_document=ReturnDocument.AFTER,
        )
        if patient is not None:
            return serialize_patient(patient)

        existing_patient = collection.find_one({"_id": object_id})
        if existing_patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient is already discharged.",
        )
    except PyMongoError:
        raise database_error() from None


@router.get("/api/stats")
def get_statistics(collection: Collection = Depends(get_patients_collection)):
    try:
        today = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
        return {
            "total_patients": collection.count_documents({}),
            "admitted_patients": collection.count_documents({"status": "Admitted"}),
            "discharged_patients": collection.count_documents(
                {"status": "Discharged"}
            ),
            "today_admissions": collection.count_documents(
                {"admission_date": {"$gte": today, "$lt": today + timedelta(days=1)}}
            ),
            "total_departments": len(DEPARTMENTS),
        }
    except PyMongoError:
        raise database_error() from None


@router.get("/api/options")
def get_options():
    return {
        "genders": GENDERS,
        "wards": WARDS,
        "departments": DEPARTMENTS,
        "doctors": [
            {"name": name, "department": department}
            for name, department in DOCTORS.items()
        ],
    }
