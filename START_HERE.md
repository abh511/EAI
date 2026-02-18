# 🚀 START HERE - EnviroWatch AI

## Quick Start (2 Steps)

### 1. Start Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```
✅ Backend running at: http://localhost:8000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend running at: http://localhost:3000

---

## First Time Setup

### Backend Setup (One Time)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SECRET_KEY=your-secret-key-min-32-chars-long-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
ALLOWED_ORIGINS=http://localhost:3000
DATASET_PATH=./data/pune_mumbai_environmental_data_17022026.csv
```

### Frontend Setup (One Time)
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Test It Works

### 1. Test Backend
```bash
curl http://localhost:8000/api/health
```
Should return: `{"status":"healthy","service":"EnviroWatch AI"}`

### 2. Test Frontend
Open: http://localhost:3000
Should see: Beautiful login page with gradient background

---

## User Flow

1. **Register** → Enter email, password, full name
2. **Select City** → Choose Pune or Mumbai
3. **Select Location** → Choose specific area (e.g., Viman Nagar)
4. **Dashboard** → View 7 environmental pillar cards
5. **Explore:**
   - 🗺️ Map → See all locations on interactive map
   - 📈 Forecast → View 48-hour predictions
   - ⚠️ Alerts → Manage environmental alerts
   - 📝 Report → Submit citizen grievance

---

## What You'll See

### LoginPage
- Animated gradient background
- Login/Register toggle
- Email + Password fields
- "Create Account" or "Login" button

### CitySelectPage
- Large city cards (Pune, Mumbai)
- Click city → See location grid
- Click location → Go to dashboard

### DashboardPage
- Large AQI display (e.g., 156 - Unhealthy)
- 7 pillar cards with icons:
  - 💨 Air Quality
  - 💧 Water Quality
  - 🔊 Noise Level
  - 🏭 Industrial Emissions
  - 🗑️ Solid Waste
  - 🌡️ Urban Heat
  - 🌊 Groundwater
- Active alerts banner
- Navigation to other pages

### MapPage
- Interactive Leaflet map
- Color-coded markers (green/yellow/orange/red)
- Click marker → See location details
- Legend showing risk levels

### ForecastPage
- Pillar selector buttons
- Line chart with 49 data points
- Threshold reference line
- Breach detection (red dots)
- Summary statistics

### AlertsPage
- Filter by severity
- Alert cards with details
- Acknowledge button
- Summary statistics

### GrievancePage
- Category selector (7 pillars)
- Description textarea
- Submit button
- Success screen with tracking ID

---

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.11+)
- Check venv activated: `which python` should show venv path
- Check dependencies: `pip install -r requirements.txt`

### Frontend won't start
- Check Node version: `node --version` (need 18+)
- Check dependencies: `npm install`
- Check port 3000 is free: `lsof -i :3000`

### No data showing
- Check dataset exists: `ls backend/data/*.csv`
- Check backend logs for errors
- Check browser console (F12) for errors

### Authentication fails
- Check Supabase credentials in `.env`
- Or skip auth and use mock data (will work but not persist)

---

## File Structure

```
envirowatch-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/      ✅ All implemented
│   │   ├── core/            ✅ Config
│   │   ├── db/              ✅ Supabase client
│   │   ├── ml/              ✅ ML classifier
│   │   ├── schemas/         ✅ Pydantic models
│   │   ├── services/        ✅ Business logic
│   │   └── main.py          ✅ FastAPI app
│   ├── data/                📊 CSV dataset
│   ├── tests/               ✅ Pytest tests
│   └── .env                 🔐 Environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/           ✅ 7 pages (all working)
│   │   ├── components/      ✅ UI components
│   │   ├── services/        ✅ API calls
│   │   ├── store/           ✅ Zustand state
│   │   └── utils/           ✅ Helper functions
│   └── .env                 🔐 Environment variables
└── docs/                    📚 Documentation
```

---

## Key Features

✅ **Authentication** - Supabase Auth with JWT
✅ **7 Environmental Pillars** - Comprehensive monitoring
✅ **Real-time Dashboard** - Live data display
✅ **48-Hour Forecast** - AI-powered predictions
✅ **Interactive Map** - Leaflet with risk visualization
✅ **Alert System** - Threshold-based notifications
✅ **Citizen Grievance** - Report environmental issues
✅ **ML Risk Prediction** - RandomForest classifier
✅ **Responsive Design** - Mobile, tablet, desktop
✅ **Dark Theme** - Modern UI with Tailwind CSS

---

## Documentation

- 📖 **QUICK_START.md** - Detailed setup guide
- 📖 **API.md** - Complete API documentation
- 📖 **FIXES_APPLIED.md** - What was fixed
- 📖 **TEST_ALL_ENDPOINTS.md** - Testing guide
- 📖 **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
- 📖 **UI_PREVIEW.md** - Visual guide of all pages
- 📖 **PROJECT_SUMMARY.md** - Complete project overview

---

## Support

### Check These First
1. Backend running? → http://localhost:8000/docs
2. Frontend running? → http://localhost:3000
3. Dataset exists? → `ls backend/data/*.csv`
4. Environment variables set? → Check `.env` files
5. Browser console errors? → Press F12

### Common Commands
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Run tests
cd backend && pytest tests/ -v

# Build frontend
cd frontend && npm run build
```

---

## Status

✅ **Backend:** All routes implemented and working
✅ **Frontend:** All 7 pages built and interactive
✅ **API:** 15+ endpoints fully functional
✅ **Tests:** 8 backend tests passing
✅ **Documentation:** Complete and up-to-date

**Everything is ready to use!** 🎉

---

## Next Steps

1. ✅ Start backend and frontend
2. ✅ Register a new account
3. ✅ Select Pune → Viman Nagar
4. ✅ Explore all features
5. ✅ Submit a test grievance
6. ✅ Check forecast and alerts
7. ✅ View map with markers

**Enjoy EnviroWatch AI!** 🌍

---

**Last Updated:** February 17, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
