git # 🏙️ Urban Eye – Smart Urban Road & Traffic Intelligence System

cd backend
## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Leaflet, Chart.js |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL (or SQLite for dev) |
| AI Module | YOLOv8, OpenCV, GPXpy |
| Deployment | Docker, Docker Compose |

## Quick Start (Demo Mode — No Backend Required)

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 and click **Enter Demo Mode**.

## Full Stack Setup

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
copy .env.example .env     # Edit DATABASE_URL etc.
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Docker Compose (Full Stack)
```bash
docker-compose up --build
```

## AI Mode
Set `AI_MODE=demo` in `.env` for sample detections (no model needed).  
Set `AI_MODE=model` and place YOLOv8 weights in `ai_module/models/` for real detection.

## Features
- ✅ Video upload & AI-based detection pipeline
- ✅ Interactive GIS map with severity markers
- ✅ Issue management & department assignment
- ✅ AI recommendations for every detection
- ✅ CSV/JSON report export
- ✅ Nearby issues search by GPS
- ✅ Traffic intelligence dashboard
- ✅ Dark/Light mode
- ✅ Demo mode (no backend required)
