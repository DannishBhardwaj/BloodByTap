# BloodByTap

BloodByTap is a full-stack emergency blood coordination platform that connects donors and medical institutions during urgent blood and road emergency situations.

## What This Project Includes

- Backend API built with Node.js, Express, and MongoDB
- Frontend web app built with React, Redux Toolkit, and Vite
- Role-based flows for donors and institutions
- Location-aware alert matching and emergency reporting

## Core Features

- User authentication and role-based access (donor/institution)
- Blood alert creation and donor response workflow
- Nearby donor matching using geolocation and blood compatibility
- Emergency reporting with nearby institution notifications
- Progressive search radius expansion for unresolved alerts
- Socket.io real-time donor alerting
- GPS-first location capture for emergency speed (address geocoding used only as fallback)

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Socket.io
- Geolib
- Express Validator

### Frontend

- React 18
- Redux Toolkit
- React Router
- Axios
- React Toastify
- Vite

## Project Structure

```text
BloodByTap/
|- server.js
|- package.json
|- models/
|- routes/
|- middleware/
|- services/
|- utils/
|- frontend/
|  |- package.json
|  |- src/
|  |- vite.config.js
|- README.md
```

## Local Setup

### 1. Clone

```bash
git clone <your-new-repository-url>
cd BloodByTap
```

### 2. Install Dependencies

Install backend dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment

Backend environment file at project root (`.env`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bloodbytap
JWT_SECRET=your-secret
JWT_EXPIRE=7d
GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_USER_AGENT=BloodByTap/1.0 (contact: admin@example.com)
GEOCODING_CONTACT_EMAIL=admin@example.com
GEOCODING_MIN_INTERVAL_MS=1100
GEOCODING_MAX_RETRIES=2
GEOCODING_TIMEOUT_MS=10000
GEOCODING_CACHE_TTL_MS=86400000
GEOCODING_CACHE_MAX_SIZE=1000
```

Location behavior:
- The frontend first captures live coordinates from device geolocation when creating alerts or reporting emergencies.
- Address-based geocoding is used only if live coordinates are unavailable.

Frontend environment file in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Run the App

Start backend (root folder):

```bash
npm run dev
```

Start frontend (new terminal):

```bash
cd frontend
npm run dev
```

Frontend runs on Vite default port and connects to backend API via `VITE_API_BASE_URL`.

After migration, run donor sync once:

```bash
npm run backfill:donors
```

## Tests

Backend tests (Jest + Supertest):

```bash
npm test
```

Frontend tests (Jest + Testing Library):

```bash
cd frontend
npm test
```

For serial runs:

```bash
npm run test:e2e
```

## API Overview

- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Alerts: `/api/alerts/*`
- Emergencies: `/api/emergencies/*`

Detailed endpoint docs are available in `API_DOCUMENTATION.md`.

## Security Notes

- Do not commit secrets in `.env` files
- JWT is used for stateless auth
- Passwords are hashed before storage
- Route access is controlled by authenticated role

## Documentation

- API docs: `API_DOCUMENTATION.md`
- System design: `SYSTEM_ARCHITECTURE.md`
- Developer guide: `DOCUMENTATION.md`

## License

ISC
