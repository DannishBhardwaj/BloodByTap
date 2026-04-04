const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['donor', 'institution'],
    required: true
  },
  // Donor specific fields
  donorProfile: {
    firstName: String,
    lastName: String,
    phone: String,
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    age: Number,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    healthStatus: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    lastDonationDate: Date,
    isAvailable: {
      type: Boolean,
      default: true
    },
    fcmToken: String // Firebase Cloud Messaging token for push notifications
  },
  // Institution specific fields
  institutionProfile: {
    name: String,
    type: {
      type: String,
      enum: ['hospital', 'blood-bank', 'clinic', 'other']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    licenseNumber: String,
    contactPerson: String,
    fcmToken: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user location coordinates
userSchema.methods.getCoordinates = function() {
  if (this.role === 'donor') {
    return this.donorProfile?.address?.coordinates;
  } else {
    return this.institutionProfile?.address?.coordinates;
  }
};

module.exports = mongoose.model('User', userSchema);
