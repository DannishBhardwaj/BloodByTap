# BloodByTap Frontend

React frontend application for BloodByTap - Emergency Blood Bank Management System.

## Features

- **User Authentication**: Login and registration for donors and institutions
- **Donor Dashboard**: View active alerts matching blood type, manage availability
- **Institution Dashboard**: Create and manage alerts, respond to emergencies
- **Alert Management**: Create alerts with location-based donor matching
- **Emergency Reporting**: Report road emergencies with automatic institution notifications
- **GPS-First Location**: Capture live coordinates first, use address only as fallback
- **Profile Management**: Update user profiles and availability status
- **Real-time Updates**: Redux state management for seamless data flow

## Tech Stack

- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **Date-fns** - Date formatting
- **Vite** - Build tool

## Installation

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── DonorDashboard.jsx
│   │   ├── InstitutionDashboard.jsx
│   │   ├── Alerts.jsx
│   │   ├── AlertDetail.jsx
│   │   ├── CreateAlert.jsx
│   │   ├── Emergencies.jsx
│   │   ├── ReportEmergency.jsx
│   │   └── Profile.jsx
│   ├── store/            # Redux store
│   │   ├── store.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── alertSlice.js
│   │       ├── emergencySlice.js
│   │       └── userSlice.js
│   ├── services/         # API services
│   │   └── api.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── package.json
└── vite.config.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:e2e` - Run Jest tests serially

## Testing

Run the frontend test suite:

```bash
npm test
```

## Features Overview

### Authentication
- User registration with role selection (donor/institution)
- Login with JWT token management
- Protected routes based on authentication status

### Donor Features
- View active alerts matching blood type
- Respond to alerts (accept/decline)
- Report road emergencies
- Manage availability status
- Update profile information

### Institution Features
- Create alerts with blood type requirements
- Expand search radius if no donors found
- View matched donors and their responses
- Respond to road emergencies
- Manage alert status (fulfill/cancel)

### Alert System
- Location-based donor matching (2KM-5KM radius)
- Progressive radius expansion
- Real-time notifications
- Status tracking (active, fulfilled, cancelled)
- GPS-first alert location capture from browser geolocation

### Emergency System
- Report emergencies with location
- Automatic institution notifications
- Emergency acknowledgment workflow
- Status management
- Coordinates-first submission to reduce geocoding wait/failure risk

## State Management

The app uses Redux Toolkit for state management with the following slices:

- **authSlice**: Authentication state, user info, login/logout
- **alertSlice**: Alert creation, fetching, responses
- **emergencySlice**: Emergency reporting and management
- **userSlice**: User profile, availability, nearby donors

## API Integration

All API calls are centralized in `src/services/api.js` using Axios with:
- Automatic token injection
- Error handling
- Request/response interceptors

## Styling

- CSS variables for theming
- Responsive design with mobile-first approach
- Utility classes for common patterns
- Component-specific styles using inline styles

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_SOCKET_URL` - Socket.io server URL for live donor emergency alerts

## Development Notes

- The app uses Vite for fast development and building
- Hot module replacement (HMR) enabled
- Proxy configuration for API calls in development
- Token stored in localStorage for persistence
- Geolocation permissions are required for best emergency performance

## Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment.
