import express from 'express';
import auth from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';

import {
  createDoctor,
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
  getDoctorById,
  createLabStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  getStaffById,
  createDepartment,
  getAllDepartments,
  getDepartmentById,     
  updateDepartment,
  deleteDepartment,
  getAllPatients,
  updatePatient,
  deletePatient,
  getReports,
  createUser,
  getUsers,
  getFullUserById,
  updateUser,
  deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and 'admin' role
router.use(auth, roleCheck('admin'));

// ---------- Doctor Management ----------
router.post('/doctors', createDoctor);
router.get('/doctors', getAllDoctors);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.get('/doctors/:id', getDoctorById);

// ---------- Staff Management ----------
router.post('/staff', createLabStaff);
router.get('/staff', getAllStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);
router.get('/staff/:id', getStaffById);

// ---------- Department Management ----------
router.post('/departments', createDepartment);
router.get('/departments', getAllDepartments);
router.get('/departments/:id', getDepartmentById);  
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// ---------- Patient Management ----------
router.get('/patients', getAllPatients);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', deletePatient);

// ---------- Reports ----------
router.get('/reports', getReports);

// ---------- User Management ----------
router.post('/user-management', createUser);
router.get('/users', getUsers);                 
router.get('/users/:id', getFullUserById);     
router.put('/users/:id', updateUser);           
router.delete('/users/:id', deleteUser);      

export default router;