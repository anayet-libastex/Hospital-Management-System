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
router.use(auth, roleCheck('doctor'));

router.get('/appointments', getAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.post('/prescriptions', createPrescription);
router.get('/patients/:id/medical-history', getPatientMedicalHistory);
router.post('/lab-requests', createLabRequest);
router.get('/lab-requests', getLabRequests);

export default router;