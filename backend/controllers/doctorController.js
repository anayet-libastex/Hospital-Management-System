import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import MedicalHistory from '../models/MedicalHistory.js';
import LabTestRequest from '../models/LabTestRequest.js';

// @desc    Get all appointments assigned to this doctor
// @route   GET /api/doctor/appointments
export const getAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone')
      .populate('departmentId', 'name');
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update appointment status
// @route   PUT /api/doctor/appointments/:id/status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });
    // Ensure this appointment belongs to the doctor
    if (appointment.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this appointment' });
    }
    res.json({ msg: 'Appointment status updated', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Create prescription
// @route   POST /api/doctor/prescriptions
export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, patientId, medicines, diagnosis } = req.body;
    const doctorId = req.user.id;

    // Verify appointment belongs to this doctor
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

    // Update medical history (add record)
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

// @desc    Get patient medical history
// @route   GET /api/doctor/patients/:id/medical-history
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

// @desc    Request a lab test
// @route   POST /api/doctor/lab-requests
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

// @desc    View all lab requests made by this doctor
// @route   GET /api/doctor/lab-requests
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