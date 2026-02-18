# EnviroWatch AI — Deployment Checklist ✅

Use this checklist to ensure everything is set up correctly before deploying.

---

## 📋 Pre-Deployment Checklist

### Backend Setup
- [ ] Python 3.11+ installed
- [ ] Virtual environment created (`python -m venv venv`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with all required variables
- [ ] Supabase project created
- [ ] Supabase credentials added to `.env`
- [ ] Database schema executed in Supabase
- [ ] Dataset CSV file placed in `backend/data/`
- [ ] Backend starts without errors (`uvicorn app.main:app --reload`)
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Health endpoint returns 200 (`curl http://localhost:8000/api/health`)

### Frontend Setup
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with API URL and Supabase keys
- [ ] Frontend starts without errors (`npm run dev`)
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] Build completes successfully (`npm run build`)

### Testing
- [ ] Backend tests pass (`pytest tests/ -v`)
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Can select city and location
- [ ] Dashboard loads with data
- [ ] Map displays markers
- [ ] Forecast shows chart
- [ ] Alerts page loads
- [ ] Can submit grievance
- [ ] Logout works correctly

---

## 🔐 Environment Variables

### Backend `.env`
```env
# Required
SECRET_KEY=your-secret-key-min-32-chars
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Optional (defaults provided)
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
DATASET_PATH=./data/pune_mumbai_environmental_data_17022026.csv
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend `.env`
```env
# Required
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 🗄️ Database Setup

### Supabase Configuration
- [ ] Project created on supabase.com
- [ ] SQL schema executed (`scripts/supabase_schema.sql`)
- [ ] Email authentication enabled
- [ ] Email confirmation disabled (for testing) or SMTP configured
- [ ] Row Level Security (RLS) policies configured
- [ ] API keys copied to `.env` files

### Tables Created
- [ ] `users` (managed by Supabase Auth)
- [ ] `locations`
- [ ] `environmental_data`
- [ ] `alerts`
- [ ] `grievances`

---

## 📊 Dataset Requirements

### CSV File
- [ ] File exists at `backend/data/pune_mumbai_environmental_data_17022026.csv`
- [ ] Contains required columns:
  - `city`, `location`, `zone_type`
  - `latitude`, `longitude`
  - `aqi_us`, `pm2_5_ug_m3`, `pm10_ug_m3`
  - `no2_ug_m3`, `so2_ug_m3`, `nox_ug_m3`, `sox_ug_m3`
  - `noise_day_dba`, `noise_night_dba`
  - `water_bod_mg_l`, `water_tds_mg_l`, `water_quality_index`
  - `gw_nitrate_mg_l`, `gw_fluoride_mg_l`, `gw_tds_mg_l`, `gw_depth_m`
  - `ambient_temp_celsius`, `uhi_intensity`
  - `recycling_pct`, `waste_landfill_pct`
- [ ] At least 100 rows of data
- [ ] Data for both Pune and Mumbai

---

## 🧪 Testing Checklist

### Backend API Tests
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Expected results:
- [ ] `test_health_endpoint` ✅
- [ ] `test_locations_list` ✅
- [ ] `test_locations_pune` ✅
- [ ] `test_dashboard_summary` ✅
- [ ] `test_alerts_active` ✅
- [ ] `test_forecast_48hr` ✅
- [ ] `test_auth_register` ✅ (or ⚠️ if Supabase not configured)
- [ ] `test_grievance_submit` ✅

### Frontend Manual Tests
- [ ] Login page loads
- [ ] Can toggle between Login/Register
- [ ] Form validation works
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Redirects to city selection
- [ ] Can select city (Pune/Mumbai)
- [ ] Can select location
- [ ] Dashboard loads with 7 pillar cards
- [ ] AQI displays correctly
- [ ] Can navigate to Map page
- [ ] Map displays with markers
- [ ] Can navigate to Forecast page
- [ ] Forecast chart displays
- [ ] Can switch between pillars
- [ ] Can navigate to Alerts page
- [ ] Alerts display correctly
- [ ] Can filter alerts by severity
- [ ] Can navigate to Grievance page
- [ ] Can select category
- [ ] Can submit grievance
- [ ] Tracking ID displays
- [ ] Can logout
- [ ] Redirects to login after logout

---

## 🚀 Production Deployment

### Backend (Railway/Render/Heroku)
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Configure build command: `pip install -r requirements.txt`
- [ ] Configure start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Deploy and verify
- [ ] Test API endpoints
- [ ] Check logs for errors

### Frontend (Vercel/Netlify)
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Set environment variables (VITE_*)
- [ ] Deploy and verify
- [ ] Test all pages
- [ ] Check browser console for errors

### Domain & SSL
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] CORS updated with production URLs
- [ ] API base URL updated in frontend

---

## 🔒 Security Checklist

### Backend
- [ ] SECRET_KEY is strong (min 32 chars)
- [ ] DEBUG=False in production
- [ ] CORS configured with specific origins (not *)
- [ ] Supabase RLS policies enabled
- [ ] Service role key kept secret
- [ ] Input validation with Pydantic
- [ ] SQL injection prevention (using ORM)
- [ ] Rate limiting configured (optional)

### Frontend
- [ ] API keys in environment variables (not hardcoded)
- [ ] HTTPS enabled in production
- [ ] XSS protection (React escapes by default)
- [ ] CSRF protection (JWT tokens)
- [ ] Sensitive data not logged to console
- [ ] Error messages don't expose internals

---

## 📈 Performance Checklist

### Backend
- [ ] ML model cached with @lru_cache
- [ ] Database client cached
- [ ] Async operations used
- [ ] Response times < 500ms
- [ ] No N+1 queries
- [ ] Proper indexing on database

### Frontend
- [ ] Build size < 1MB (check with `npm run build`)
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Lazy loading for routes (optional)
- [ ] API calls memoized
- [ ] No unnecessary re-renders

---

## 📱 Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

---

## 📊 Monitoring & Logging

### Backend
- [ ] Loguru configured
- [ ] Error logs captured
- [ ] API response times logged
- [ ] Health check endpoint monitored
- [ ] Uptime monitoring configured (optional)

### Frontend
- [ ] Error boundary catches errors
- [ ] Console errors reviewed
- [ ] Network requests monitored
- [ ] Performance metrics tracked (optional)

---

## 📚 Documentation

- [ ] README.md updated
- [ ] API.md complete
- [ ] QUICK_START.md reviewed
- [ ] Environment variables documented
- [ ] Deployment steps documented
- [ ] Troubleshooting guide available

---

## 🎯 Final Verification

### Smoke Tests
1. [ ] Register new user → Success
2. [ ] Login → Success
3. [ ] Select location → Success
4. [ ] View dashboard → Data loads
5. [ ] View map → Markers display
6. [ ] View forecast → Chart displays
7. [ ] View alerts → Alerts load
8. [ ] Submit grievance → Tracking ID received
9. [ ] Logout → Redirects to login

### Load Testing (Optional)
- [ ] 10 concurrent users
- [ ] 100 requests/minute
- [ ] Response times acceptable
- [ ] No errors under load

---

## 🐛 Common Issues & Solutions

### Issue: Backend won't start
**Solutions:**
- Check Python version (3.11+)
- Verify all dependencies installed
- Check `.env` file exists and is valid
- Review error logs

### Issue: Frontend won't start
**Solutions:**
- Check Node version (18+)
- Run `npm install` again
- Clear `node_modules` and reinstall
- Check for port conflicts (3000)

### Issue: Authentication fails
**Solutions:**
- Verify Supabase credentials
- Check email authentication enabled
- Review Supabase logs
- Test with Supabase dashboard

### Issue: No data on dashboard
**Solutions:**
- Verify dataset CSV exists
- Check CSV has required columns
- Review backend logs
- Test API endpoint directly

### Issue: Map not displaying
**Solutions:**
- Check internet connection (for tiles)
- Verify Leaflet CSS imported
- Check browser console for errors
- Test with different browser

---

## ✅ Deployment Complete!

Once all items are checked:
- [ ] Application is live
- [ ] All features working
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Documentation complete

**Congratulations! EnviroWatch AI is deployed! 🎉**

---

## 📞 Support

If you encounter issues:
1. Check this checklist
2. Review error logs
3. Check documentation files
4. Test in isolation (backend/frontend separately)
5. Verify environment variables
6. Check Supabase dashboard

---

**Last Updated:** February 17, 2026
