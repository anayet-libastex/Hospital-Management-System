import bcrypt from "bcrypt";
import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Department from "../models/Department.js";
import Doctor from "../models/Doctor.js";
import LabStaff from "../models/LabStaff.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";

// ----- Doctor Management -----
// export const createDoctor = async (req, res) => {
//   try {
//     console.log("📦 Request Body:", req.body);

//     const {
//       name,
//       email,
//       password,
//       specialization,
//       departmentId,
//       schedule,
//       qualification,
//     } = req.body;

//     // ✅ ভ্যালিডেশন
//     if (!name?.trim()) {
//       return res.status(400).json({ msg: "Doctor name is required." });
//     }
//     if (!email?.trim()) {
//       return res.status(400).json({ msg: "Email is required." });
//     }
//     if (!password?.trim()) {
//       return res.status(400).json({ msg: "Password is required." });
//     }
//     if (!specialization?.trim()) {
//       return res.status(400).json({ msg: "Specialization is required." });
//     }
//     if (!departmentId || departmentId.trim() === "") {
//       return res.status(400).json({ msg: "Department ID is required." });
//     }

//     // ✅ departmentId কে ObjectId-তে কনভার্ট
//     const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId)
//       ? new mongoose.Types.ObjectId(departmentId)
//       : null;

//     if (!deptObjectId) {
//       return res.status(400).json({ msg: "Invalid Department ID format." });
//     }

//     // চেক করুন ইউজার আগে থেকে আছে কিনা
//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ msg: "User already exists" });

//     // পাসওয়ার্ড হ্যাশ করুন
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // ইউজার তৈরি করুন (role: 'doctor')
//     user = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: "doctor",
//       phone: req.body.phone,
//       address: req.body.address,
//     });
//     await user.save();

//     // ✅ এখন Doctor ডিসক্রিমিনেটর তৈরি করুন
//     const doctorData = {
//       _id: user._id,
//       specialization,
//       departmentId: deptObjectId,
//       schedule: schedule || {},
//       qualification: qualification || "",
//     };

//     console.log("🟢 Creating doctor with data:", doctorData);

//     // ডক্টর মডেল ব্যবহার করে তৈরি করুন
//     const doctor = new Doctor(doctorData);
//     await doctor.save();

//     res.status(201).json({ msg: "Doctor created successfully", doctor });
//   } catch (err) {
//     console.error("❌ Error in createDoctor:", err.message);
//     // Mongoose validation error হলে ক্লিন মেসেজ পাঠান
//     if (err.name === "ValidationError") {
//       const errors = Object.values(err.errors).map((e) => e.message);
//       return res.status(400).json({ msg: errors.join(", ") });
//     }
//     res.status(500).json({ msg: "Server error: " + err.message });
//   }
// };
export const createDoctor = async (req, res) => {
  try {
    // console.log("📦 Request Body:", req.body);

    const {
      name,
      email,
      password,
      specialization,
      departmentId,
      schedule,
      qualification,
    } = req.body;

    // ✅ ভ্যালিডেশন
    if (!name?.trim()) {
      return res.status(400).json({ msg: "Doctor name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).json({ msg: "Email is required." });
    }
    if (!password?.trim()) {
      return res.status(400).json({ msg: "Password is required." });
    }
    if (!specialization?.trim()) {
      return res.status(400).json({ msg: "Specialization is required." });
    }
    if (!departmentId || departmentId.trim() === "") {
      return res.status(400).json({ msg: "Department ID is required." });
    }

    // ✅ departmentId কে ObjectId-তে কনভার্ট
    const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId)
      ? new mongoose.Types.ObjectId(departmentId)
      : null;
    if (!deptObjectId) {
      return res.status(400).json({ msg: "Invalid Department ID format." });
    }

    // চেক করুন ইউজার আগে থেকে আছে কিনা
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // পাসওয়ার্ড হ্যাশ করুন
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ সরাসরি Doctor ডিসক্রিমিনেটর মডেল ব্যবহার করুন (সব ফিল্ড একসঙ্গে)
    const doctor = new Doctor({
      // বেস ইউজার ফিল্ড
      name,
      email,
      password: hashedPassword,
      role: "doctor", // এই role অনুযায়ী ডিসক্রিমিনেটর চিহ্নিত হবে
      phone: req.body.phone,
      address: req.body.address,
      // ডিসক্রিমিনেটর ফিল্ড
      specialization,
      departmentId: deptObjectId,
      schedule: schedule || {},
      qualification: qualification || "",
    });

    console.log("🟢 Creating doctor with data:", doctor);

    await doctor.save();

    res.status(201).json({ msg: "Doctor created successfully", doctor });
  } catch (err) {
    console.error("❌ Error in createDoctor:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ msg: errors.join(", ") });
    }
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("departmentId", "name");
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateDoctor = async (req, res) => {
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
    const doctor = await Doctor.findByIdAndUpdate(id, updates, { new: true });
    if (!doctor) return res.status(404).json({ msg: "Doctor not found" });
    res.json({ msg: "Doctor updated", doctor });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    await Doctor.findByIdAndDelete(id);
    await User.findByIdAndDelete(id);
    res.json({ msg: "Doctor deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id).populate('departmentId', 'name');
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Staff Management -----
export const createLabStaff = async (req, res) => {
  try {
    const { name, email, password, departmentId, qualification } = req.body;

    // ✅ ভ্যালিডেশন
    if (!name?.trim()) {
      return res.status(400).json({ msg: "Staff name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).json({ msg: "Email is required." });
    }
    if (!password?.trim()) {
      return res.status(400).json({ msg: "Password is required." });
    }
    if (!departmentId || departmentId.trim() === "") {
      return res.status(400).json({ msg: "Department ID is required." });
    }

    // ✅ departmentId কে ObjectId-তে কনভার্ট
    const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId)
      ? new mongoose.Types.ObjectId(departmentId)
      : null;
    if (!deptObjectId) {
      return res.status(400).json({ msg: "Invalid Department ID format." });
    }

    // চেক করুন ইউজার আগে থেকে আছে কিনা
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // পাসওয়ার্ড হ্যাশ করুন
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ সরাসরি LabStaff ডিসক্রিমিনেটর মডেল ব্যবহার করুন (সব ফিল্ড একসঙ্গে)
    const staff = new LabStaff({
      // বেস ইউজার ফিল্ড
      name,
      email,
      password: hashedPassword,
      role: "labstaff", // এই role অনুযায়ী ডিসক্রিমিনেটর চিহ্নিত হবে
      phone: req.body.phone,
      address: req.body.address,
      // ডিসক্রিমিনেটর ফিল্ড
      departmentId: deptObjectId,
      qualification: qualification || "",
    });

    console.log("🟢 Creating staff with data:", staff);

    await staff.save();

    res.status(201).json({ msg: "Lab staff created successfully", staff });
  } catch (err) {
    console.error("❌ Error in createLabStaff:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ msg: errors.join(", ") });
    }
    res.status(500).json({ msg: "Server error: " + err.message });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = await LabStaff.find().populate("departmentId", "name");
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, email, departmentId, qualification, phone, address } = req.body;

    // ✅ departmentId থাকলে ObjectId-তে কনভার্ট করুন, না থাকলে null
    let deptObjectId = null;
    if (departmentId && departmentId.trim() !== "") {
      deptObjectId = mongoose.Types.ObjectId.isValid(departmentId)
        ? new mongoose.Types.ObjectId(departmentId)
        : null;
      if (!deptObjectId) {
        return res.status(400).json({ msg: "Invalid Department ID format." });
      }
    }

    // User আপডেট
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone) userUpdates.phone = phone;
    if (address) userUpdates.address = address;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(id, userUpdates);
    }

    // LabStaff আপডেট – শুধু qualification ও departmentId (যদি দেওয়া থাকে)
    const staffUpdates = {};
    if (qualification !== undefined) staffUpdates.qualification = qualification;
    if (deptObjectId) {
      staffUpdates.departmentId = deptObjectId;
    } else if (departmentId === null || departmentId === "") {
      // departmentId সরাতে চাইলে null সেট করুন (কিন্তু স্কিমায় required, তাই সরানো যাবে না)
      // এখানে আমরা departmentId সেট না করলে আগের মান অপরিবর্তিত থাকবে
    }

    const staff = await LabStaff.findByIdAndUpdate(id, staffUpdates, { new: true });
    if (!staff) return res.status(404).json({ msg: "Staff not found" });
    res.json({ msg: "Staff updated", staff });
  } catch (err) {
    console.error(err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ msg: errors.join(", ") });
    }
    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await LabStaff.findByIdAndDelete(id);
    await User.findByIdAndDelete(id);
    res.json({ msg: "Staff deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await LabStaff.findById(id).populate('departmentId', 'name');
    if (!staff) {
      return res.status(404).json({ msg: 'Staff not found' });
    }
    res.json(staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Department Management -----
export const createDepartment = async (req, res) => {
  try {
    let { name, description, headDoctor } = req.body;
    if (headDoctor === "" || headDoctor === null || headDoctor === undefined) {
      headDoctor = null;
    }
    const department = new Department({ name, description, headDoctor });
    await department.save();
    res.status(201).json({ msg: "Department created", department });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate("headDoctor", "name");
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id).populate("headDoctor", "name");
    if (!department) return res.status(404).json({ msg: "Department not found" });
    res.json(department);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, headDoctor } = req.body;
    if (headDoctor === "" || headDoctor === null || headDoctor === undefined) {
      headDoctor = null;
    }
    const department = await Department.findByIdAndUpdate(
      id,
      { name, description, headDoctor },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ msg: "Department not found" });
    res.json({ msg: "Department updated", department });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ msg: "Department deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ----- Patient Management -----
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("medicalHistoryId");
    res.json(patients);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
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
    if (!patient) return res.status(404).json({ msg: "Patient not found" });
    res.json({ msg: "Patient updated", patient });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    await User.findByIdAndDelete(id);
    res.json({ msg: "Patient deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
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
    res.status(500).json({ msg: "Server error" });
  }
};

// ----- User Management -----
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, ...extra } = req.body;
    if (!["doctor", "labstaff", "depthead"].includes(role)) {
      return res.status(400).json({ msg: "Only doctor, labstaff, or depthead can be created" });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

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

    let profile;
    if (role === "doctor") {
      const { specialization, departmentId, schedule, qualification } = extra;
      const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId)
        ? new mongoose.Types.ObjectId(departmentId)
        : null;
      profile = new Doctor({
        _id: user._id,
        specialization,
        departmentId: deptObjectId,
        schedule,
        qualification,
      });
    } else if (role === "labstaff") {
      const { departmentId, qualification } = extra;
      const deptObjectId = mongoose.Types.ObjectId.isValid(departmentId)
        ? new mongoose.Types.ObjectId(departmentId)
        : null;
      profile = new LabStaff({
        _id: user._id,
        departmentId: deptObjectId,
        qualification,
      });
    }
    if (profile) await profile.save();

    res.status(201).json({
      msg: `${role} created successfully`,
      user: { id: user._id, email, role },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getFullUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let roleData = null;
    if (user.role === 'doctor') {
      roleData = await Doctor.findById(id).populate('departmentId', 'name');
    } else if (user.role === 'labstaff') {
      roleData = await LabStaff.findById(id).populate('departmentId', 'name');
    } else if (user.role === 'depthead') {
      // Department Head: শুধু ইউজার, কোনো প্রোফাইল নেই
      roleData = { departmentId: null };
    }
    // ইউজার ও রোল ডেটা একত্রে
    const fullUser = user.toObject();
    fullUser.roleData = roleData || {};
    res.json(fullUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, departmentId, specialization, qualification, schedule } = req.body;

    // ১. বেস ইউজার আপডেট
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone) userUpdates.phone = phone;
    if (address) userUpdates.address = address;
    const user = await User.findByIdAndUpdate(id, userUpdates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // ২. রোল-নির্ভর আপডেট
    let updatedRole = null;
    if (user.role === 'doctor') {
      const deptObjectId = departmentId ? new mongoose.Types.ObjectId(departmentId) : null;
      const doctorUpdates = {};
      if (specialization) doctorUpdates.specialization = specialization;
      if (departmentId) doctorUpdates.departmentId = deptObjectId;
      if (qualification !== undefined) doctorUpdates.qualification = qualification;
      if (schedule) doctorUpdates.schedule = schedule;
      updatedRole = await Doctor.findByIdAndUpdate(id, doctorUpdates, { new: true });
    } else if (user.role === 'labstaff') {
      const deptObjectId = departmentId ? new mongoose.Types.ObjectId(departmentId) : null;
      const staffUpdates = {};
      if (departmentId) staffUpdates.departmentId = deptObjectId;
      if (qualification !== undefined) staffUpdates.qualification = qualification;
      updatedRole = await LabStaff.findByIdAndUpdate(id, staffUpdates, { new: true });
    } else if (user.role === 'depthead') {
      // ডিপার্টমেন্ট হেডের জন্য কোনো প্রোফাইল নেই, শুধু ডিপার্টমেন্ট লিঙ্ক নেই
      // আমরা departmentId সেভ করি না, কারণ এটি User-এ নেই
      // আমরা চাইলে User-এ departmentId ফিল্ড যোগ করতে পারি, কিন্তু বর্তমানে নেই
      // তাই ডিপার্টমেন্ট হেডের জন্য departmentId আপডেট করব না।
    }
    res.json({ msg: 'User updated', user, roleData: updatedRole });
  } catch (err) {
    console.error(err.message);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: errors.join(', ') });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // রোল-নির্ভর ডকুমেন্ট ডিলিট
    if (user.role === 'doctor') await Doctor.findByIdAndDelete(id);
    else if (user.role === 'labstaff') await LabStaff.findByIdAndDelete(id);
    // depthead এর কোনো প্রোফাইল নেই

    await User.findByIdAndDelete(id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};