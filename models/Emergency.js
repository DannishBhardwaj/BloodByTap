const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  reportedBy: {
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
    default: 'critical'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
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
    enum: ['pending', 'acknowledged', 'handled', 'cancelled'],
    default: 'pending'
  },
  notifiedInstitutions: [{
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    distance: Number,
    notifiedAt: Date,
    respondedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'rejected'],
      default: 'pending'
    }
  }],
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    }
  }
}, {
  timestamps: true
});

// Index for geospatial queries
emergencySchema.index({ 'location.coordinates': '2dsphere' });
emergencySchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('Emergency', emergencySchema);
