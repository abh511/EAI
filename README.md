# 🌿 EnviroWatch AI

> AI-powered environmental risk detection & 48-hour forecasting for Indian cities

## Tech Stack
| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS      |
| Maps       | React-Leaflet                     |
| Charts     | Recharts                          |
| State      | Zustand                           |
| Backend    | FastAPI, Uvicorn                  |
| Database   | Supabase (PostgreSQL)             |
| Auth       | Supabase Auth + JWT               |
| ML         | scikit-learn, XGBoost, Prophet    |
| Runtime    | Python 3.11+, Node 20+            |

## Quick Start
```bash
# 1. Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Frontend
cd frontend
npm run dev
```

## Supabase Setup
1. Go to supabase.com → New project
2. SQL Editor → paste scripts/supabase_schema.sql → Run
3. Settings → API → copy URL + anon key
4. Fill in backend/.env and frontend/.env

## Docs
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
