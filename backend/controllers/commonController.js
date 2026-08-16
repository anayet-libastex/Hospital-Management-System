import Department from '../models/Department.js';
import Doctor from '../models/Doctor.js';

// @desc    Get all departments (public)
// @route   GET /api/departments
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('headDoctor', 'name');
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all doctors (public)
// @route   GET /api/doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('departmentId', 'name');
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};