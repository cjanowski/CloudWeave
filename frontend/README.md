# CloudWeave Frontend

Modern React frontend for the CloudWeave cloud platform engineering application.

## Features

- **Modern React 18** with TypeScript
- **Material-UI (MUI)** for consistent design system
- **Redux Toolkit** for state management
- **React Query** for server state management
- **React Router** for client-side routing
- **Responsive Design** with mobile-first approach
- **Authentication** with JWT tokens
- **Real-time Updates** with WebSocket support (planned)

## Architecture

### Core Components

- **Layout System**: Responsive sidebar navigation with header
- **Authentication**: Login/logout with JWT token management
- **Dashboard**: Overview of system metrics and status
- **Feature Modules**: Infrastructure, Deployments, Monitoring, Security, Cost Management

### State Management

- **Redux Toolkit** for global application state
- **React Query** for server state and caching
- **Local State** with React hooks for component-specific state

### Routing Structure

```
/                     -> Dashboard (redirect)
/dashboard           -> Main dashboard
/infrastructure/*    -> Infrastructure management
/deployments/*       -> Deployment pipelines
/monitoring/*        -> System monitoring
/security/*          -> Security and compliance
/cost-management/*   -> Cost tracking and optimization
/settings/*          -> Application settings
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_NODE_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Code Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Header, Sidebar)
│   ├── common/         # Common components (LoadingSpinner, ErrorBoundary)
│   └── Notifications/  # Notification system
├── pages/              # Page components
│   ├── Auth/          # Authentication pages
│   ├── Dashboard/     # Dashboard page
│   ├── Infrastructure/ # Infrastructure pages
│   ├── Deployments/   # Deployment pages
│   ├── Monitoring/    # Monitoring pages
│   ├── Security/      # Security pages
│   ├── CostManagement/ # Cost management pages
│   └── Settings/      # Settings pages
├── services/          # API service clients
├── store/             # Redux store and slices
├── theme/             # Material-UI theme configuration
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

### Testing

The application uses Jest and React Testing Library for testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Docker

```bash
# Build Docker image
docker build -t cloudweave-frontend .

# Run container
docker run -p 3000:3000 cloudweave-frontend
```

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new components and features
3. Update documentation as needed
4. Use TypeScript for type safety
5. Follow Material-UI design principles

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React.lazy()
- Image optimization
- Bundle size monitoring
- Lighthouse performance audits