const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { auth } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const UAParser = require('ua-parser-js');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate short-lived JWT Access Token (expires in 15m)
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate long-lived JWT Refresh Token (expires in 7d)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Parse User-Agent using UAParser
const getDeviceInfo = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  const browser = result.browser.name || 'Unknown Browser';
  const os = result.os.name || 'Unknown OS';
  let device = 'Desktop';
  if (result.device.type === 'mobile') device = 'Mobile';
  else if (result.device.type === 'tablet') device = 'Tablet';
  
  return `${device} (${browser} on ${os})`;
};

// Helper: Setup & Send email verification code
const setVerificationOTP = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerificationOTP = otp;
  user.emailVerificationOTPExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();
  
  await sendEmail({
    to: user.email,
    subject: 'Verify your SkillBridge Email Address',
    text: `Your email verification OTP code is ${otp}. It is valid for 24 hours.`,
    html: `<div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #3b82f6;">Email Address Verification</h2>
      <p style="font-size: 16px; color: #475569;">Thank you for registering on SkillBridge. Please verify your email using this code:</p>
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; display: inline-block; padding: 10px 40px; margin: 20px 0; border-radius: 8px;">
        <h1 style="color: #10b981; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #64748b;">This code will expire in 24 hours.</p>
    </div>`
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role
    if (!['admin', 'instructor', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Password strength check (Backend validator fallback)
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      role,
      isEmailVerified: false
    });

    await user.save();

    // Create profile
    const profile = new Profile({
      userId: user._id,
      firstName,
      lastName,
      phone: phone || ''
    });

    await profile.save();

    // Link profile to user
    user.profile = profile._id;
    await user.save();

    // Send email verification code
    await setVerificationOTP(user);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).populate('profile');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ 
        message: `Account is temporarily locked due to consecutive wrong entries. Try again in ${remainingMinutes} minute(s).` 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
        user.loginAttempts = 0;
        await user.save();
        return res.status(403).json({ 
          message: 'Too many failed attempts. Account has been locked for 15 minutes.' 
        });
      }
      
      await user.save();
      const attemptsLeft = 5 - user.loginAttempts;
      return res.status(401).json({ 
        message: `Invalid credentials. ${attemptsLeft} attempt(s) remaining before your account gets locked.` 
      });
    }

    // Reset login attempts under success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Two-Factor Authentication Trigger
    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorOTP = otp;
      user.twoFactorOTPExpires = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();

      await sendEmail({
        to: user.email,
        subject: 'SkillBridge 2FA Login Code',
        text: `Your login verification code is ${otp}. It is valid for 10 minutes.`,
        html: `<div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #6366f1;">Two-Factor Authentication OTP</h2>
          <p style="font-size: 16px; color: #475569;">To finalize signing in, please enter the following 6-digit verification code:</p>
          <div style="background-color: #f5f3ff; border: 1px dashed #c084fc; display: inline-block; padding: 10px 40px; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #8b5cf6; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #64748b;">This OTP code will expire in 10 minutes.</p>
        </div>`
      });

      return res.json({ 
        twoFactorRequired: true, 
        email: user.email 
      });
    }

    // Log login history & Device info
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = getDeviceInfo(userAgent);

    user.loginHistory.unshift({ ipAddress, userAgent, deviceType });
    if (user.loginHistory.length > 15) {
      user.loginHistory.pop();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify 2FA OTP
router.post('/verify-2fa', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('profile');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.twoFactorOTP || user.twoFactorOTP !== otp || user.twoFactorOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired 2FA code' });
    }

    // Clear OTP details
    user.twoFactorOTP = undefined;
    user.twoFactorOTPExpires = undefined;

    // Log Login History
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = getDeviceInfo(userAgent);

    user.loginHistory.unshift({ ipAddress, userAgent, deviceType });
    if (user.loginHistory.length > 15) {
      user.loginHistory.pop();
    }

    // Generate token set
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile || null
      }
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Sign-In & Login verification
router.post('/google-login', async (req, res) => {
  try {
    const { token, role } = req.body;
    let email, googleId, firstName, lastName;

    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      googleId = payload.sub;
      firstName = payload.given_name || 'Google';
      lastName = payload.family_name || 'User';
    } else {
      // Mock validation verification fallback for local developer testing
      if (token && token.startsWith('mock_token_')) {
        const parts = token.split('_');
        email = parts[2] || 'googleuser@example.com';
        googleId = parts[3] || 'google_sub_id';
        firstName = parts[4] || 'Google';
        lastName = 'User';
      } else {
        return res.status(400).json({ message: 'Google Client ID credentials are not configured on Server .env' });
      }
    }

    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    }).populate('profile');

    const defaultRole = role || 'student';

    if (!user) {
      // Register new Google account
      user = new User({
        email: email.toLowerCase(),
        googleId,
        role: defaultRole,
        isEmailVerified: true
      });
      await user.save();

      const profile = new Profile({
        userId: user._id,
        firstName,
        lastName,
        phone: ''
      });
      await profile.save();

      user.profile = profile._id;
      await user.save();
      user = await User.findById(user._id).populate('profile');
    } else {
      // Link Google credentials to existing email address account
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Auto-verify email
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Login log tracking
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = getDeviceInfo(userAgent);

    user.loginHistory.unshift({ ipAddress, userAgent, deviceType });
    if (user.loginHistory.length > 15) {
      user.loginHistory.pop();
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile || null
      }
    });

  } catch (error) {
    console.error('Google authorization error:', error);
    res.status(500).json({ message: 'Google OAuth token verification failed', error: error.message });
  }
});

// Refresh Access / Rotation token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: 'Invalid or expired refresh token session' });
    }

    // Revoke used token & generate fresh set (Token Rotation)
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Token refresh failed, authorization denied' });
  }
});

// Toggle Two-Factor Authentication
router.post('/toggle-2fa', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    
    res.json({ 
      message: `Two-factor verification ${user.twoFactorEnabled ? 'activated' : 'deactivated'} successfully!`, 
      twoFactorEnabled: user.twoFactorEnabled 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Email Verification OTP code verification
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('profile');
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (!user.emailVerificationOTP || user.emailVerificationOTP !== otp || user.emailVerificationOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired email verification code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Email address verified successfully!', 
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile || null
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend Verification Email Code
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    await setVerificationOTP(user);
    res.json({ message: 'Email verification code sent successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot / Reset Password flow - request code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security standard: don't reveal if user does not exist
      return res.json({ message: 'If this email belongs to an account, a password reset code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Reset your SkillBridge Password',
      text: `Your password reset code is ${otp}. It is valid for 30 minutes.`,
      html: `<div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #475569;">You requested a password reset. Verify your identity with the following code:</p>
        <div style="background-color: #fef2f2; border: 1px dashed #fca5a5; display: inline-block; padding: 10px 40px; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #ef4444; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #64748b;">This OTP code will expire in 30 minutes. If you did not make this request, ignore this.</p>
      </div>`
    });

    res.json({ message: 'Password reset code has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify forgot password code & commit new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp || user.resetPasswordOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Set new password (saved hook treats hashing)
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    // Reset lockout counters
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    // Invalidate existing sessions/devices
    user.refreshTokens = [];

    await user.save();
    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fetch user login history list
router.get('/login-history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loginHistory');
    res.json({ loginHistory: user ? user.loginHistory : [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout on all devices (revoke all sessions)
router.post('/logout-all-devices', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    res.json({ message: 'Successfully logged out from all other devices.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current logged-in user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshTokens')
      .populate('profile');
    
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
