#!/bin/bash

# CloudWeave Development Server Stop Script

echo "🛑 Stopping CloudWeave Development Environment..."

# Kill backend processes
echo "🔧 Stopping Go backend..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Kill frontend processes
echo "🎨 Stopping React frontend..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Kill any remaining node processes (in case of orphaned processes)
echo "📦 Cleaning up any remaining processes..."
pkill -f "go run cmd/main.go" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Verify processes are stopped
if lsof -ti:3001 &> /dev/null; then
    echo "⚠️  Warning: Some processes on port 3001 may still be running"
else
    echo "✅ Backend stopped"
fi

if lsof -ti:5173 &> /dev/null; then
    echo "⚠️  Warning: Some processes on port 5173 may still be running"
else
    echo "✅ Frontend stopped"
fi

echo ""
echo "🎉 CloudWeave development environment stopped!"
echo "📝 Logs are preserved in:"
echo "   Backend: backend/backend.log"
echo "   Frontend: frontend/frontend.log"