import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

// Import admin controller functions
import {
  createDoctor,
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
  createLabStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  createDepartment,
  getAllDepartments,
  updateDepartment,
  deleteDepartment,
  getAllPatients,
  updatePatient,
  deletePatient,
  getReports,
  createUser, // user management
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and 'admin' role
router.use(auth, roleCheck('admin'));

// ---------- Doctor Management ----------
router.post('/doctors', createDoctor);          // Create doctor
router.get('/doctors', getAllDoctors);          // List all doctors
router.put('/doctors/:id', updateDoctor);       // Update doctor by ID
router.delete('/doctors/:id', deleteDoctor);    // Delete doctor

// ---------- Staff Management ----------
router.post('/staff', createLabStaff);          // Create lab staff
router.get('/staff', getAllStaff);              // List all staff
router.put('/staff/:id', updateStaff);          // Update staff by ID
router.delete('/staff/:id', deleteStaff);       // Delete staff

// ---------- Department Management ----------
router.post('/departments', createDepartment);      // Create department
router.get('/departments', getAllDepartments);      // List all departments (admin view)
router.put('/departments/:id', updateDepartment);   // Update department
router.delete('/departments/:id', deleteDepartment);// Delete department

// ---------- Patient Management ----------
router.get('/patients', getAllPatients);        // List all patients
router.put('/patients/:id', updatePatient);     // Update patient (admin can modify)
router.delete('/patients/:id', deletePatient);  // Delete patient

// ---------- Reports ----------
router.get('/reports', getReports);             // Get aggregated stats (total patients, doctors, etc.)

// ---------- User Management (create any user) ----------
router.post('/user-management', createUser);    // Create user with role (doctor/staff) and send credentials

export default router;