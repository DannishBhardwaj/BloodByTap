# BloodByTap System Architecture (MERN + Socket.io)

## 1. Architecture Style
BloodByTap follows a layered client-server architecture with real-time channels.

- Frontend: React + Redux SPA
- Backend: Express API + Socket.io gateway
- Database: MongoDB (Mongoose)

## 2. High-Level View

```text
+-------------------------------+
| Frontend (React + Redux)      |
| - UI + API calls              |
| - Socket.io client connection |
+---------------+---------------+
                |
                | HTTPS (REST)
                v
+-------------------------------+
| Backend (Express + JWT)       |
| - Auth routes                 |
| - Blood request routes        |
| - Donor geospatial controller |
+---------------+---------------+
                |
                | Mongoose
                v
+-------------------------------+
| MongoDB                       |
| - User                        |
| - Donor (GeoJSON + 2dsphere)  |
| - BloodRequest (GeoJSON)      |
+-------------------------------+

Real-time path:
Frontend Socket <-> Socket.io server <-> targeted donor rooms
```

## 3. Backend Layers

### API Layer
- `/api/auth/*` for signup/signin/JWT lifecycle
- `/api/blood-requests/*` for request creation/listing and donor search
- `/api/request-blood` direct protected alias endpoint

### Middleware Layer
- `authMiddleware`: JWT verification and user context
- Role guards: `requireInstitution`, `requireDonor`

### Domain/Data Layer
- `User`: account + role profile metadata
- `Donor`: donor availability, blood type, GeoJSON location
- `BloodRequest`: hospital request, radius, status, matched donors

### Service Layer
- `socketService`: socket authentication, donor socket room tracking, selective event broadcast
- `donorSyncService`: keeps `Donor` collection synced from donor profile updates

### Controller Layer
- `donorController.findNearbyDonors`: geospatial `$near` query inside radius
- `bloodRequestController.createBloodRequest`: persists request, computes nearby donors, emits real-time events

## 4. Geo-Spatial Data Model

Donor and BloodRequest use:

```js
location: {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], required: true } // [longitude, latitude]
}
```

Indexes:
- `Donor.location`: `2dsphere`
- `BloodRequest.location`: `2dsphere`

## 5. Runtime Flows

### Signup/Login
1. Client posts credentials
2. API validates and hashes password with bcrypt
3. JWT token is generated and returned
4. Client uses token for API and socket authentication

### Request Blood (Institution)
1. Institution UI captures current device coordinates (GPS-first)
2. Institution submits `/request-blood`
3. API saves `BloodRequest`
4. API runs MongoDB `$near` donor query within request radius
5. API records matched donors
6. Socket.io emits `new-emergency-alert` only to connected in-range donors

### Donor Discovery Controller
`findNearbyDonors` supports institution-side geospatial search using query params:
- latitude
- longitude
- radius
- bloodType

## 6. Security and Reliability
- JWT required for protected routes
- Role checks prevent unauthorized blood request creation
- Password hashing with bcrypt
- Input validation with express-validator
- Socket handshake validates JWT before connection acceptance

## 7. Configuration
Required variables:
- `MONGODB_URI`
- `JWT_SECRET`

Optional:
- `JWT_EXPIRE`
- `GEOCODING_BASE_URL`
- `GEOCODING_USER_AGENT`
- `GEOCODING_CONTACT_EMAIL`
- `GEOCODING_MIN_INTERVAL_MS`
- `GEOCODING_MAX_RETRIES`
- `GEOCODING_TIMEOUT_MS`
- `GEOCODING_CACHE_TTL_MS`
- `GEOCODING_CACHE_MAX_SIZE`
- `PORT`

## 8. Migration Status
- Firebase Cloud Messaging removed from primary runtime flow
- Firestore/listener-based alerting replaced by Socket.io room-targeted alerts
- Geospatial filtering now handled natively in MongoDB/Mongoose
- Client-side emergency location collection is GPS-first, with geocoding retained as fallback only
