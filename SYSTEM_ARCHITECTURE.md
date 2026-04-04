# BloodByTap System Architecture

## 1. Architecture Style

The system uses a client-server architecture with a clear separation between presentation, API, and data layers.

- Frontend: React SPA (Vite) for user interface and state management
- Backend: Node.js + Express REST API for business logic and security
- Database: MongoDB (Mongoose ODM) for persistent storage
- External Services: Google Geocoding API and Firebase Cloud Messaging (optional)

## 2. High-Level View

```text
+-------------------------------+
| Frontend (React + Redux)      |
| - Pages, Routing, UI state    |
| - Axios API client            |
+---------------+---------------+
                |
                | HTTPS / JSON
                v
+-------------------------------+
| Backend (Express API)         |
| - Auth, Users, Alerts,        |
|   Emergencies routes          |
| - Middleware (JWT, Roles)     |
| - Services (Notifications)    |
| - Utils (Geocoding, Distance) |
+---------------+---------------+
                |
                | Mongoose
                v
+-------------------------------+
| MongoDB                       |
| - User, Alert, Emergency      |
+-------------------------------+

External integrations:
- Google Maps Geocoding API (address -> coordinates)
- Firebase Admin / FCM (push notifications)
```

## 3. Backend Layered Design

### 3.1 API Layer (Routes)

- auth routes: registration, login, current user
- user routes: profile, availability, FCM token, nearby donors
- alert routes: create alert, expand radius, donor responses, fulfill
- emergency routes: report, acknowledge, handle

### 3.2 Middleware Layer

- authenticate: validates JWT and attaches user context
- role guards: donor-only and institution-only authorization

### 3.3 Domain/Data Layer

- User model: shared identity with donorProfile and institutionProfile
- Alert model: institution blood request lifecycle
- Emergency model: urgent event lifecycle and institution handling

### 3.4 Service Layer

- notification service: wraps Firebase Admin SDK for push delivery

### 3.5 Utility Layer

- geocoding utility: geocode and reverse geocode using Google API
- location utility: distance calculations and radius filtering via geolib

## 4. Frontend Architecture

### 4.1 Application Structure

- App routes for public and protected pages
- Layout and ProtectedRoute components for shell and access control
- Feature pages for donor and institution workflows

### 4.2 State Management

Redux Toolkit is used with feature slices:

- authSlice: auth state, register/login/getCurrentUser, token persistence
- userSlice: profile and donor availability
- alertSlice: alert creation/list/details/actions
- emergencySlice: emergency reporting and handling

### 4.3 API Access Layer

- Central Axios instance with base URL from environment
- Request interceptor for Authorization header
- Response interceptor for auth failure handling

## 5. Core Runtime Flows

### 5.1 Registration/Login Flow

1. Frontend submits credentials/profile to auth endpoints.
2. Backend validates request payload.
3. Backend checks existing user and hashes password.
4. Backend stores user in MongoDB.
5. Backend returns JWT + basic user identity.
6. Frontend stores token/user and updates authenticated state.

### 5.2 Alert Flow (Institution -> Donor)

1. Institution creates an alert with blood details and location.
2. Backend resolves coordinates if needed.
3. Backend finds candidate donors by blood type, age, availability, and distance.
4. Backend persists matched donor records in alert.
5. Notification service attempts to push notify matching donors.
6. Donors respond; institution can fulfill or expand radius.

### 5.3 Emergency Flow (User -> Institution)

1. User reports emergency with location and urgency.
2. Backend finds nearby institutions.
3. Backend records notified institutions.
4. Institutions acknowledge and later mark as handled.

## 6. Data and Security Considerations

- Passwords are hashed with bcrypt before persistence.
- JWT is required for protected endpoints.
- Role-based authorization protects donor/institution actions.
- Input validation is performed on route boundaries.
- Sensitive config is externalized through environment variables.

## 7. Deployment and Environment Model

### 7.1 Frontend

- Runs on Vite dev server during development
- Uses environment variable for API base URL

### 7.2 Backend

- Runs as Node/Express process (nodemon in development)
- Requires MongoDB connectivity through MONGODB_URI

### 7.3 Required Configuration

- MONGODB_URI
- JWT_SECRET and JWT_EXPIRE
- Optional for notifications: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
- Optional for geocoding: GOOGLE_MAPS_API_KEY

## 8. Current Observations for This Project

- Registration and authentication depend on MongoDB and JWT, not Firebase DB.
- Firebase is used for push notifications only.
- If Firebase credentials are missing or invalid, API can still run, but notifications are disabled.
- If MongoDB is unavailable, backend startup fails and API endpoints cannot be served.
