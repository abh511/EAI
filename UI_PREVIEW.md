# EnviroWatch AI — UI Preview Guide

This document describes what you'll see when you run the application.

---

## 🎨 Page-by-Page Visual Guide

### 1. LoginPage (http://localhost:3000/login)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [Animated gradient background]                 │
│                                                             │
│                    🍃 [Leaf Icon]                          │
│                 EnviroWatch AI                             │
│     Environmental Risk Detection for Indian Cities         │
│                                                             │
│    ┌───────────────────────────────────────────┐          │
│    │  [Login]  │  Register                     │          │
│    ├───────────────────────────────────────────┤          │
│    │                                           │          │
│    │  📧 Email Address                         │          │
│    │  [you@example.com.....................]   │          │
│    │                                           │          │
│    │  🔒 Password                              │          │
│    │  [••••••••...........................]   │          │
│    │                                           │          │
│    │  [🛡️  Login                    ]          │          │
│    │                                           │          │
│    │  Don't have an account? Register here    │          │
│    └───────────────────────────────────────────┘          │
│                                                             │
│         🌍          🤖          ⚡                         │
│      7 Pillars   AI Powered   Real-time                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Toggle between Login/Register tabs
- Animated gradient background with floating orbs
- Form validation (email format, password min 6 chars)
- Loading spinner during authentication
- Success toast → redirects to city selection

---

### 2. CitySelectPage (http://localhost:3000/select-city)

**Step 1: City Selection**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              Select Your Location                           │
│     Choose a city and location to monitor environmental data│
│                                                             │
│    ┌──────────────────┐    ┌──────────────────┐          │
│    │   🏢             │    │   🏢             │          │
│    │                  │    │                  │          │
│    │   Pune           │    │   Mumbai         │          │
│    │   10 locations   │    │   10 locations   │          │
│    │              →   │    │              →   │          │
│    └──────────────────┘    └──────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Location Selection (after clicking Pune)**
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back to Cities]                                         │
│                                                             │
│  Pune                                                       │
│  Select a location to monitor                               │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ 📍       │ │ 📍       │ │ 📍       │                  │
│  │ Viman    │ │ Hadapsar │ │ Kothrud  │                  │
│  │ Nagar    │ │          │ │          │                  │
│  │ Mixed    │ │ Indust.  │ │ Resid.   │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ 📍       │ │ 📍       │ │ 📍       │                  │
│  │ Shivaji  │ │ Pimpri   │ │ Wakad    │                  │
│  │ Nagar    │ │          │ │          │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. DashboardPage (http://localhost:3000/dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│ [📍 Change Location] │ Viman Nagar, Pune • Mixed    [🔄][🚪]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Air Quality Index                    Overall Risk    │ │
│  │  156  [UNHEALTHY]                     [MEDIUM]        │ │
│  │  ⚠️  3 active alerts                  [View All →]   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Dashboard] [Map View] [48hr Forecast] [Alerts] [Report]  │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 💨       │ │ 💧       │ │ 🔊       │ │ 🏭       │    │
│  │ Air      │ │ Water    │ │ Noise    │ │ Indust.  │    │
│  │ Quality  │ │ Quality  │ │ Level    │ │ Emissions│    │
│  │ 156 AQI  │ │ 72 WQI   │ │ 68 dB(A) │ │ 85 NOx   │    │
│  │[UNHEALTHY]│ │[GOOD]    │ │[MODERATE]│ │[HIGH]    │    │
│  │ ↑        │ │ ↓        │ │ →        │ │ ↑        │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ 🗑️       │ │ 🌡️       │ │ 🌊       │                  │
│  │ Solid    │ │ Urban    │ │ Ground-  │                  │
│  │ Waste    │ │ Heat     │ │ water    │                  │
│  │ 35% rec. │ │ 32°C     │ │ 450 TDS  │                  │
│  │[MODERATE]│ │[GOOD]    │ │[GOOD]    │                  │
│  │ ↓        │ │ →        │ │ ↑        │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│                                                             │
│  Last updated: 17 Feb 2026, 14:30 IST                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Large AQI display with color-coded status
- 7 pillar cards with icons, values, status badges
- Trend indicators (↑ up, ↓ down, → stable)
- Active alerts banner
- Quick navigation to other pages
- Refresh and logout buttons

---

### 4. MapPage (http://localhost:3000/map)

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  Risk Map • Pune Environmental Overview            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Interactive Leaflet Map]                                  │
│                                                             │
│  ● Viman Nagar (AQI: 156, Risk: Medium)                   │
│  ● Hadapsar (AQI: 178, Risk: High)                        │
│  ● Kothrud (AQI: 132, Risk: Medium)                       │
│  ● Shivaji Nagar (AQI: 145, Risk: Medium)                 │
│                                                             │
│  [Click marker for details]                                 │
│                                                             │
│  ┌─────────────┐                    ┌──────────────┐      │
│  │ Risk Levels │                    │ 📍 10        │      │
│  │ ● Low       │                    │   locations  │      │
│  │ ● Medium    │                    └──────────────┘      │
│  │ ● High      │                                           │
│  │ ● Critical  │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Full-screen interactive map
- Color-coded circle markers by risk level
- Clickable markers with popups
- Location details (name, AQI, risk)
- "View Details" button in popup
- Legend showing risk levels
- Location counter

---

### 5. ForecastPage (http://localhost:3000/forecast)

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  48-Hour Forecast • Viman Nagar, Pune             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Environmental Pillar                                │
│  [Air Quality] [Water] [Noise] [Industrial] [Heat] [GW]    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚠️  AQI Forecast                                      │ │
│  │ AQI is predicted to breach the 150 AQI limit for     │ │
│  │ 18 hours in the next 48 hours.                       │ │
│  │ Threshold: 150 AQI • Peak Risk: 18 Feb, 09:00       │ │
│  │ Breach Hours: 18 / 48                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  AQI Levels - Next 48 Hours                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 200│                    ●                             │ │
│  │    │                 ●     ●                          │ │
│  │ 150├─────────────────────────────── Threshold        │ │
│  │    │           ●                 ●                    │ │
│  │ 100│      ●                           ●              │ │
│  │    │  ●                                   ●          │ │
│  │  50│                                         ●       │ │
│  │    └────────────────────────────────────────────────│ │
│  │     00:00  06:00  12:00  18:00  24:00  30:00  36:00 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ Current  │ │ Average  │ │ Peak     │                  │
│  │ 156.2    │ │ 168.5    │ │ 189.3    │                  │
│  │ AQI      │ │ AQI      │ │ AQI      │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Pillar selector buttons
- Summary card with breach prediction
- Interactive line chart (Recharts)
- Threshold reference line
- Red dots for breach points
- Hover tooltip with details
- Current, average, peak value cards

---

### 6. AlertsPage (http://localhost:3000/alerts)

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  Active Alerts • Viman Nagar, Pune        3 alerts│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Filter by severity:                                     │
│  [All] [Critical] [High] [Medium] [Low]                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚠️  [HIGH] AIR                                        │ │
│  │ PM2.5                                  [Acknowledge]  │ │
│  │ PM2.5 at Viman Nagar is 87.3 µg/m³ (46% above       │ │
│  │ safe limit of 60 µg/m³)                              │ │
│  │ Observed: 87.3 • Threshold: 60.0                     │ │
│  │ Authority: CPCB / MPCB • Created: 17 Feb 2026        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚠️  [MEDIUM] NOISE                                    │ │
│  │ Noise (Day)                            [Acknowledge]  │ │
│  │ Noise at Viman Nagar is 72.1 dB(A) (11% above       │ │
│  │ safe limit of 65 dB(A))                              │ │
│  │ Observed: 72.1 • Threshold: 65.0                     │ │
│  │ Authority: MPCB Noise Cell • Created: 17 Feb 2026    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Critical │ │ High     │ │ Medium   │ │ Low      │    │
│  │ 0        │ │ 1        │ │ 2        │ │ 0        │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Filter by severity
- Alert cards with severity badges
- Parameter details (observed vs threshold)
- Authority information
- Acknowledge button
- Summary statistics
- Empty state for no alerts

---

### 7. GrievancePage (http://localhost:3000/grievance)

**Submission Form:**
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  Report Environmental Issue                        │
│           Help us improve environmental quality in your area│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📄 Citizen Grievance System                           │ │
│  │ Report environmental violations or concerns in your   │ │
│  │ area. Your submission will be forwarded to the        │ │
│  │ appropriate authority for action.                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📍 Reporting for: Viman Nagar, Pune                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Grievance Details                                          │
│                                                             │
│  Environmental Category                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐                        │
│  │ 💨     │ │ 💧     │ │ 🔊     │                        │
│  │ Air    │ │ Water  │ │ Noise  │                        │
│  │ Quality│ │ Quality│ │ Pollut.│                        │
│  └────────┘ └────────┘ └────────┘                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 🏭     │ │ 🗑️     │ │ 🌡️     │ │ 🌊     │            │
│  │ Indust.│ │ Waste  │ │ Heat   │ │ Ground │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                             │
│  Description *                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Describe the environmental issue in detail...         │ │
│  │                                                       │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│  Minimum 10 characters • 0 / 500                           │
│                                                             │
│  [📤 Submit Grievance                              ]       │
│                                                             │
│  Your grievance will be reviewed within 48 hours.          │
│  You will receive a tracking ID to monitor the status.     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Success Screen:**
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  Grievance Submitted                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ✅                                       │
│                                                             │
│                Thank You!                                   │
│                                                             │
│  Your grievance has been submitted successfully.           │
│  The concerned authority will review it shortly.           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Your Tracking ID                                      │ │
│  │ GRV-2026-001234                          [Copy]       │ │
│  │ Save this ID to track your grievance status           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Submit Another]  [Go to Dashboard]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding

### Status Colors
- **Good:** 🟢 Green (#10b981)
- **Moderate:** 🟡 Yellow (#f59e0b)
- **Unhealthy:** 🟠 Orange (#f97316)
- **Critical:** 🔴 Red (#dc2626)

### Pillar Colors
- **Air:** 🔵 Blue (#60a5fa)
- **Water:** 🟢 Green (#34d399)
- **Noise:** 🟡 Yellow (#fbbf24)
- **Industrial:** 🔴 Red (#f87171)
- **Waste:** 🟣 Purple (#a78bfa)
- **Heat:** 🟠 Orange (#fb923c)
- **Groundwater:** 🔵 Teal (#2dd4bf)

---

## 🎭 Animations

### Loading States
- Spinning loader icon
- Pulsing skeleton screens
- Smooth fade-ins

### Interactions
- Hover scale (1.05x)
- Button press effects
- Smooth transitions (200ms)
- Toast slide-in animations

### Background
- Gradient animations
- Floating orbs (pulse effect)
- Parallax scrolling

---

## 📱 Mobile View

All pages are fully responsive:
- Single column layouts
- Touch-friendly buttons (min 44px)
- Collapsible navigation
- Optimized charts
- Swipeable cards

---

## 🎯 User Experience

### Navigation Flow
1. Login → City Select → Dashboard
2. Dashboard → Map/Forecast/Alerts/Grievance
3. Any page → Back to Dashboard
4. Dashboard → Logout → Login

### Feedback
- ✅ Success toasts (green)
- ❌ Error toasts (red)
- ℹ️ Info toasts (blue)
- ⚠️ Warning toasts (yellow)

### Loading States
- Spinner with message
- Disabled buttons during loading
- Skeleton screens (optional)

---

## 🚀 Getting Started

1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Open http://localhost:3000
4. Register a new account
5. Select Pune → Viman Nagar
6. Explore the dashboard!

---

**Enjoy exploring EnviroWatch AI!** 🌍
