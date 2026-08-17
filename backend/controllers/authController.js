import User from '../models/User.js';
import Patient from '../models/Patient.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// @desc    Register a new patient (self-registration)
// @route   POST /api/auth/register
// @access  Public
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, address, dateOfBirth, bloodGroup, emergencyContact } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ সরাসরি Patient ডিসক্রিমিনেটর মডেল ব্যবহার করুন (সব ফিল্ড একসঙ্গে)
    const patient = new Patient({
      // বেস ইউজার ফিল্ড
      name,
      email,
      password: hashedPassword,
      role: 'patient', // এই role অনুযায়ী ডিসক্রিমিনেটর চিহ্নিত হবে
      phone,
      address,
      // ডিসক্রিমিনেটর ফিল্ড
      dateOfBirth,
      bloodGroup,
      emergencyContact,
    });

    await patient.save();

    // Generate JWT
    const token = jwt.sign(
      { id: patient._id, role: patient.role, email: patient.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: patient.role,
      },
    });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    // Mongoose validation error হলে ক্লিন মেসেজ পাঠান
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    // ডুপ্লিকেট কী এরর (unique index) হ্যান্ডেল
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ msg: `${field} already exists.` });
    }
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// @desc    Login user (all roles)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email, include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Logout (optional – client-side token removal)
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  // No server-side action needed; client discards token
  res.json({ msg: 'Logged out successfully' });
};