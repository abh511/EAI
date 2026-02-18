# EnviroWatch AI — Quick Start Guide 🚀

## Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account (for authentication)
- Dataset CSV file

---

## 1. Backend Setup

### Install Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure Environment
Create `backend/.env` file:
```env
# App Settings
SECRET_KEY=your-secret-key-here-min-32-chars
DEBUG=True

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Dataset
DATASET_PATH=./data/pune_mumbai_environmental_data_17022026.csv
```

### Place Dataset
Ensure your CSV file is at:
```
backend/data/pune_mumbai_environmental_data_17022026.csv
```

### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

---

## 2. Frontend Setup

### Install Dependencies
```bash
cd frontend
npm install
```

### Configure Environment
Create `frontend/.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## 3. Supabase Setup

### Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note down your project URL and keys

### Run Database Schema
Execute the SQL in `scripts/supabase_schema.sql` in your Supabase SQL Editor

### Enable Authentication
1. Go to Authentication → Settings
2. Enable Email provider
3. Disable email confirmation (for testing) or configure SMTP

---

## 4. Test the Application

### Register a New User
1. Navigate to http://localhost:3000
2. Click "Register"
3. Enter email, password (min 6 chars), and full name
4. Click "Create Account"

### Select Location
1. Choose "Pune" or "Mumbai"
2. Select a location (e.g., "Viman Nagar")

### Explore Features
- **Dashboard:** View 7 environmental pillar cards
- **Map View:** See all locations on interactive map
- **48hr Forecast:** View predictions for any pillar
- **Alerts:** Manage active environmental alerts
- **Report Issue:** Submit citizen grievance

---

## 5. Run Tests

### Backend Tests
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Expected output: 8 tests pass

### Frontend Build Test
```bash
cd frontend
npm run build
```

Should complete without errors

---

## 6. Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'app'`
**Solution:** Make sure you're in the `backend/` directory and venv is activated

**Problem:** `FileNotFoundError: dataset not found`
**Solution:** Place CSV file at `backend/data/pune_mumbai_environmental_data_17022026.csv`

**Problem:** `Supabase connection error`
**Solution:** Check your `.env` file has correct Supabase credentials

### Frontend Issues

**Problem:** `Cannot connect to backend`
**Solution:** Ensure backend is running on port 8000

**Problem:** `Module not found` errors
**Solution:** Run `npm install` again

**Problem:** Map not displaying
**Solution:** Check browser console for Leaflet errors, ensure internet connection for tiles

### Authentication Issues

**Problem:** Registration fails with "Email already registered"
**Solution:** Use a different email or check Supabase dashboard

**Problem:** Login fails with "Invalid credentials"
**Solution:** Ensure you're using the correct email/password

---

## 7. API Endpoints

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Register User
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","full_name":"Test User"}'
```

### Get Locations
```bash
curl http://localhost:8000/api/locations/list
```

### Get Dashboard Data
```bash
curl "http://localhost:8000/api/dashboard/summary?city=Pune&location=Viman%20Nagar"
```

See `docs/API.md` for complete API documentation.

---

## 8. Project Structure

```
envirowatch-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Config
│   │   ├── db/              # Database client
│   │   ├── ml/              # ML models
│   │   ├── schemas/         # Pydantic models
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── data/                # CSV dataset
│   ├── tests/               # Pytest tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API calls
│   │   ├── store/           # Zustand store
│   │   └── utils/           # Helper functions
│   └── package.json
├── docs/
│   └── API.md               # API documentation
└── scripts/
    └── supabase_schema.sql  # Database schema
```

---

## 9. Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/app/`
   - FastAPI auto-reloads on save
   - Test with `pytest tests/`

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Vite auto-reloads on save
   - Check browser console for errors

### Adding New Features

1. **New API Endpoint:**
   - Add route in `backend/app/api/routes/`
   - Add schema in `backend/app/schemas/__init__.py`
   - Register router in `backend/app/main.py`
   - Add API call in `frontend/src/services/api.js`

2. **New Page:**
   - Create component in `frontend/src/pages/`
   - Add route in `frontend/src/App.jsx`
   - Add navigation link in dashboard

---

## 10. Production Deployment

### Backend (Railway/Render/Heroku)
1. Set environment variables
2. Use `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Ensure dataset is included or use cloud storage

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Set `VITE_API_BASE_URL` to production backend URL
3. Deploy `dist/` folder

### Database
- Use Supabase (already configured)
- Or migrate to PostgreSQL on cloud provider

---

## 11. Key Features

✅ **Authentication:** Supabase Auth with JWT tokens
✅ **7 Environmental Pillars:** Air, Water, Noise, Industrial, Waste, Heat, Groundwater
✅ **Real-time Dashboard:** Live environmental data
✅ **48-Hour Forecast:** AI-powered predictions
✅ **Interactive Map:** Leaflet with risk visualization
✅ **Alert System:** Threshold-based notifications
✅ **Citizen Grievance:** Report environmental issues
✅ **ML Risk Prediction:** RandomForest classifier
✅ **Responsive Design:** Mobile, tablet, desktop
✅ **Dark Theme:** Modern UI with Tailwind CSS

---

## 12. Support

For issues or questions:
1. Check `docs/API.md` for API documentation
2. Review `IMPLEMENTATION_COMPLETE.md` for backend details
3. Review `FRONTEND_PAGES_COMPLETE.md` for frontend details
4. Check browser console for frontend errors
5. Check terminal logs for backend errors

---

## 🎉 You're Ready!

Your EnviroWatch AI application is now fully set up and ready to use. Start the backend and frontend servers, register a user, and explore the features!

**Happy Monitoring! 🌍**
