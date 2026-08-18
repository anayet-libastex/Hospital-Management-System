import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import {
  getAssignedRequests,
  assignRequest,
  updateRequestStatus,
  getReports,
} from '../controllers/labStaffController.js';

const router = express.Router();
router.use(auth, roleCheck('labstaff'));

router.get('/requests', getAssignedRequests);
router.put('/requests/:id/assign', assignRequest);
router.put('/requests/:id/status', updateRequestStatus);
router.get('/reports', getReports);

export default router;