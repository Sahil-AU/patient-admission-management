from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

GENDERS = ["Male", "Female", "Other"]
WARDS = [
    "General Ward",
    "ICU",
    "Private Ward",
    "Emergency Ward",
    "Pediatric Ward",
    "Maternity Ward",
]
DEPARTMENTS = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "General Medicine",
    "Dermatology",
    "Oncology",
    "Gynecology",
]
DOCTORS = {
    "Dr. Amit Sharma": "Cardiology",
    "Dr. Priya Verma": "Neurology",
    "Dr. Rahul Mehta": "Orthopedics",
    "Dr. Neha Gupta": "Pediatrics",
    "Dr. Arjun Singh": "General Medicine",
    "Dr. Kavita Rao": "Dermatology",
    "Dr. Sanjay Kapoor": "Oncology",
    "Dr. Anjali Sharma": "Gynecology",
}

Gender = Literal["Male", "Female", "Other"]
Ward = Literal[
    "General Ward",
    "ICU",
    "Private Ward",
    "Emergency Ward",
    "Pediatric Ward",
    "Maternity Ward",
]
Department = Literal[
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "General Medicine",
    "Dermatology",
    "Oncology",
    "Gynecology",
]
Doctor = Literal[
    "Dr. Amit Sharma",
    "Dr. Priya Verma",
    "Dr. Rahul Mehta",
    "Dr. Neha Gupta",
    "Dr. Arjun Singh",
    "Dr. Kavita Rao",
    "Dr. Sanjay Kapoor",
    "Dr. Anjali Sharma",
]
PatientStatus = Literal["Admitted", "Discharged"]


class PatientInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    age: int = Field(strict=True, ge=0, le=120)
    gender: Gender
    ward: Ward
    department: Department
    doctor: Doctor
    admission_date: date

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value):
        if isinstance(value, str):
            value = " ".join(value.split())
        return value

    @field_validator("name")
    @classmethod
    def validate_name_characters(cls, value):
        if not value:
            raise ValueError("Name is required.")
        if not all(character.isalpha() or character == " " for character in value):
            raise ValueError("Name may contain letters and spaces only.")
        return value

    @field_validator("doctor")
    @classmethod
    def validate_doctor_department(cls, doctor: str, info: ValidationInfo):
        department = info.data.get("department")
        if department is not None and DOCTORS[doctor] != department:
            raise ValueError(f"{doctor} belongs to {DOCTORS[doctor]}.")
        return doctor

    @field_validator("admission_date")
    @classmethod
    def validate_admission_date(cls, value: date):
        if value > date.today():
            raise ValueError("Admission date cannot be in the future.")
        return value


class PatientCreate(PatientInput):
    status: Literal["Admitted"] = "Admitted"


class PatientUpdate(PatientInput):
    pass


class PatientResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    patient_id: str
    name: str
    age: int
    gender: Gender
    ward: Ward
    department: Department
    doctor: Doctor
    admission_date: date
    status: PatientStatus
    created_at: datetime
    updated_at: datetime


class PatientListResponse(BaseModel):
    items: list[PatientResponse]
    total: int
    page: int
    page_size: int
