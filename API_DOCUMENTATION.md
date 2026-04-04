# BloodByTap API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user (donor or institution).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "donor", // or "institution"
  "profile": {
    // For donors:
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "bloodType": "O+",
    "age": 25,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "healthStatus": "good",
    "lastDonationDate": "2024-01-15"
    
    // For institutions:
    "name": "City Hospital",
    "type": "hospital",
    "phone": "+1234567890",
    "address": {
      "street": "456 Medical Ave",
      "city": "New York",
      "state": "NY",
      "zipCode": "10002",
      "country": "USA"
    },
    "licenseNumber": "LIC123456",
    "contactPerson": "Dr. Smith"
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "donor"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "donor"
  }
}
```

### Get Current User
**GET** `/auth/me`

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "role": "donor",
    "donorProfile": { ... }
  }
}
```

---

## User Endpoints

### Get Profile
**GET** `/users/profile`

**Response:**
```json
{
  "user": {
    "_id": "user-id",
    "email": "user@example.com",
    "role": "donor",
    "donorProfile": { ... }
  }
}
```

### Update Profile
**PUT** `/users/profile`

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "bloodType": "O+",
    "age": 26,
    "address": { ... }
  }
}
```

### Update FCM Token
**PUT** `/users/fcm-token`

**Request Body:**
```json
{
  "fcmToken": "firebase-cloud-messaging-token"
}
```

### Update Availability (Donor Only)
**PUT** `/users/availability`

**Request Body:**
```json
{
  "isAvailable": true
}
```

### Get Nearby Donors (Institution Only)
**GET** `/users/donors/nearby?latitude=40.7128&longitude=-74.0060&radius=2000`

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `radius` (optional): Search radius in meters (default: 2000)

---

## Alert Endpoints

### Create Alert (Institution Only)
**POST** `/alerts`

**Request Body:**
```json
{
  "bloodType": "O+",
  "quantity": 2,
  "urgency": "high",
  "description": "Emergency surgery requiring blood",
  "ageRequirement": {
    "min": 18,
    "max": 65
  },
  "location": {
    "address": "Custom location address",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

**Response:**
```json
{
  "message": "Alert created successfully",
  "alert": {
    "_id": "alert-id",
    "institutionId": "institution-id",
    "bloodType": "O+",
    "status": "active",
    "currentRadius": 2000,
    "matchedDonors": [ ... ]
  }
}
```

### Get All Alerts
**GET** `/alerts?status=active&bloodType=O+&institutionId=id`

**Query Parameters:**
- `status`: Filter by status (active, fulfilled, cancelled, expired)
- `bloodType`: Filter by blood type
- `institutionId`: Filter by institution

### Get Alert by ID
**GET** `/alerts/:id`

### Expand Alert Radius
**POST** `/alerts/:id/expand-radius`

Expands the search radius by 500m if no donors found.

### Respond to Alert (Donor)
**POST** `/alerts/:id/respond`

**Request Body:**
```json
{
  "response": "accepted" // or "rejected"
}
```

### Fulfill Alert (Institution)
**PUT** `/alerts/:id/fulfill`

**Request Body:**
```json
{
  "fulfilledBy": "donor-id" // optional
}
```

---

## Emergency Endpoints

### Report Emergency
**POST** `/emergencies`

**Request Body:**
```json
{
  "bloodType": "O+",
  "quantity": 1,
  "urgency": "critical",
  "description": "Road accident, immediate blood needed",
  "location": {
    "address": "Highway 101, Mile Marker 45",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

**Response:**
```json
{
  "message": "Emergency reported successfully. Nearby institutions have been notified.",
  "emergency": {
    "_id": "emergency-id",
    "status": "pending",
    "notifiedInstitutions": [ ... ]
  }
}
```

### Get All Emergencies
**GET** `/emergencies?status=pending&reportedBy=user-id`

### Get Emergency by ID
**GET** `/emergencies/:id`

### Acknowledge Emergency (Institution)
**POST** `/emergencies/:id/acknowledge`

### Handle Emergency (Institution)
**PUT** `/emergencies/:id/handle`

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "message": "Error description",
  "error": "Detailed error message (in development mode)"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. **Location**: Addresses are automatically geocoded using Google Maps API. You can also provide coordinates directly.

2. **Radius Expansion**: Alerts start with a 2KM radius and expand by 500m increments up to 5KM if no donors are found.

3. **Push Notifications**: FCM tokens must be updated via `/users/fcm-token` endpoint to receive push notifications.

4. **Blood Type Matching**: The system matches exact blood types. Consider implementing compatibility logic (e.g., O- can donate to all) if needed.

5. **Distance Calculation**: Uses geolib library for accurate distance calculations based on coordinates.
