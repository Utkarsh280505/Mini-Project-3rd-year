# NeuroEarly AI

NeuroEarly AI is a prototype multimodal screening platform for early neurological risk assessment. It combines frontend, backend, and ML components to model a clinical workflow where patient inputs, assessment data, and explainable risk scoring can be reviewed in one system.

The project is designed to support early screening use cases with a modular architecture, including:

- frontend patient and clinician experience
- backend API and data layer
- ML inference engine for fused risk estimation
- explainability and modality-based scoring

## Project goals

This repository demonstrates an end-to-end concept for:

1. collecting patient and assessment data
2. storing session state in a backend data store
3. running multimodal risk analysis
4. returning explainable risk summaries to a clinician-facing UI
5. providing a foundation for expansion into real clinical datasets and production-grade deployment

## Architecture overview

```text
Frontend (React + Vite)
        |
        v
Backend (Node.js + Express + Prisma)
        |
        +------------------------------+
        |                              |
        v                              v
ML Engine (Python + Flask)      SQLite database
- imaging model                  - users
- biomarker models               - patient records
- fusion engine                  - assessments
- explainability                 - sessions / reports
```

## Repository layout

```text
NeuroEarly AI/
├── backend/                  # API service and data access layer
│   ├── prisma/               # Prisma schema and local SQLite database
│   ├── src/                  # Express app, routes, controllers, and services
│   ├── test/
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
├── frontend/                 # React + Vite user interface
│   ├── public/
│   ├── src/                  # Pages, components, and API clients
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── ml-engine/                # Synthetic multimodal ML pipeline
│   ├── models/               # Trained model artifacts
│   ├── api.py
│   ├── biomarker_model.py
│   ├── data_synth.py
│   ├── demo.py
│   ├── fusion_engine.py
│   ├── imaging_model.py
│   ├── requirements.txt
│   ├── train.py
│   ├── README.md
│   └── demo_heatmap.png
├── docs/                     # presentation and design assets
│   ├── NeuroEarly_AI_Project_Synopsis.docx
│   ├── neuroearly_system_architecture.png
│   └── neuroearly_use_case_diagram.png
├── docker-compose.yml        # local orchestration for all services
├── README.md                 # project overview and setup docs
├── package-lock.json
└── .gitignore
```

## Tech stack

### Frontend
- React 19
- Vite
- Framer Motion
- Recharts
- Three.js
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Prisma ORM
- SQLite (development database)
- JWT auth
- CORS and security middleware

### ML engine
- Python 3.10+
- Flask
- scikit-learn
- NumPy
- joblib
- Matplotlib

## Core functionality

### Frontend
- landing page / product hero
- authentication flow UI
- clinician dashboard concept
- patient assessment flow interface
- explainability and analytics cards

### Backend
- authentication routes
- patient profile management
- session handling and report storage
- Prisma-based schema and service layer
- integration with the ML service

### ML engine
- imaging risk estimation from image-like features
- speech, motor, cognitive, and ocular risk models
- modality fusion into a final risk score
- confidence and clinical risk-band outputs
- explainability via feature importance and heatmap-style output

## How the system works

1. A patient or clinician submits assessment inputs via the frontend.
2. The backend stores session and patient data and forwards structured payloads to the ML engine.
3. The ML service analyzes each modality and produces a risk estimate.
4. Results are combined into a fused risk score with confidence and explainability details.
5. The UI presents the combined assessment summary and clinician-oriented outputs.

## Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm
- Python 3.10+
- pip
- Docker and Docker Compose (optional, for full local orchestration)
- Git

## Quick start

### Option 1: local development without Docker

Run each service in a separate terminal.

#### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:push
npm run db:generate
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp .env.example .env`.

Backend default URL:

```text
http://localhost:5000
```

#### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_URL` from [frontend/.env.example](frontend/.env.example), which defaults to `http://localhost:5000/api`.

Frontend default URL:

```text
http://localhost:5173
```

#### 3) ML engine

```bash
cd ml-engine
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
python api.py
```

Trained model artifacts are included in `ml-engine/models/`, so training is not required to start the API. To regenerate them from the synthetic data, run `python train.py` before starting the service.

ML API default URL:

```text
http://localhost:5001
```

### Option 2: full stack with Docker Compose

First create the backend environment file. In Docker Compose, the backend must reach the ML service by its service name, not `localhost`:

```powershell
Copy-Item backend/.env.example backend/.env
```

On macOS/Linux, use `cp backend/.env.example backend/.env`.

Set `ML_ENGINE_URL` in `backend/.env` to `http://ml-engine:5001`, then run from the repository root:

```bash
docker compose up --build
```

This starts the backend, frontend, and ML engine using [docker-compose.yml](docker-compose.yml). The frontend is available at `http://localhost:5173`, the backend at `http://localhost:5000`, and the ML API at `http://localhost:5001`.

## Environment variables

The backend uses a local `.env` file based on the template in [backend/.env.example](backend/.env.example):

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
ML_ENGINE_URL="http://localhost:5001"
NODE_ENV="development"
```

For local development, the ML engine URL uses `localhost`. When running the backend in Docker Compose, use `http://ml-engine:5001` instead. Keep real secrets out of source control and use a unique `JWT_SECRET` outside local development.

## API and ML flow

The backend exposes API documentation at `http://localhost:5000/api/docs` and a health check at `http://localhost:5000/health`. It communicates with the ML service over HTTP. The ML endpoints include:

- `GET /health`
- `POST /biomarker/analyze`
- `POST /imaging/analyze`
- `POST /imaging/heatmap`
- `POST /fusion/analyze`
- `POST /assess/full`

These endpoints are intended to support a complete assessment workflow from raw modality data to a fused risk summary.

Assessment requests must provide a source status for each modality (`measured`, `simulated`, `collected`, or `not_provided`). Only inputs marked as measured are forwarded to inference; generated demo values and collected MRI files are excluded. The patient speech flow supports an explicit-consent microphone recording of up to 30 seconds. `POST /api/assessments/speech-capture` requires an authenticated patient and their own session. The recording is processed in backend memory for the request, then discarded; only its format, size, duration, and consent timestamp are saved. It is marked `collected`, not `measured`, and is not analyzed or scored.

The patient flow also allows an optional single-file DICOM (`.dcm`) or NIfTI (`.nii`, `.nii.gz`) research upload up to 64 MB through `POST /api/assessments/mri-capture`. Explicit consent and an authenticated patient's own session are required. The raw scan is held temporarily in backend memory and is not written to disk or the database; only the file type, size, and consent timestamp are recorded. MRI files are not parsed for clinical findings, analyzed, or scored. Multi-file DICOM series are not supported. Use de-identified research files only; this prototype is not approved for real patient information.

With no measured feature inputs the API records provenance and returns no risk score. The guided patient activities remain demonstrations or unvalidated questions and do not produce supported measured inputs, so this patient flow does not currently generate a score. The included models were trained on synthetic data and are not validated for clinical use.

Clinicians can enter motor/gait values, scores from an authorized cognitive assessment, or numeric findings transcribed from an imaging report in the clinician dashboard. `POST /api/assessments/clinical-measurements` is restricted to clinician accounts and stores the named source, values, and collection provenance separately from model inputs. These records are not analyzed and do not generate a risk score. The prototype does not interpret MRI scans or imaging report findings.

The authorization prototype now models organizations, organization memberships, patient affiliations, and explicit clinician-to-patient assignments. Patient access is restricted to the patient's own profile; clinician access requires an active assignment and active membership/affiliation in the same organization. Administrators are not granted chart access, and public registration is patient-only. Organization, staff membership, and assignment provisioning workflows are not implemented; because staff MFA is also absent, do not use this prototype's authorization model with real patient information.

These collection flows are development prototypes, not production patient-data services. Do not enter real patient information in this deployment. Production use requires independently verified access controls and provisioning, staff MFA, secure transport and storage, tamper-evident audit logging, privacy and retention policies, consent workflows, clinical validation, and regulatory review. Do not send real patient recordings over an untrusted or non-HTTPS connection.

## Project status

This is a working prototype and research-oriented proof of concept. It includes a functioning frontend shell, backend service structure, Prisma models, and a multimodal ML pipeline that runs end to end.

Important note: the current ML system uses synthetic clinical-style data rather than validated real-world patient data. It is not yet production-ready for clinical diagnosis or patient-facing decision support without additional validation, regulatory review, and model benchmarking.

## Current strengths

- modular separation between app layers
- explainable risk scoring concept
- multimodal fusion of imaging, speech, motor, cognitive, and ocular signals
- clear project structure for future extension
- suitable as a prototype or internal demo platform

## License and usage note

This repository is intended for demonstration, education, and research prototype purposes. It should not be treated as a validated clinical tool without additional review and regulatory safeguards.

## Conclusion

NeuroEarly AI offers a strong conceptual foundation for a multimodal early-risk screening system. The project demonstrates how an explainable healthcare AI pipeline can be structured across frontend, backend, and ML layers, and it provides a practical base for further development into a production-grade platform.
