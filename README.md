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
- FCM support for real-time notifications

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT authentication
- Firebase Admin SDK
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
git clone https://github.com/DannishBhardwaj/BloodByTap.git
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
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

Frontend environment file in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
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
