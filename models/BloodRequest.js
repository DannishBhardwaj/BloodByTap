const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true,
    trim: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  urgency: {
    type: String,
    enum: ['critical', 'high', 'medium'],
    default: 'high'
  },
  notes: {
    type: String,
    trim: true
  },
  radiusMeters: {
    type: Number,
    default: 5000,
    min: 500,
    max: 50000
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  status: {
    type: String,
    enum: ['ongoing', 'in-process', 'complete', 'cancelled', 'expired', 'active', 'fulfilled'],
    default: 'ongoing'
  },
  matchedDonors: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    userId: {
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
  fulfilledAt: Date
}, {
  timestamps: true
});

bloodRequestSchema.index({ location: '2dsphere' });
bloodRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
