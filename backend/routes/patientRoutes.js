import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

import {
  bookAppointment,
  getAppointments,
  cancelAppointment,
  updateAppointment,
  getPrescriptions,
  getMedicalHistory,
  createPayment,
  getPaymentStatus,
  downloadReport,
} from '../controllers/patientController.js';

const router = express.Router();

// All patient routes require authentication and 'patient' role
router.use(auth, roleCheck('patient'));


router.post('/appointments', bookAppointment);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', cancelAppointment);


//View all prescriptions for the logged-in patient
router.get('/prescriptions', getPrescriptions);


//View own medical history
router.get('/medical-history', getMedicalHistory);

//Initiate online payment (Bkash/Rocket/Nagod)
router.post('/payments', createPayment);

//Check payment status by transaction ID
router.get('/payments/:id', getPaymentStatus);

//Download a report file (e.g., lab report)
router.get('/reports/download/:id', downloadReport);

export default router;