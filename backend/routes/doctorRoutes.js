import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

import {
  getAppointments,
  updateAppointmentStatus,
  updateAppointment,
  createPrescription,
  getPatientMedicalHistory,
  createLabRequest,
  getLabRequests,
  updateLabRequest,
  deleteLabRequest,
  getPrescriptions,        // ✅ নতুন
  updatePrescription,      // ✅ নতুন
  deletePrescription       // ✅ নতুন
} from '../controllers/doctorController.js';

const router = express.Router();
router.use(auth, roleCheck('doctor'));

// ----- Appointments -----
router.get('/appointments', getAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.put('/appointments/:id', updateAppointment);

// ----- Prescriptions -----
router.post('/prescriptions', createPrescription);
router.get('/prescriptions', getPrescriptions);          // ✅ নতুন: ডাক্তারের সব প্রেসক্রিপশন দেখুন
router.put('/prescriptions/:id', updatePrescription);    // ✅ নতুন: প্রেসক্রিপশন আপডেট করুন
router.delete('/prescriptions/:id', deletePrescription); // ✅ নতুন: প্রেসক্রিপশন ডিলিট করুন

// ----- Medical History -----
router.get('/patients/:id/medical-history', getPatientMedicalHistory);

// ----- Lab Requests -----
router.post('/lab-requests', createLabRequest);
router.get('/lab-requests', getLabRequests);
router.put('/lab-requests/:id', updateLabRequest);
router.delete('/lab-requests/:id', deleteLabRequest);

export default router;