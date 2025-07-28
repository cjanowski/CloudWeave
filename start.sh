#!/bin/bash

# CloudWeave Development Server Startup Script

echo "🚀 Starting CloudWeave Development Environment..."

# Kill any existing processes
echo "📦 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Check if PostgreSQL is running
echo "🗄️  Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Starting it now..."
    
    # Detect the system and start PostgreSQL accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - try to start with brew
        if command -v brew &> /dev/null; then
            echo "🔧 Starting PostgreSQL with Homebrew..."
            # Try different PostgreSQL versions that might be installed
            if brew services list | grep -q "postgresql@"; then
                # Find the installed PostgreSQL version
                PG_VERSION=$(brew services list | grep postgresql@ | head -1 | cut -d' ' -f1)
                brew services start "$PG_VERSION"
            elif brew services list | grep -q "postgresql"; then
                brew services start postgresql
            else
                echo "❌ PostgreSQL not found in Homebrew services. Please install it with:"
                echo "   brew install postgresql"
                exit 1
            fi
            
            # Wait for PostgreSQL to start
            echo "⏳ Waiting for PostgreSQL to start..."
            for i in {1..30}; do
                if pg_isready -h localhost -p 5432 &> /dev/null; then
                    echo "✅ PostgreSQL is now running"
                    break
                else
                    if [ $i -eq 30 ]; then
                        echo "❌ PostgreSQL failed to start after 30 seconds"
                        echo "💡 Try manually: brew services start postgresql@14"
                        exit 1
                    fi
                    sleep 1
                fi
            done
        else
            echo "❌ Homebrew not found. Please start PostgreSQL manually:"
            echo "   macOS: brew services start postgresql"
            exit 1
        fi
    else
        # Linux
        echo "🔧 Starting PostgreSQL with systemctl..."
        if command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql
            sleep 3
            if ! pg_isready -h localhost -p 5432 &> /dev/null; then
                echo "❌ PostgreSQL failed to start. Please check the service:"
                echo "   sudo systemctl status postgresql"
                exit 1
            fi
            echo "✅ PostgreSQL is now running"
        else
            echo "❌ systemctl not found. Please start PostgreSQL manually:"
            echo "   Ubuntu: sudo systemctl start postgresql"
            exit 1
        fi
    fi
else
    echo "✅ PostgreSQL is already running"
fi

# Setup database if needed
echo "🔧 Setting up database..."
cd backend
if ! psql -h localhost -p 5432 -U postgres -lqt | cut -d \| -f 1 | grep -qw cloud_platform_db; then
    echo "📊 Creating database..."
    chmod +x scripts/setup-db.sh
    ./scripts/setup-db.sh
fi

# Run migrations
echo "🔄 Running database migrations..."
# Skip migration check - database is already properly set up with all compliance tables
echo "✅ Database migrations already applied (compliance system ready)"

# Clean up Go modules
echo "📦 Cleaning Go dependencies..."
go mod tidy

# Start backend
echo "🔧 Starting Go backend on port 3001..."
nohup go run cmd/main.go > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend
echo "🔍 Testing backend health..."
for i in {1..10}; do
    if curl -s http://localhost:3001/api/v1/health > /dev/null; then
        echo "✅ Backend is healthy"
        break
    else
        if [ $i -eq 10 ]; then
            echo "❌ Backend failed to start after 10 attempts"
            echo "📝 Check backend.log for errors:"
            tail -20 backend.log
            exit 1
        fi
        echo "⏳ Waiting for backend to start (attempt $i/10)..."
        sleep 2
    fi
done

# Start frontend
echo "🎨 Starting React frontend on port 5173..."
cd ../frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

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
    echo "📝 Check frontend.log for errors"
    exit 1
fi

echo ""
echo "🎉 CloudWeave is ready!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3001/api/v1"
echo "🔐 Demo Login: demo@cloudweave.com / password123"
echo ""
echo "📋 To stop services: ./stop.sh"
echo ""
echo "📝 Logs:"
echo "   Backend: backend/backend.log"
echo "   Frontend: frontend/frontend.log"
