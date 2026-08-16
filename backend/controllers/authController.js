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
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create base user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'patient',
      phone,
      address,
    });
    await user.save();

    // Create patient profile
    const patient = new Patient({
      _id: user._id,
      dateOfBirth,
      bloodGroup,
      emergencyContact,
    });
    await patient.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
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