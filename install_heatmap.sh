#!/bin/bash

echo "🚀 Installing Heatmap Feature..."
echo ""

# Navigate to frontend
cd frontend

# Install leaflet.heat
echo "📦 Installing leaflet.heat package..."
npm install leaflet.heat

if [ $? -eq 0 ]; then
    echo "✅ leaflet.heat installed successfully!"
else
    echo "❌ Failed to install leaflet.heat"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Restart frontend: cd frontend && npm run dev"
echo "2. Restart backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Test heatmap: Dashboard → Map View → Click 'Show Heatmap' button"
echo ""
