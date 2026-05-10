# BloodByTap API Documentation (MERN Migration)

## Base URL
`http://localhost:5000/api`

## Authentication
All protected endpoints require:
`Authorization: Bearer <jwt-token>`

## Auth Endpoints

### POST /auth/signup
Creates a donor or institution user.

Body:
```json
{
  "email": "hospital@example.com",
  "password": "password123",
  "role": "institution",
  "profile": {
    "name": "City Hospital",
    "address": {
      "street": "123 Main",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02108",
      "country": "USA"
    }
  }
}
```

### POST /auth/signin
Logs in and returns JWT.

### Backward-Compatible Auth Routes
- `POST /auth/register` (alias of signup)
- `POST /auth/login` (alias of signin)
- `GET /auth/me` (protected)

## Location Strategy (Emergency Reliability)

- Primary mode: send `location.coordinates` from browser/device geolocation.
- Fallback mode: send `location.address` only when coordinates are unavailable.
- Recommended coordinate format:

```json
{
  "location": {
    "coordinates": {
      "latitude": 19.2183,
      "longitude": 73.0867
    },
    "address": "optional human-readable address"
  }
}
```

### Endpoints using this strategy
- `POST /alerts`
- `POST /emergencies`
- `POST /request-blood`
- `POST /blood-requests/request-blood`

## Blood Request Endpoints

### POST /request-blood (protected)
Sensitive route protected by `authMiddleware` + institution role check.

### POST /blood-requests/request-blood (protected)
Creates a blood request and triggers Socket.io donor-targeted alerts.

Body:
```json
{
  "bloodType": "O+",
  "quantity": 3,
  "urgency": "critical",
  "radiusMeters": 5000,
  "hospitalName": "City Hospital",
  "location": {
    "address": "456 Medical Ave, Boston",
    "coordinates": {
      "latitude": 42.3601,
      "longitude": -71.0589
    }
  }
}
```

Response includes:
- persisted `bloodRequest`
- `nearbyDonorsFound`
- socket delivery stats

### GET /blood-requests (protected)
List blood requests.

### GET /blood-requests/nearby-donors (protected)
Geospatial donor query via MongoDB `$near`.

Query params:
- `latitude` (required)
- `longitude` (required)
- `radius` (optional, meters, default 5000)
- `bloodType` (optional)

## MongoDB Models (Core Migration)

### User
- Stores auth identity and role.
- Donor and institution profiles support GeoJSON points.

### Donor
- Dedicated collection for geospatial donor matching.
- Required GeoJSON field:
```js
location: {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], required: true }
}
```

### BloodRequest
- Dedicated collection replacing Firebase/Firestore blood requests.
- Required GeoJSON field:
```js
location: {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], required: true }
}
```

## Real-Time Socket Events

### Server Broadcast Event
`new-emergency-alert`

Trigger flow:
1. Institution creates BloodRequest.
2. Server finds donors within radius using MongoDB geospatial query.
3. Event is emitted only to connected donor sockets in range.

## Notes
- Firebase/FCM is removed from the backend runtime path.
- Environment variables now focus on `MONGODB_URI` and `JWT_SECRET`.
- Existing `/alerts` and `/emergencies` endpoints remain available for compatibility.
- GPS-first submission is strongly recommended for emergency speed and lower geocoding failure risk.
