const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  urgency: {
    type: String,
    enum: ['critical', 'high', 'medium'],
    default: 'high'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  ageRequirement: {
    min: {
      type: Number,
      default: 18
    },
    max: {
      type: Number,
      default: 65
    }
  },
  description: String,
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled', 'expired'],
    default: 'active'
  },
  currentRadius: {
    type: Number,
    default: 2000 // Starting radius in meters (2KM)
  },
  maxRadius: {
    type: Number,
    default: 5000 // Maximum radius in meters (5KM)
  },
  radiusIncrement: {
    type: Number,
    default: 500 // Increment in meters
  },
  matchedDonors: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    distance: Number,
    notifiedAt: Date,
    respondedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending'
    }
  }],
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fulfilledAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
alertSchema.index({ 'location.coordinates': '2dsphere' });
alertSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Alert', alertSchema);
