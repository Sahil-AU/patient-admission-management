import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

load_dotenv(Path(__file__).with_name(".env"))

DATABASE_NAME = "hospital_management"
COLLECTION_NAME = "patients"

logger = logging.getLogger(__name__)
mongo_client: MongoClient | None = None
patients_collection: Collection | None = None
connection_message = "MONGODB_URI is not configured in backend/.env."


def connect_to_database() -> bool:
    global mongo_client, patients_collection, connection_message

    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        connection_message = "MONGODB_URI is not configured in backend/.env."
        logger.warning(connection_message)
        return False

    client = None
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")

        selected_database = client[DATABASE_NAME]
        if COLLECTION_NAME not in selected_database.list_collection_names():
            selected_database.create_collection(COLLECTION_NAME)

        selected_patients_collection = selected_database[COLLECTION_NAME]
        selected_patients_collection.create_index("patient_id", unique=True)

        mongo_client = client
        patients_collection = selected_patients_collection
        connection_message = "MongoDB connection is unavailable."
        logger.info("Connected to MongoDB database and patients collection.")
        return True
    except PyMongoError:
        if client is not None:
            client.close()
        connection_message = (
            "Could not connect to MongoDB. Check MONGODB_URI, Atlas network access, "
            "and database user permissions."
        )
        logger.error(connection_message)
        return False


def check_database_connection() -> tuple[bool, str]:
    if mongo_client is None:
        return False, connection_message

    try:
        mongo_client.admin.command("ping")
        return True, "MongoDB is reachable."
    except PyMongoError:
        return (
            False,
            "MongoDB is unreachable. Check Atlas availability and network access.",
        )


def close_database_connection() -> None:
    global mongo_client, patients_collection

    if mongo_client is not None:
        mongo_client.close()

    mongo_client = None
    patients_collection = None
