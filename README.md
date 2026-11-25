# Patient Admission Management

A patient-admission dashboard built with React, Vite, FastAPI, and MongoDB.
The backend connects to MongoDB Atlas through PyMongo when `backend/.env` is configured.
The backend provides patient management APIs, and the React frontend provides a
dashboard backed by those APIs.

## Requirements

- Node.js and npm
- Python 3

## Start the frontend

From the project root, run these commands in PowerShell:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Vite prints the local URL (by default, `http://localhost:5173`).

## Start the backend

From the project root, run these commands in PowerShell:

```powershell
Set-Location .\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Set MONGODB_URI in .env to your MongoDB Atlas connection string.
python -m uvicorn main:app --reload --port 8001
```

Swagger documentation is available at `http://127.0.0.1:8001/docs`.
The health checks are `/api/health` and `/api/db-health`.
Configure the Atlas URI in `backend/.env`; never commit that file.
On successful startup, the backend selects `hospital_management` and creates
the `patients` collection if it does not already exist. In MongoDB Atlas, create
a database user, allow your development machine's IP in Network Access, and
put the cluster's connection string in `backend/.env` as `MONGODB_URI=...`.

## Patient API

- `POST /api/patients` creates an admitted patient and assigns a unique patient ID.
- `GET /api/patients` lists patients with `page`, `page_size`, `search`, `ward`,
  `department`, and `doctor` query parameters.
- `GET /api/patients/{patient_id}` retrieves one patient by MongoDB ObjectId.
- `PUT /api/patients/{patient_id}` replaces the editable patient fields.
- `DELETE /api/patients/{patient_id}` removes a patient.
- `PATCH /api/patients/{patient_id}/discharge` discharges an admitted patient.
- `GET /api/stats` returns patient counts and department count.
- `GET /api/options` returns the supported dropdown values.

The response `_id` is a string. Patient status is set to `Admitted` on creation
and changed to `Discharged` through the discharge endpoint.
Statistics include `today_admissions`, based on admission dates stored for the
current server date.

## Project structure

```text
patient-management/
├── .gitignore
├── README.md
├── backend/
│   ├── .env.example
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── routes.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── api/
        │   ├── apiClient.js
        │   └── dashboardApi.js
        ├── components/
        │   ├── AddPatientDialog.jsx
        │   ├── PatientFilters.jsx
        │   ├── PatientTable.jsx
        │   ├── Sidebar.jsx
        │   ├── StatCard.jsx
        │   └── Topbar.jsx
        └── pages/
            └── Dashboard.jsx
```
