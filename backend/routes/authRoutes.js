import express from 'express';
import { registerPatient, loginUser, logoutUser } from '../controllers/authController.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Patient self-registration (no token required)
// @access  Public
router.post('/register', registerPatient);

// @route   POST /api/auth/login
// @desc    Login for all roles (returns JWT)
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/logout
// @desc    Logout (client-side token removal – optional endpoint)
// @access  Public (just returns success)
router.post('/logout', logoutUser);

export default router;