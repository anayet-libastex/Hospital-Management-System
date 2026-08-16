import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

import {
  bookAppointment,
  getAppointments,
  cancelAppointment,
  getPrescriptions,
  getMedicalHistory,
  createPayment,
  getPaymentStatus,
  downloadReport,
} from '../controllers/patientController.js';

const router = express.Router();

// All patient routes require authentication and 'patient' role
router.use(auth, roleCheck('patient'));

// @route   POST /api/patient/appointments
// @desc    Book a new appointment
router.post('/appointments', bookAppointment);

// @route   GET /api/patient/appointments
// @desc    View own appointments
router.get('/appointments', getAppointments);

// @route   DELETE /api/patient/appointments/:id
// @desc    Cancel an appointment (only if pending)
router.delete('/appointments/:id', cancelAppointment);

// @route   GET /api/patient/prescriptions
// @desc    View all prescriptions for the logged-in patient
router.get('/prescriptions', getPrescriptions);

// @route   GET /api/patient/medical-history
// @desc    View own medical history
router.get('/medical-history', getMedicalHistory);

// @route   POST /api/patient/payments
// @desc    Initiate online payment (Bkash/Rocket/Nagod)
router.post('/payments', createPayment);

// @route   GET /api/patient/payments/:id
// @desc    Check payment status by transaction ID
router.get('/payments/:id', getPaymentStatus);

// @route   GET /api/patient/reports/download/:id
// @desc    Download a report file (e.g., lab report)
router.get('/reports/download/:id', downloadReport);

export default router;