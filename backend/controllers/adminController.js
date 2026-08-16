import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import LabStaff from '../models/LabStaff.js';
import Patient from '../models/Patient.js';
import Department from '../models/Department.js';
import bcrypt from 'bcrypt';
import Appointment from '../models/Appointment.js';

// ----- Doctor Management -----
export const createDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, departmentId, schedule, qualification } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create base user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'doctor',
      phone: req.body.phone,
      address: req.body.address,
    });
    await user.save();

    // Create doctor profile
    const doctor = new Doctor({
      _id: user._id,
      specialization,
      departmentId,
      schedule,
      qualification,
    });
    await doctor.save();

    res.status(201).json({ msg: 'Doctor created successfully', doctor });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('departmentId', 'name');
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Update base user info if needed
    if (updates.name || updates.email || updates.phone || updates.address) {
      await User.findByIdAndUpdate(id, {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
      });
    }
    // Update doctor-specific fields
    const doctor = await Doctor.findByIdAndUpdate(id, updates, { new: true });
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    res.json({ msg: 'Doctor updated', doctor });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    // Remove doctor profile and user
    await Doctor.findByIdAndDelete(id);
    await User.findByIdAndDelete(id);
    res.json({ msg: 'Doctor deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Staff Management -----
export const createLabStaff = async (req, res) => {
  try {
    const { name, email, password, departmentId, qualification } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'labstaff',
      phone: req.body.phone,
      address: req.body.address,
    });
    await user.save();

    const staff = new LabStaff({
      _id: user._id,
      departmentId,
      qualification,
    });
    await staff.save();

    res.status(201).json({ msg: 'Lab staff created', staff });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await LabStaff.find().populate('departmentId', 'name');
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.name || updates.email || updates.phone || updates.address) {
      await User.findByIdAndUpdate(id, {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
      });
    }
    const staff = await LabStaff.findByIdAndUpdate(id, updates, { new: true });
    if (!staff) return res.status(404).json({ msg: 'Staff not found' });
    res.json({ msg: 'Staff updated', staff });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await LabStaff.findByIdAndDelete(id);
    await User.findByIdAndDelete(id);
    res.json({ msg: 'Staff deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Department Management -----
export const createDepartment = async (req, res) => {
  try {
    const { name, description, headDoctor } = req.body;
    const department = new Department({ name, description, headDoctor });
    await department.save();
    res.status(201).json({ msg: 'Department created', department });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('headDoctor', 'name');
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, { new: true });
    if (!department) return res.status(404).json({ msg: 'Department not found' });
    res.json({ msg: 'Department updated', department });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ msg: 'Department deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Patient Management -----
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate('medicalHistoryId');
    res.json(patients);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.name || updates.email || updates.phone || updates.address) {
      await User.findByIdAndUpdate(id, {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        address: updates.address,
      });
    }
    const patient = await Patient.findByIdAndUpdate(id, updates, { new: true });
    if (!patient) return res.status(404).json({ msg: 'Patient not found' });
    res.json({ msg: 'Patient updated', patient });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    await User.findByIdAndDelete(id);
    res.json({ msg: 'Patient deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Reports -----
export const getReports = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalStaff = await LabStaff.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    res.json({
      totalPatients,
      totalDoctors,
      totalStaff,
      totalDepartments,
      totalAppointments,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- User Management (Create any user with role) -----
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, ...extra } = req.body;
    if (!['doctor', 'labstaff'].includes(role)) {
      return res.status(400).json({ msg: 'Only doctor or labstaff can be created via this endpoint' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone: extra.phone,
      address: extra.address,
    });
    await user.save();

    // Create role-specific profile
    let profile;
    if (role === 'doctor') {
      const { specialization, departmentId, schedule, qualification } = extra;
      profile = new Doctor({
        _id: user._id,
        specialization,
        departmentId,
        schedule,
        qualification,
      });
    } else if (role === 'labstaff') {
      const { departmentId, qualification } = extra;
      profile = new LabStaff({
        _id: user._id,
        departmentId,
        qualification,
      });
    }
    await profile.save();

    res.status(201).json({ msg: `${role} created successfully`, user: { id: user._id, email, role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};