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
  deleteLabRequest
} from '../controllers/doctorController.js';

const router = express.Router();
router.use(auth, roleCheck('doctor'));

router.get('/appointments', getAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.put('/appointments/:id', updateAppointment); 
router.post('/prescriptions', createPrescription);
router.get('/patients/:id/medical-history', getPatientMedicalHistory);
router.post('/lab-requests', createLabRequest);
router.get('/lab-requests', getLabRequests);
router.put('/lab-requests/:id', updateLabRequest);   
router.delete('/lab-requests/:id', deleteLabRequest);

export default router;