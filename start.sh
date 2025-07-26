#!/bin/bash

# CloudWeave Development Server Startup Script

echo "🚀 Starting CloudWeave Development Environment..."

# Kill any existing processes
echo "📦 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start backend
echo "🔧 Starting Go backend on port 3001..."
cd backend
nohup go run cmd/main.go > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend
echo "🔍 Testing backend health..."
if curl -s http://localhost:3001/api/v1/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting React frontend on port 5173..."
cd ../frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Test frontend
echo "🔍 Testing frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend failed to start"
    exit 1
fi

echo ""
echo "🎉 CloudWeave is ready!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001/api/v1"
echo "🔐 Demo Login: demo@cloudweave.com / password123"
echo ""
echo "📋 To stop services:"
echo "   lsof -ti:3001 | xargs kill -9"
echo "   lsof -ti:5173 | xargs kill -9"
echo ""
echo "📝 Logs:"
echo "   Backend: backend/backend.log"
echo "   Frontend: frontend/frontend.log"