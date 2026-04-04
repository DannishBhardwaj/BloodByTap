# BloodByTap Backend

A backend API for BloodByTap - an emergency blood bank management system that connects donors with medical institutions during critical situations.

## Features

- **User Management**: Registration and authentication for donors and institutions
- **Emergency Alerts**: Institutions can create alerts for blood requirements
- **Location-Based Matching**: Automatic donor matching within configurable radius (2KM-5KM)
- **Road Emergencies**: Users can report emergencies and notify nearby hospitals
- **Push Notifications**: Firebase Cloud Messaging integration for real-time alerts
- **Radius Expansion**: Automatic radius expansion if no donors found initially

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Firebase Admin SDK** for push notifications
- **Google Maps Geocoding API** for location services
- **Geolib** for distance calculations

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BloodByTapBackend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- MongoDB connection string
- JWT secret key
- Firebase Admin SDK credentials
- Google Maps API key

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (donor or institution)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/fcm-token` - Update FCM token for push notifications
- `PUT /api/users/availability` - Update donor availability (donor only)
- `GET /api/users/donors/nearby` - Get nearby donors (institution only)

### Alerts
- `POST /api/alerts` - Create a new alert (institution only)
- `GET /api/alerts` - Get all alerts (with filters)
- `GET /api/alerts/:id` - Get alert by ID
- `POST /api/alerts/:id/expand-radius` - Expand alert radius
- `POST /api/alerts/:id/respond` - Donor responds to alert
- `PUT /api/alerts/:id/fulfill` - Mark alert as fulfilled

### Emergencies
- `POST /api/emergencies` - Report a road emergency
- `GET /api/emergencies` - Get all emergencies (with filters)
- `GET /api/emergencies/:id` - Get emergency by ID
- `POST /api/emergencies/:id/acknowledge` - Institution acknowledges emergency
- `PUT /api/emergencies/:id/handle` - Mark emergency as handled

## Database Models

### User
- Supports both donor and institution roles
- Stores profile information based on role
- Includes location coordinates for geospatial queries

### Alert
- Created by institutions for blood requirements
- Tracks matched donors and their responses
- Supports radius expansion (2KM → 5KM)

### Emergency
- Reported by users for road emergencies
- Notifies nearby institutions automatically
- Tracks acknowledgment and handling status

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bloodbytap
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
GOOGLE_MAPS_API_KEY=your-api-key
```

## Project Structure

```
BloodByTapBackend/
├── models/          # MongoDB models
│   ├── User.js
│   ├── Alert.js
│   └── Emergency.js
├── routes/          # API routes
│   ├── auth.js
│   ├── users.js
│   ├── alerts.js
│   └── emergencies.js
├── middleware/      # Express middleware
│   └── auth.js
├── services/        # Business logic services
│   └── notificationService.js
├── utils/           # Utility functions
│   ├── location.js
│   └── geocoding.js
├── server.js        # Main server file
├── package.json
└── .env.example
```

## How It Works

1. **Registration**: Users register as either donors or institutions with their details and location
2. **Alert Creation**: When an institution needs blood, they create an alert with blood type and requirements
3. **Donor Matching**: System finds matching donors within 2KM radius based on:
   - Blood type compatibility
   - Age requirements
   - Availability status
   - Distance from institution
4. **Notifications**: Matching donors receive push notifications
5. **Radius Expansion**: If no donors respond, radius expands by 500m up to 5KM
6. **Road Emergencies**: Users can report emergencies, and nearby institutions are automatically notified

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation using express-validator

## License

ISC
