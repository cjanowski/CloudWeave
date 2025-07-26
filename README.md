# CloudWeave - Cloud Platform Management System

A modern cloud platform management system built with Go backend and React frontend.

## Pre-Alpha Preview
<img width="1499" height="824" alt="Screenshot 2025-07-26 at 9 10 17 AM" src="https://github.com/user-attachments/assets/3c5750f3-7e84-401f-815e-23a6abda37e0" />

## 🚀 Quick Start

```bash
# Navigate to the project
cd /Users/coryjanowski/Projects/CloudWeave

# Start both backend and frontend
./start.sh
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **Demo Login**: demo@cloudweave.com / password123

## 📁 Project Structure

```
CloudWeave/
├── backend/                 # Go backend (Gin framework)
│   ├── cmd/
│   │   └── main.go         # Application entry point
│   ├── internal/
│   │   ├── config/         # Configuration management
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/     # HTTP middleware
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic
│   ├── pkg/               # Shared packages
│   ├── .env               # Environment variables
│   ├── go.mod             # Go dependencies
│   └── go.sum             # Go dependency checksums
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Node.js dependencies
│   └── .env.development   # Frontend environment config
├── start.sh               # Development startup script
├── Makefile              # Build and development commands
└── README.md             # This file
```

## 🛠️ Manual Setup

### Prerequisites

- Go 1.21 or later
- Node.js 18 or later
- npm or yarn

### Installation

1. Install backend dependencies:
   ```bash
   cd backend && go mod tidy
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```

3. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && go run cmd/main.go
   
   # Terminal 2 - Frontend  
   cd frontend && npm run dev
   ```

### Available Commands

- `make backend` - Start the Go backend server
- `make frontend` - Start the React frontend development server
- `make build` - Build the Go backend
- `make test` - Run Go tests
- `make clean` - Clean build artifacts
- `make fmt` - Format Go code
- `make lint` - Run Go linter

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Health
- `GET /api/v1/health` - Health check

## ⚙️ Environment Variables

Backend `.env` configuration:

```bash
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_platform_db
DB_USER=postgres
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=*
```

Frontend `.env.development` configuration:

```bash
VITE_API_URL=http://localhost:3001/api/v1
```

## 🔧 Development

The backend uses:
- **Gin** - HTTP web framework
- **JWT** - Authentication (placeholder)
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifiers

The frontend uses:
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client

## 🧪 Testing

Demo login credentials:
- Email: `demo@cloudweave.com`
- Password: `password123`

Test API endpoints:
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@cloudweave.com","password":"password123"}'
```

## 🔄 Process Management

To stop services:
```bash
# Kill backend
lsof -ti:3001 | xargs kill -9

# Kill frontend
lsof -ti:5173 | xargs kill -9
```

View logs:
```bash
# Backend logs
tail -f backend/backend.log

# Frontend logs
tail -f frontend/frontend.log
```

## 📋 Next Steps

- [ ] Add database integration (PostgreSQL)
- [ ] Implement proper JWT authentication
- [ ] Add password hashing with bcrypt
- [ ] Add input validation
- [ ] Add comprehensive logging
- [ ] Add unit and integration tests
- [ ] Add Docker support
- [ ] Add CI/CD pipeline
- [ ] Add monitoring and metrics
- [ ] Add API documentation (Swagger)
