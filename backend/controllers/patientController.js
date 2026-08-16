import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import MedicalHistory from '../models/MedicalHistory.js';
import Payment from '../models/Payment.js';
import Doctor from '../models/Doctor.js';
import LabTestRequest from '../models/LabTestRequest.js';

// @desc    Book an appointment
// @route   POST /api/patient/appointments
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, departmentId, date, time, notes } = req.body;
    const patientId = req.user.id;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

    // Check for duplicate booking (same patient, same doctor, same date/time)
    const existing = await Appointment.findOne({ patientId, doctorId, date, time, status: { $ne: 'cancelled' } });
    if (existing) return res.status(400).json({ msg: 'Appointment already booked at this slot' });

    const appointment = new Appointment({
      patientId,
      doctorId,
      departmentId,
      date,
      time,
      notes,
      status: 'pending',
    });
    await appointment.save();

    res.status(201).json({ msg: 'Appointment booked', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get logged-in patient's appointments
// @route   GET /api/patient/appointments
export const getAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('departmentId', 'name');
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Cancel appointment (only if pending)
// @route   DELETE /api/patient/appointments/:id
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findOne({ _id: id, patientId: req.user.id });
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });
    if (appointment.status !== 'pending') {
      return res.status(400).json({ msg: 'Cannot cancel confirmed/completed appointment' });
    }
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ msg: 'Appointment cancelled', appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    View prescriptions for logged-in patient
// @route   GET /api/patient/prescriptions
export const getPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;
    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('appointmentId');
    res.json(prescriptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    View own medical history
// @route   GET /api/patient/medical-history
export const getMedicalHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
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

// @desc    Initiate online payment (Bkash/Rocket/Nagod)
// @route   POST /api/patient/payments
export const createPayment = async (req, res) => {
  try {
    const { appointmentId, amount, method } = req.body;
    const patientId = req.user.id;

    // Validate payment method
    if (!['bkash', 'rocket', 'nogod'].includes(method)) {
      return res.status(400).json({ msg: 'Invalid payment method' });
    }

    // Generate a dummy transaction ID (in real app, integrate with gateway)
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const payment = new Payment({
      patientId,
      appointmentId,
      amount,
      method,
      transactionId,
      status: 'completed', // simulate success
    });
    await payment.save();

    res.status(201).json({ msg: 'Payment successful', payment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Check payment status
// @route   GET /api/patient/payments/:id
export const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ _id: id, patientId: req.user.id });
    if (!payment) return res.status(404).json({ msg: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Download report (lab report, etc.)
// @route   GET /api/patient/reports/download/:id
export const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    // For simplicity, we fetch a lab test request and return its result as a file link
    const request = await LabTestRequest.findOne({ _id: id, patientId: req.user.id });
    if (!request) return res.status(404).json({ msg: 'Report not found' });

    // In real scenario, you'd serve a file from storage.
    // Here we just return the result text as a JSON.
    res.json({ report: request.result, reportDate: request.reportDate });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};