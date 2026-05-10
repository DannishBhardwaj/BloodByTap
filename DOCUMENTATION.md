# BloodByTap - Full Project Documentation (MERN)

## Overview
BloodByTap is now a MongoDB + Express + React + Node.js blood emergency platform using:
- MongoDB geospatial queries for radius-based donor matching
- JWT authentication with bcrypt password hashing
- Socket.io real-time emergency broadcasts

## Migration Summary
The backend has been migrated from Firebase-driven alerts to native MERN services.

### What changed
1. Firestore collections were replaced with MongoDB/Mongoose models:
- `User`
- `Donor`
- `BloodRequest`

2. Firebase Auth was replaced by JWT:
- Signup/login endpoints issue signed JWT tokens
- Protected routes use `authMiddleware`

3. FCM/listener notifications were replaced by Socket.io:
- On BloodRequest creation, server finds nearby donors and emits `new-emergency-alert` only to eligible connected donor sockets

## Backend Structure
- `models/User.js`: identity + donor/institution profiles, GeoJSON support
- `models/Donor.js`: donor collection with geospatial index
- `models/BloodRequest.js`: blood request collection with geospatial index
- `controllers/donorController.js`: `$near`-based `findNearbyDonors`
- `controllers/bloodRequestController.js`: create/list blood requests + targeted socket emission
- `middleware/authMiddleware.js`: JWT route protection wrapper
- `services/socketService.js`: socket auth, donor room management, selective broadcast
- `routes/bloodRequests.js`: `/blood-requests/*`
- `routes/requestBlood.js`: direct protected `/request-blood`

## Geolocation Design
`Donor` and `BloodRequest` store location as GeoJSON Point:

```js
location: {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], required: true } // [longitude, latitude]
}
```

MongoDB geospatial indexes (`2dsphere`) are used for efficient nearby searches.

## Emergency Location Mode
- Frontend alert and emergency forms are GPS-first: device coordinates are captured and sent first.
- Address geocoding through Nominatim is fallback-only when coordinates are unavailable.
- This minimizes "not found" cases and reduces dispatch latency in emergencies.

## Authentication Design
- Passwords are hashed with `bcryptjs` (User pre-save hook)
- Sessions use JWT signed with `JWT_SECRET`
- Routes can be protected by:
  - `authMiddleware`
  - `requireInstitution`
  - `requireDonor`

## Real-Time Alert Broadcast Logic
1. Institution calls protected `/request-blood` or `/blood-requests/request-blood`
2. Controller persists BloodRequest in MongoDB
3. Controller runs nearby donor query by radius and blood type
4. Socket service emits `new-emergency-alert` only to donor rooms that are both:
- connected
- in-range according to geospatial query

## Environment Variables
Required:
- `MONGODB_URI`
- `JWT_SECRET`

Optional:
- `JWT_EXPIRE` (default `7d`)
- `PORT` (default `5000`)
- `GEOCODING_BASE_URL` (default `https://nominatim.openstreetmap.org`)
- `GEOCODING_USER_AGENT` (required by Nominatim usage policy)
- `GEOCODING_CONTACT_EMAIL` (recommended by Nominatim)
- `GEOCODING_MIN_INTERVAL_MS` (default `1100` to avoid rate-limit issues)
- `GEOCODING_MAX_RETRIES` (default `2`)
- `GEOCODING_TIMEOUT_MS` (default `10000`)
- `GEOCODING_CACHE_TTL_MS` (default `86400000`)
- `GEOCODING_CACHE_MAX_SIZE` (default `1000`)

## Operations Notes
- Public Nominatim is rate-limited. This project enforces request throttling, retries, and in-memory caching in the geocoding utility.
- Nominatim should be treated as fallback infrastructure; primary emergency path is direct coordinate submission.
- After migration, run `npm run backfill:donors` once so existing donor users are available in the geospatial `Donor` collection.

## Testing

Backend (Jest + Supertest):

```bash
npm test
```

Frontend (Jest + Testing Library):

```bash
cd frontend
npm test
```

Use `npm run test:e2e` for serialized runs when needed.

## Dependencies (Backend)
- `mongoose`
- `express`
- `jsonwebtoken`
- `bcryptjs`
- `socket.io`
- `express-validator`

Removed from runtime path:
- `firebase`
- `firebase-admin`

## API References
See `API_DOCUMENTATION.md` for endpoint-level definitions.

## Architecture Reference
See `SYSTEM_ARCHITECTURE.md` for updated layer and runtime flow diagrams.
