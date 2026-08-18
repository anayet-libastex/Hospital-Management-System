import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import MedicalHistory from '../models/MedicalHistory.js';
import LabTestRequest from '../models/LabTestRequest.js';
import Doctor from '../models/Doctor.js';
import mongoose from 'mongoose';

// @desc    Get all appointments assigned to this doctor
// @route   GET /api/doctor/appointments
export const getAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    console.log('🔵 Doctor ID from token:', doctorId);

    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone')
      .populate('departmentId', 'name')
      .populate('doctorId', 'name specialization');

    console.log('🟢 Appointments found:', appointments.length);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error in getAppointments:', err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// ----- updateAppointmentStatus -----
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });
    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this appointment' });
    }
    res.json({ msg: 'Appointment status updated', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ FIXED: createPrescription with medicines JSON parsing
export const createPrescription = async (req, res) => {
  try {
    let { appointmentId, patientId, medicines, diagnosis } = req.body;
    const doctorId = req.user.id;

    console.log('📥 Raw received data:', { appointmentId, patientId, diagnosis, medicines });

    // 1. যদি medicines স্ট্রিং হয়, তাহলে JSON parse করি
    if (typeof medicines === 'string') {
      try {
        medicines = JSON.parse(medicines);
      } catch (parseErr) {
        return res.status(400).json({ msg: 'Invalid medicines JSON format' });
      }
    }

    // 2. ভ্যালিডেশন
    if (!appointmentId || !patientId || !medicines || !diagnosis) {
      return res.status(400).json({ msg: 'Missing required fields: appointmentId, patientId, medicines, diagnosis' });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ msg: 'Medicines must be a non-empty array' });
    }

    // 3. ObjectId ফরম্যাট চেক
    if (!mongoose.Types.ObjectId.isValid(appointmentId) || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ msg: 'Invalid appointmentId or patientId format' });
    }

    // 4. অ্যাপয়েন্টমেন্ট ভেরিফাই
    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found or not yours' });
    }

    // 5. মেডিসিন অ্যারে প্রসেস (ডিফল্ট মান যোগ)
    const processedMedicines = medicines.map(med => ({
      name: med.name,
      dosage: med.dosage || '',
      duration: med.duration || '',
      instructions: med.instructions || '',
      times: Array.isArray(med.times) ? med.times : [],
      mealRelation: med.mealRelation || 'before meal',
    }));

    // 6. প্রেসক্রিপশন তৈরি ও সেভ
    const prescription = new Prescription({
      appointmentId,
      patientId,
      doctorId,
      medicines: processedMedicines,
      diagnosis,
    });

    await prescription.save();

    // 7. মেডিকেল হিস্ট্রি আপডেট
    let history = await MedicalHistory.findOne({ patientId });
    if (!history) {
      history = new MedicalHistory({ patientId, records: [] });
    }
    history.records.push({
      date: new Date(),
      diagnosis,
      doctorId,
      prescriptionId: prescription._id,
    });
    await history.save();

    res.status(201).json({ msg: 'Prescription created successfully', prescription });
  } catch (err) {
    console.error('❌ Prescription creation error:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: 'Validation error', errors });
    }

    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// ----- updateAppointment -----
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, appointmentType } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });
    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (reason !== undefined) appointment.reason = reason;
    if (appointmentType !== undefined) appointment.appointmentType = appointmentType;

    await appointment.save();
    res.json({ msg: 'Appointment updated successfully', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// ✅ FIXED: Returns 200 with empty records
export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const history = await MedicalHistory.findOne({ patientId })
      .populate('records.doctorId', 'name')
      .populate('records.prescriptionId');

    if (!history) {
      return res.status(200).json({
        patientId,
        records: [],
        msg: 'No medical history found'
      });
    }
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ----- Lab Request functions -----
export const createLabRequest = async (req, res) => {
  try {
    const { patientId, notes, testTypes } = req.body; // testTypes অ্যারে
    const doctorId = req.user.id;

    // ভ্যালিডেশন
    if (!patientId || !testTypes || testTypes.length === 0) {
      return res.status(400).json({ msg: 'Patient ID and at least one test type required' });
    }

    const request = new LabTestRequest({
      doctorId,
      patientId,
      notes,
      testTypes, // অ্যারে সেভ হবে
      status: 'pending',
    });
    await request.save();

    res.status(201).json({ msg: 'Lab test request created', request });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getLabRequests = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const requests = await LabTestRequest.find({ doctorId })
      .populate('patientId', 'name email')
      // .populate('labStaffId', 'name');
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update a lab request
// @route   PUT /api/doctor/lab-requests/:id
export const updateLabRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, status, notes, testTypes } = req.body;
    const doctorId = req.user.id;

    // Find the lab request
    const request = await LabTestRequest.findOne({ _id: id, doctorId });
    if (!request) {
      return res.status(404).json({ msg: 'Lab request not found or not yours' });
    }

    // Update fields
    if (patientId) request.patientId = patientId;
    if (status) request.status = status;
    if (notes !== undefined) request.notes = notes;
    if (testTypes && Array.isArray(testTypes) && testTypes.length > 0) {
      request.testTypes = testTypes;
    }

    await request.save();
    res.json({ msg: 'Lab request updated successfully', request });
  } catch (err) {
    console.error('❌ Error in updateLabRequest:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// @desc    Delete a lab request
// @route   DELETE /api/doctor/lab-requests/:id
export const deleteLabRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const request = await LabTestRequest.findOne({ _id: id, doctorId });
    if (!request) {
      return res.status(404).json({ msg: 'Lab request not found or not yours' });
    }

    await request.deleteOne();
    res.json({ msg: 'Lab request deleted successfully' });
  } catch (err) {
    console.error('❌ Error in deleteLabRequest:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};