# BloodByTap — Full Project Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Backend](#5-backend)
   - [Server Setup](#51-server-setup)
   - [Database Models](#52-database-models)
   - [Authentication & Middleware](#53-authentication--middleware)
   - [API Routes](#54-api-routes)
   - [Utilities](#55-utilities)
   - [Notification Service](#56-notification-service)
6. [Frontend](#6-frontend)
   - [Entry Point & Routing](#61-entry-point--routing)
   - [State Management (Redux)](#62-state-management-redux)
   - [API Service Layer](#63-api-service-layer)
   - [Pages & Components](#64-pages--components)
7. [Data Flow](#7-data-flow)
   - [Registration Flow](#71-registration-flow)
   - [Login Flow](#72-login-flow)
   - [Alert Creation Flow](#73-alert-creation-flow-institution)
   - [Alert Response Flow](#74-alert-response-flow-donor)
   - [Emergency Reporting Flow](#75-emergency-reporting-flow-donor)
   - [Emergency Handling Flow](#76-emergency-handling-flow-institution)
8. [Environment Variables](#8-environment-variables)
9. [Running the Project](#9-running-the-project)

---

## 1. Overview

BloodByTap is an emergency blood bank management system that connects two types of users:

- **Donors** — individuals willing to donate blood.
- **Institutions** — hospitals, blood banks, and clinics that need blood.

The platform supports two core workflows:

1. **Alerts** — An institution creates a blood request alert. The system finds nearby donors with matching blood type and age, notifies them, and tracks their responses. The search radius can be expanded incrementally (2 KM → 5 KM in 500 m steps).

2. **Emergencies** — A donor (or any user) reports a road/field emergency needing blood. The system finds nearby institutions within 5 KM and notifies them. An institution can acknowledge and then mark the emergency as handled.

Both workflows rely on geolocation: addresses are geocoded to lat/lng coordinates via Google Maps API, and distance is calculated using the `geolib` library to match users within a configurable radius.

Push notifications are sent through Firebase Cloud Messaging (FCM) when configured.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend                       │
│          React + Redux + React Router            │
│               (Vite, port 3000)                  │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │   Pages    │  │  Store   │  │  API Service  │ │
│  │ (Login,    │◄►│ (Redux   │◄►│ (Axios to    │ │
│  │ Dashboard, │  │  Toolkit)│  │  /api/*)      │ │
│  │ Alerts...) │  │          │  │              │  │
│  └────────────┘  └──────────┘  └──────┬───────┘ │
└──────────────────────────────────────┬───────────┘
                                       │ HTTP (proxied)
                                       ▼
┌──────────────────────────────────────────────────┐
│                   Backend                        │
│           Express.js (port 5000)                 │
│                                                  │
│  ┌──────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  Routes  │  │  Middleware  │  │  Services   │  │
│  │ /auth    │  │  auth.js     │  │ Notification│  │
│  │ /users   │  │  (JWT verify │  │ (Firebase   │  │
│  │ /alerts  │  │   + role     │  │  FCM)       │  │
│  │ /emerg.  │  │   checks)    │  │             │  │
│  └────┬─────┘  └─────────────┘  └─────────────┘  │
│       │                                          │
│  ┌────▼────────┐  ┌─────────────────────┐        │
│  │   Models    │  │      Utilities      │        │
│  │ User        │  │ geocoding.js        │        │
│  │ Alert       │  │ location.js         │        │
│  │ Emergency   │  │ (geolib distance)   │        │
│  └────┬────────┘  └─────────────────────┘        │
└───────┼──────────────────────────────────────────┘
        │
        ▼
   ┌──────────┐
   │ MongoDB  │
   │(Mongoose)│
   └──────────┘
```

The Vite dev server proxies all `/api/*` requests to the Express backend on port 5000.

---

## 3. Tech Stack

### Backend

| Component        | Technology           |
| ---------------- | -------------------- |
| Runtime          | Node.js              |
| Framework        | Express 4            |
| Database         | MongoDB via Mongoose |
| Auth             | JWT (jsonwebtoken)   |
| Password hashing | bcryptjs             |
| Validation       | express-validator    |
| Geolocation      | geolib               |
| Geocoding        | Google Maps API      |
| Push notifs      | Firebase Admin SDK   |

### Frontend

| Component      | Technology                  |
| -------------- | --------------------------- |
| Framework      | React 18                    |
| Build tool     | Vite 5                      |
| Routing        | React Router DOM 6          |
| State mgmt    | Redux Toolkit               |
| HTTP client    | Axios                       |
| Toast notifs   | react-toastify              |
| Icons          | react-icons (Font Awesome)  |
| Date formatting| date-fns                    |

---

## 4. Project Structure

```
BloodByTapBackend/
├── server.js                   # Express app entry point
├── package.json                # Backend dependencies
├── middleware/
│   └── auth.js                 # JWT authentication + role guards
├── models/
│   ├── User.js                 # User schema (donor + institution)
│   ├── Alert.js                # Blood alert schema
│   └── Emergency.js            # Road emergency schema
├── routes/
│   ├── auth.js                 # Register, login, get current user
│   ├── users.js                # Profile CRUD, availability, nearby donors
│   ├── alerts.js               # Alert CRUD, expand radius, respond, fulfill
│   └── emergencies.js          # Emergency CRUD, acknowledge, handle
├── services/
│   └── notificationService.js  # Firebase push notification logic
├── utils/
│   ├── geocoding.js            # Google Maps geocode & reverse geocode
│   └── location.js             # Distance calc, radius filtering (geolib)
│
└── frontend/
    ├── index.html              # HTML shell
    ├── vite.config.js          # Vite config with API proxy
    ├── package.json            # Frontend dependencies
    └── src/
        ├── main.jsx            # React root render
        ├── App.jsx             # Route definitions
        ├── index.css           # Global styles
        ├── components/
        │   ├── Layout.jsx      # Navbar + <Outlet/>
        │   └── ProtectedRoute.jsx  # Auth guard
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── DonorDashboard.jsx
        │   ├── InstitutionDashboard.jsx
        │   ├── Alerts.jsx
        │   ├── AlertDetail.jsx
        │   ├── CreateAlert.jsx
        │   ├── Emergencies.jsx
        │   ├── EmergencyDetail.jsx
        │   ├── ReportEmergency.jsx
        │   └── Profile.jsx
        ├── services/
        │   └── api.js          # Axios instance + API wrappers
        └── store/
            ├── store.js        # Redux store config
            └── slices/
                ├── authSlice.js
                ├── alertSlice.js
                ├── emergencySlice.js
                └── userSlice.js
```

---

## 5. Backend

### 5.1 Server Setup

**File:** `server.js`

- Creates an Express app.
- Applies middleware: `cors()`, `express.json()`, `express.urlencoded()`.
- Mounts four route groups under `/api/`: `auth`, `users`, `alerts`, `emergencies`.
- Provides a health check at `GET /api/health`.
- Includes error-handling middleware (500) and a 404 catch-all.
- Connects to MongoDB (default: `mongodb://localhost:27017/bloodbytap`).
- Listens on the port defined by `PORT` env var (default: 5000).

### 5.2 Database Models

#### User (`models/User.js`)

A single schema serves both roles. The `role` field (`"donor"` or `"institution"`) determines which profile sub-document is populated.

| Field                | Type     | Notes                                          |
| -------------------- | -------- | ---------------------------------------------- |
| `email`              | String   | Unique, lowercase, trimmed.                    |
| `password`           | String   | Hashed via bcrypt pre-save hook. Min 6 chars.  |
| `role`               | String   | `"donor"` or `"institution"`.                  |
| `donorProfile`       | Object   | firstName, lastName, phone, bloodType (A+..O-), age, address (with coordinates), healthStatus, lastDonationDate, isAvailable (default true), fcmToken. |
| `institutionProfile` | Object   | name, type (hospital/blood-bank/clinic/other), phone, address (with coordinates), licenseNumber, contactPerson, fcmToken. |
| `isVerified`         | Boolean  | Default false.                                 |
| `isActive`           | Boolean  | Default true. Inactive users can't login.      |
| `timestamps`         | Auto     | `createdAt`, `updatedAt`.                      |

**Methods:**
- `comparePassword(candidate)` — bcrypt comparison.
- `getCoordinates()` — returns `{latitude, longitude}` from the active profile's address.

#### Alert (`models/Alert.js`)

Created by institutions to request blood from nearby donors.

| Field              | Type       | Notes                                           |
| ------------------ | ---------- | ----------------------------------------------- |
| `institutionId`    | ObjectId   | Ref → User. The creating institution.           |
| `bloodType`        | String     | Required. One of A+, A-, B+, B-, AB+, AB-, O+, O-. |
| `urgency`          | String     | `"critical"`, `"high"`, or `"medium"`.          |
| `quantity`         | Number     | Units of blood needed. Min 1.                   |
| `ageRequirement`   | Object     | `{min: 18, max: 65}` — donor age filter.        |
| `description`      | String     | Optional free text.                             |
| `location`         | Object     | `{address, coordinates: {latitude, longitude}}`. |
| `status`           | String     | `"active"` → `"fulfilled"` / `"cancelled"` / `"expired"`. |
| `currentRadius`    | Number     | Starts at 2000 m (2 KM).                       |
| `maxRadius`        | Number     | Capped at 5000 m (5 KM).                       |
| `radiusIncrement`  | Number     | 500 m per expansion step.                       |
| `matchedDonors`    | Array      | `[{donorId, distance, notifiedAt, respondedAt, status}]`. Status: pending → accepted/rejected/completed. |
| `fulfilledBy`      | ObjectId   | Ref → User. The donor who fulfilled.            |
| `fulfilledAt`      | Date       |                                                 |
| `expiresAt`        | Date       | Default: 24 hours from creation.                |

**Indexes:** geospatial on `location.coordinates`, compound on `status` + `expiresAt`.

#### Emergency (`models/Emergency.js`)

Reported by donors to request institutional help at the scene.

| Field                  | Type       | Notes                                       |
| ---------------------- | ---------- | ------------------------------------------- |
| `reportedBy`           | ObjectId   | Ref → User. The reporting user.             |
| `bloodType`            | String     | Required.                                   |
| `urgency`              | String     | Default `"critical"`.                       |
| `quantity`             | Number     | Units needed.                               |
| `description`          | String     | Free text (e.g. "car accident on highway"). |
| `location`             | Object     | `{address, coordinates}`.                   |
| `status`               | String     | `"pending"` → `"acknowledged"` → `"handled"` / `"cancelled"`. |
| `notifiedInstitutions` | Array      | `[{institutionId, distance, notifiedAt, respondedAt, status}]`. |
| `acknowledgedBy`       | ObjectId   | Ref → User. The responding institution.     |
| `acknowledgedAt`       | Date       |                                             |
| `expiresAt`            | Date       | Default: 2 hours from creation.             |

### 5.3 Authentication & Middleware

**File:** `middleware/auth.js`

Three middleware functions:

1. **`authenticate`** — Extracts JWT from `Authorization: Bearer <token>` header, verifies it with `JWT_SECRET`, loads the user from the DB (excluding password), and attaches `req.user`. Returns 401 if token is missing, invalid, or expired; or if the user is not found / inactive.

2. **`requireInstitution`** — Checks `req.user.role === 'institution'`. Returns 403 otherwise.

3. **`requireDonor`** — Checks `req.user.role === 'donor'`. Returns 403 otherwise.

### 5.4 API Routes

#### Auth (`routes/auth.js`)

| Method | Path                | Auth?   | Description                  |
| ------ | ------------------- | ------- | ---------------------------- |
| POST   | `/api/auth/register`| No      | Register a new donor or institution. Validates email/password/role. Geocodes the address. Returns JWT + user info. |
| POST   | `/api/auth/login`   | No      | Login with email + password. Returns JWT + user info. |
| GET    | `/api/auth/me`      | Yes     | Returns the authenticated user's full profile (excluding password). |

**Token generation:** `jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })`.

#### Users (`routes/users.js`)

| Method | Path                      | Auth?       | Description                              |
| ------ | ------------------------- | ----------- | ---------------------------------------- |
| GET    | `/api/users/profile`      | Yes         | Get own profile.                         |
| PUT    | `/api/users/profile`      | Yes         | Update own profile. Re-geocodes address if changed. |
| PUT    | `/api/users/fcm-token`    | Yes         | Update FCM push notification token.      |
| PUT    | `/api/users/availability` | Yes (Donor) | Toggle donor availability on/off.        |
| GET    | `/api/users/donors/nearby`| Yes (Inst.) | Query nearby available donors by lat/lng/radius. |

#### Alerts (`routes/alerts.js`)

| Method | Path                            | Auth?       | Description                              |
| ------ | ------------------------------- | ----------- | ---------------------------------------- |
| POST   | `/api/alerts`                   | Yes (Inst.) | Create an alert. Finds + notifies nearby matching donors automatically. |
| GET    | `/api/alerts`                   | Yes         | List alerts. Filterable by `status`, `institutionId`, `bloodType`. |
| GET    | `/api/alerts/:id`               | Yes         | Get alert details, including populated matched donors. |
| POST   | `/api/alerts/:id/expand-radius` | Yes (Inst.) | Increase search radius by 500 m and re-search for new donors. Only the owning institution can do this. |
| POST   | `/api/alerts/:id/respond`       | Yes (Donor) | Donor accepts or rejects an alert they were matched to. |
| PUT    | `/api/alerts/:id/fulfill`       | Yes (Inst.) | Mark alert as fulfilled. Only the owning institution. |

**Donor matching logic** (helper `findAndNotifyDonors`):
1. Query all active, available donors whose `bloodType` matches and `age` falls within the alert's `ageRequirement`.
2. Use `filterByDistance()` (geolib) to keep only donors within `currentRadius` meters of the alert's coordinates.
3. Exclude donors already in `matchedDonors`.
4. Append new matches to `matchedDonors` with `status: "pending"`, record `notifiedAt`.
5. Send push notifications via `sendAlertToDonors()`.

#### Emergencies (`routes/emergencies.js`)

| Method | Path                                 | Auth?       | Description                       |
| ------ | ------------------------------------ | ----------- | --------------------------------- |
| POST   | `/api/emergencies`                   | Yes         | Report an emergency. Geocodes address if needed. Finds + notifies nearby institutions (5 KM radius). |
| GET    | `/api/emergencies`                   | Yes         | List emergencies. Filterable by `status`, `reportedBy`. |
| GET    | `/api/emergencies/:id`               | Yes         | Get emergency details with populated institutions. |
| POST   | `/api/emergencies/:id/acknowledge`   | Yes (Inst.) | Institution acknowledges a pending emergency. Sets status to `"acknowledged"`. Only institutions that were notified can do this. |
| PUT    | `/api/emergencies/:id/handle`        | Yes (Inst.) | Mark as handled. Only the institution that acknowledged it. |

**Institution matching logic** (helper `findAndNotifyInstitutions`):
1. Query all active institutions.
2. Filter by distance (5 KM radius from emergency coordinates).
3. Add to `notifiedInstitutions` with `status: "pending"`.
4. Send push notifications via `sendEmergencyToInstitutions()`.

### 5.5 Utilities

#### Geocoding (`utils/geocoding.js`)

- `geocodeAddress(address)` — Calls Google Maps Geocoding API. Returns `{latitude, longitude}` or `null`.
- `reverseGeocode(lat, lng)` — Returns formatted address string or `null`.
- Both require `GOOGLE_MAPS_API_KEY` env var.

#### Location (`utils/location.js`)

Uses the `geolib` library:

- `calculateDistance(coord1, coord2)` — Returns distance in meters between two `{latitude, longitude}` objects.
- `isWithinRadius(center, point, radius)` — Boolean check.
- `getNearbyQuery(coordinates, radius)` — Generates a MongoDB `$geoWithin` query (not currently used by routes, available for future optimization).
- `filterByDistance(users, center, maxRadius)` — Maps over users, calls `user.getCoordinates()`, calculates distance, filters by radius, sorts ascending by distance. Returns augmented user objects with a `distance` property.

### 5.6 Notification Service

**File:** `services/notificationService.js`

- Initializes Firebase Admin SDK from env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`). If any are missing, push notifications are silently disabled.
- `sendNotification(fcmToken, notification, data)` — Send to a single device.
- `sendBulkNotifications(tokens, notification, data)` — Uses `sendEachForMulticast` for batch sending. Includes high-priority flags for Android and APNs.
- `sendAlertToDonors(donors, alert)` — Collects FCM tokens from donor profiles and sends an "Emergency Blood Donation Needed" notification with alert metadata.
- `sendEmergencyToInstitutions(institutions, emergency)` — Collects FCM tokens from institution profiles and sends a "Road Emergency Reported" notification.

---

## 6. Frontend

### 6.1 Entry Point & Routing

**`main.jsx`** renders the React tree:
```
<React.StrictMode>
  <Provider store={store}>      ← Redux store
    <BrowserRouter>              ← Client-side routing
      <App />
      <ToastContainer />         ← Toast notifications
    </BrowserRouter>
  </Provider>
</React.StrictMode>
```

**`App.jsx`** defines routes:

| Path                  | Component              | Access        |
| --------------------- | ---------------------- | ------------- |
| `/login`              | Login                  | Public only   |
| `/register`           | Register               | Public only   |
| `/` (layout wrapper)  | Layout + ProtectedRoute| Authenticated |
| `/dashboard`          | DashboardRouter        | Authenticated |
| `/alerts`             | Alerts                 | Authenticated |
| `/alerts/:id`         | AlertDetail            | Authenticated |
| `/alerts/create`      | CreateAlert            | Authenticated |
| `/emergencies`        | Emergencies            | Authenticated |
| `/emergencies/report` | ReportEmergency        | Authenticated |
| `/emergencies/:id`    | EmergencyDetail        | Authenticated |
| `/profile`            | Profile                | Authenticated |

- **`ProtectedRoute`** — Checks `isAuthenticated` from Redux auth state. Redirects to `/login` if not authenticated.
- **`DashboardRouter`** — Renders `DonorDashboard` or `InstitutionDashboard` based on `user.role`.
- **`Layout`** — Renders the top navigation bar and an `<Outlet/>` for nested route content. Nav items are role-aware (institutions see Alerts/Create Alert; donors see Report Emergency).

### 6.2 State Management (Redux)

**Store** (`store/store.js`): Configured with four slices.

#### Auth Slice (`authSlice.js`)

State: `{ user, token, isAuthenticated, loading, error }`

- Initializes from `localStorage` (persists session across page reloads).
- **Thunks:**
  - `register(userData)` → POST `/api/auth/register` → stores token + user in localStorage.
  - `login(credentials)` → POST `/api/auth/login` → stores token + user in localStorage.
  - `getCurrentUser()` → GET `/api/auth/me` → updates user in state.
- **Reducers:**
  - `logout()` → clears state and localStorage.
  - `clearError()` → resets error to null.

#### Alert Slice (`alertSlice.js`)

State: `{ alerts, currentAlert, loading, error }`

- **Thunks:**
  - `createAlert(data)` → POST `/api/alerts`.
  - `getAlerts(params)` → GET `/api/alerts`.
  - `getAlertById(id)` → GET `/api/alerts/:id`.
  - `expandRadius(id)` → POST `/api/alerts/:id/expand-radius`.
  - `respondToAlert({id, response})` → POST `/api/alerts/:id/respond`.
  - `fulfillAlert({id, data})` → PUT `/api/alerts/:id/fulfill`.

#### Emergency Slice (`emergencySlice.js`)

State: `{ emergencies, currentEmergency, loading, error }`

- **Thunks:**
  - `reportEmergency(data)` → POST `/api/emergencies`.
  - `getEmergencies(params)` → GET `/api/emergencies`.
  - `getEmergencyById(id)` → GET `/api/emergencies/:id`.
  - `acknowledgeEmergency(id)` → POST `/api/emergencies/:id/acknowledge`.
  - `handleEmergency(id)` → PUT `/api/emergencies/:id/handle`.

#### User Slice (`userSlice.js`)

State: `{ profile, nearbyDonors, loading, error }`

- **Thunks:**
  - `getProfile()` → GET `/api/users/profile`.
  - `updateProfile(data)` → PUT `/api/users/profile`.
  - `updateAvailability(bool)` → PUT `/api/users/availability`.
  - `getNearbyDonors(params)` → GET `/api/users/donors/nearby`.

### 6.3 API Service Layer

**File:** `services/api.js`

- Creates an Axios instance with base URL from `VITE_API_BASE_URL` (default `http://localhost:5000/api`).
- **Request interceptor:** Reads JWT from `localStorage` and attaches `Authorization: Bearer <token>` header.
- **Response interceptor:** On 401, clears localStorage and redirects to `/login`.
- Exports organized API objects: `authAPI`, `userAPI`, `alertAPI`, `emergencyAPI` — each wrapping the corresponding endpoints.

### 6.4 Pages & Components

#### Login (`pages/Login.jsx`)

- Email + password form.
- Dispatches `login()` thunk on submit.
- Shows toast on error. Redirects to `/dashboard` on success.

#### Register (`pages/Register.jsx`)

- Role selector (donor / institution).
- Conditionally shows donor fields (first name, last name, phone, blood type, age) or institution fields (name, type, phone, contact person, license number).
- Address section (street, city, state, zip, country) for both roles.
- Validates password match client-side.
- Dispatches `register()` thunk on submit.

#### DonorDashboard (`pages/DonorDashboard.jsx`)

- Fetches active alerts and own profile on mount.
- Shows stat cards: active alerts count, blood type, availability status.
- Lists alerts matching the donor's blood type with urgency badges, location, and time ago.
- Link to report an emergency.

#### InstitutionDashboard (`pages/InstitutionDashboard.jsx`)

- Fetches own alerts and pending emergencies on mount.
- Shows stat cards: active alerts count, pending emergencies count, create new alert shortcut.
- Two-column grid: own active alerts (left) and pending emergencies (right).
- Links to alert detail and emergency detail pages.

#### Alerts (`pages/Alerts.jsx`)

- Fetches alerts: institution sees own alerts; donors see all active alerts.
- Institution gets a "Create Alert" button.
- Lists alert cards with blood type, quantity, location, urgency badge, status badge, timestamp.

#### AlertDetail (`pages/AlertDetail.jsx`)

- Fetches single alert by ID.
- Shows: blood type, quantity, urgency, status, current radius, age requirement, description, creation time.
- **Institution (owner) actions:** Expand search radius (+500 m), Mark as fulfilled.
- **Donor (matched) actions:** Accept / Decline (if status is pending). Shows confirmation if already responded.
- Shows matched donors grid: blood type, age, distance, response status.

#### CreateAlert (`pages/CreateAlert.jsx`)

- Form: blood type, quantity, urgency, description, location (pre-filled from institution address), age requirement (min/max).
- Dispatches `createAlert()` thunk on submit.
- Navigates to `/alerts` on success.

#### Emergencies (`pages/Emergencies.jsx`)

- Institutions see pending emergencies; donors see their own reported emergencies.
- Donors get a "Report Emergency" button.
- Lists emergency cards with blood type, quantity, location, urgency, status, timestamp.

#### EmergencyDetail (`pages/EmergencyDetail.jsx`)

- Fetches single emergency by ID.
- Shows: blood type, quantity, status, description, reporter, time, acknowledging institution.
- **Institution actions:** Acknowledge (if pending), Mark as Handled (if acknowledged by this institution).
- Shows notified institutions grid: name, distance, response status.

#### ReportEmergency (`pages/ReportEmergency.jsx`)

- Form: blood type, quantity, urgency, description, location address.
- Auto-detects GPS coordinates via `navigator.geolocation`.
- Dispatches `reportEmergency()` thunk on submit.

#### Profile (`pages/Profile.jsx`)

- Shows editable profile fields based on role.
- Donors can toggle availability.
- Address section with all fields.
- Edit/save/cancel toggle.

---

## 7. Data Flow

### 7.1 Registration Flow

```
User fills Register form
  │
  ▼
Frontend dispatches register() thunk
  │
  ▼
POST /api/auth/register  ──►  Backend validates email, password, role
  │                              │
  │                              ▼
  │                         Geocodes address via Google Maps API
  │                              │
  │                              ▼
  │                         Creates User doc in MongoDB
  │                         (password hashed via bcrypt pre-save hook)
  │                              │
  │                              ▼
  │                         Generates JWT (7-day expiry)
  │                              │
  ◄──────────────────────────────┘
  │  Response: { token, user: { id, email, role } }
  │
  ▼
Frontend stores token + user in localStorage
Redux state: isAuthenticated = true
React Router redirects to /dashboard
```

### 7.2 Login Flow

```
User fills Login form
  │
  ▼
Frontend dispatches login() thunk
  │
  ▼
POST /api/auth/login  ──►  Backend finds user by email
  │                           │
  │                           ▼
  │                        bcrypt.compare(password, hash)
  │                           │
  │                           ▼
  │                        Checks isActive flag
  │                           │
  │                           ▼
  │                        Generates JWT
  │                           │
  ◄───────────────────────────┘
  │  Response: { token, user }
  │
  ▼
Stored in localStorage + Redux
Redirect to /dashboard
```

### 7.3 Alert Creation Flow (Institution)

```
Institution fills CreateAlert form (blood type, quantity, urgency, location)
  │
  ▼
Frontend dispatches createAlert() thunk
  │
  ▼
POST /api/alerts  ──►  Backend validates input
  │                       │
  │                       ▼
  │                  Loads institution's coordinates from DB
  │                  Uses custom location or institution address
  │                  Geocodes if only address provided
  │                       │
  │                       ▼
  │                  Creates Alert doc (status: "active", radius: 2000m)
  │                       │
  │                       ▼
  │                  findAndNotifyDonors():
  │                    1. Query donors: role=donor, isActive, isAvailable,
  │                       bloodType match, age within range
  │                    2. filterByDistance(donors, alertCoords, 2000m)
  │                    3. Add to alert.matchedDonors[]
  │                    4. Send FCM push notifications
  │                       │
  ◄───────────────────────┘
  │  Response: { alert }
  │
  ▼
Alert appears in institution's dashboard
Matched donors receive push notification + see alert in their dashboard
```

### 7.4 Alert Response Flow (Donor)

```
Donor sees alert in dashboard or receives push notification
  │
  ▼
Clicks "View Details" → AlertDetail page
  │
  ▼
Clicks "Accept" or "Decline"
  │
  ▼
Frontend dispatches respondToAlert({ id, response: "accepted"/"rejected" })
  │
  ▼
POST /api/alerts/:id/respond  ──►  Backend finds alert
  │                                    │
  │                                    ▼
  │                               Finds donor in matchedDonors[]
  │                               Updates status + respondedAt
  │                                    │
  ◄────────────────────────────────────┘
  │  Response: { alert }
  │
  ▼
UI updates to show response status
```

### 7.5 Emergency Reporting Flow (Donor)

```
Donor fills ReportEmergency form
Browser requests GPS location via navigator.geolocation
  │
  ▼
Frontend dispatches reportEmergency() thunk
  │
  ▼
POST /api/emergencies  ──►  Backend validates input
  │                            │
  │                            ▼
  │                       Geocodes address if no coordinates
  │                            │
  │                            ▼
  │                       Creates Emergency doc (status: "pending", expires: 2h)
  │                            │
  │                            ▼
  │                       findAndNotifyInstitutions():
  │                         1. Query all active institutions
  │                         2. filterByDistance(institutions, emergencyCoords, 5000m)
  │                         3. Add to emergency.notifiedInstitutions[]
  │                         4. Send FCM push notifications
  │                            │
  ◄────────────────────────────┘
  │  Response: { emergency }
  │
  ▼
Emergency appears in institution dashboards (pending)
```

### 7.6 Emergency Handling Flow (Institution)

```
Institution sees pending emergency in dashboard
  │
  ▼
Clicks "Respond" → EmergencyDetail page
  │
  ▼
Clicks "Acknowledge Emergency"
  │
  ▼
POST /api/emergencies/:id/acknowledge  ──►  Backend verifies:
  │                                           - User is institution
  │                                           - Emergency is "pending"
  │                                           - Institution was notified
  │                                           │
  │                                           ▼
  │                                      Sets status → "acknowledged"
  │                                      Sets acknowledgedBy, acknowledgedAt
  │                                           │
  ◄──────────────────────────────────────────┘
  │
  ▼
(Later) Clicks "Mark as Handled"
  │
  ▼
PUT /api/emergencies/:id/handle  ──►  Backend verifies:
  │                                     - User is the acknowledging institution
  │                                     │
  │                                     ▼
  │                                Sets status → "handled"
  │                                     │
  ◄─────────────────────────────────────┘
  │
  ▼
Emergency resolved
```

---

## 8. Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bloodbytap

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Google Maps (for address geocoding)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase (for push notifications — optional)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

Frontend env (create `frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 9. Running the Project

**Prerequisites:** Node.js, MongoDB running locally (or a remote MongoDB URI).

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start backend (with auto-reload)
npm run dev

# In a separate terminal, start frontend
cd frontend && npm run dev
```

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000` (proxies `/api/*` to backend)
- Open `http://localhost:3000` in the browser.
