import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

import {
  getAppointments,
  updateAppointmentStatus,
  createPrescription,
  getPatientMedicalHistory,
  createLabRequest,
  getLabRequests,
} from '../controllers/doctorController.js';

const router = express.Router();

// All doctor routes require authentication and 'doctor' role
router.use(auth, roleCheck('doctor'));

// @route   GET /api/doctor/appointments
// @desc    View all appointments assigned to this doctor
router.get('/appointments', getAppointments);

// @route   PUT /api/doctor/appointments/:id/status
// @desc    Update appointment status (confirm/complete/cancel)
router.put('/appointments/:id/status', updateAppointmentStatus);

// @route   POST /api/doctor/prescriptions
// @desc    Create a prescription for a patient (linked to appointment)
router.post('/prescriptions', createPrescription);

// @route   GET /api/doctor/patients/:id/medical-history
// @desc    View a patient's medical history (by patient ID)
router.get('/patients/:id/medical-history', getPatientMedicalHistory);

// @route   POST /api/doctor/lab-requests
// @desc    Request a lab test for a patient
router.post('/lab-requests', createLabRequest);

// @route   GET /api/doctor/lab-requests
// @desc    View all lab requests made by this doctor (with status)
router.get('/lab-requests', getLabRequests);

export default router;