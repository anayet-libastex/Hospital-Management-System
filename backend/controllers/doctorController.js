import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import MedicalHistory from '../models/MedicalHistory.js';
import LabTestRequest from '../models/LabTestRequest.js';
import Doctor from '../models/Doctor.js';

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

// ----- অন্যান্য ফাংশন (updateStatus, createPrescription, ইত্যাদি) -----
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

export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, patientId, medicines, diagnosis } = req.body;
    const doctorId = req.user.id;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found or not yours' });

    const prescription = new Prescription({
      appointmentId,
      patientId,
      doctorId,
      medicines,
      diagnosis,
    });
    await prescription.save();

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

    res.status(201).json({ msg: 'Prescription created', prescription });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { id: patientId } = req.params;
    const history = await MedicalHistory.findOne({ patientId })
      .populate('records.doctorId', 'name')
      .populate('records.prescriptionId');
    if (!history) return res.status(404).json({ msg: 'No medical history found' });
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const createLabRequest = async (req, res) => {
  try {
    const { patientId, testType, notes } = req.body;
    const doctorId = req.user.id;

    const request = new LabTestRequest({
      doctorId,
      patientId,
      testType,
      notes,
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
      .populate('labStaffId', 'name');
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};