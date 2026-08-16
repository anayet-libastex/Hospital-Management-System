import express from 'express';
import { getAllDepartments, getAllDoctors } from '../controllers/commonController.js';

const router = express.Router();

// @route   GET /api/departments
// @desc    Get all departments (public, for dropdowns)
router.get('/departments', getAllDepartments);

// @route   GET /api/doctors
// @desc    Get all doctors (public, for patient booking)
router.get('/doctors', getAllDoctors);

// Optional: any other public routes (e.g., hospital info)

export default router;