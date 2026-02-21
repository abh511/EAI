#!/bin/bash

echo "🔄 Restarting Backend..."
echo ""

# Kill existing uvicorn processes
echo "Stopping existing backend..."
pkill -f "uvicorn app.main:app" 2>/dev/null

sleep 2

# Navigate to backend
cd backend

# Activate virtual environment and start server
echo "Starting backend with demo auth bypass..."
source venv/bin/activate
uvicorn app.main:app --reload &

echo ""
echo "✅ Backend restarting..."
echo ""
echo "Wait 5 seconds, then test:"
echo "  curl http://localhost:8000/api/health"
echo ""
echo "Demo login:"
echo "  Email: demo@demo.com"
echo "  Password: anything"
echo ""
