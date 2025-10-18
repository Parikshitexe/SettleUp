const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// @route   POST /api/auth/register
// @desc    Register a new user and send OTP
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').trim().notEmpty(),
    body('name', 'Name can only contain letters and spaces')
      .matches(/^[a-zA-Z\s]+$/),
    body('name', 'Name must be between 2 and 50 characters')
      .isLength({ min: 2, max: 50 }),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('phone').optional().matches(/^[6-9][0-9]{9}$/).withMessage('Phone must be a valid 10-digit Indian mobile number')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists with this email' });
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create new user instance
      user = new User({
        name,
        email,
        password,
        phone,
        isVerified: false,
        verificationOTP: otp,
        otpExpiry: otpExpiry
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user to database
      await user.save();

      // Send OTP email
      try {
        await sendOTPEmail(email, name, otp);
      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        // Delete user if email fails
        await User.findByIdAndDelete(user.id);
        return res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
      }

      // Create JWT payload (user not fully authenticated yet)
      const payload = {
        user: {
          id: user.id
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              isVerified: false
            },
            msg: 'Registration successful! Please check your email for OTP.'
          });
        }
      );
    } catch (error) {
      console.error('Register error:', error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
// @access  Private
router.post('/verify-otp', auth, async (req, res) => {
  const { otp } = req.body;

  if (!otp || otp.length !== 6) {
    return res.status(400).json({ msg: 'Please provide a valid 6-digit OTP' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account already verified' });
    }

    // Check if OTP expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP. Please try again.' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationOTP = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      msg: 'Email verified successfully! Your account is now active.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Private
router.post('/resend-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otp);

    res.json({ msg: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ msg: 'Failed to resend OTP' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check if email is verified
      if (!user.isVerified) {
        return res.status(403).json({ 
          msg: 'Please verify your email before logging in',
          isVerified: false,
          userId: user.id
        });
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // Sign token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              isVerified: true
            }
          });
        }
      );
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;