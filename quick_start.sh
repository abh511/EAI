#!/bin/bash

echo "🚀 EnviroWatch AI - Quick Start"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install heatmap package if not already installed
echo "📦 Checking dependencies..."
cd frontend
if ! npm list leaflet.heat > /dev/null 2>&1; then
    echo "Installing leaflet.heat..."
    npm install leaflet.heat
else
    echo "✅ leaflet.heat already installed"
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Now start the servers in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Login: demo@test.com / password123"
echo ""
