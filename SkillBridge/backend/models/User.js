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
    required: function() { return !this.googleId; },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'],
    required: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Google Auth
  googleId: {
    type: String,
    sparse: true
  },

  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: String,
  emailVerificationOTPExpires: Date,

  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorOTP: String,
  twoFactorOTPExpires: Date,

  // Forgot password
  resetPasswordOTP: String,
  resetPasswordOTPExpires: Date,

  // Account lock
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,

  // Login history & Device management
  loginHistory: [
    {
      ipAddress: String,
      userAgent: String,
      deviceType: String,
      loginTime: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Refresh tokens list for rotation
  refreshTokens: [String]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
