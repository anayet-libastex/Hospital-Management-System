import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import MedicalHistory from '../models/MedicalHistory.js';
import Payment from '../models/Payment.js';
import Doctor from '../models/Doctor.js';
import LabTestRequest from '../models/LabTestRequest.js';
import mongoose from 'mongoose';

//Appointments
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, departmentId, date, time, notes, reason, appointmentType } = req.body;
    const patientId = req.user.id;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

    // Check for duplicate booking
    const existing = await Appointment.findOne({ patientId, doctorId, date, time, status: { $ne: 'cancelled' } });
    if (existing) return res.status(400).json({ msg: 'Appointment already booked at this slot' });

    const appointment = new Appointment({
      patientId,
      doctorId,
      departmentId,
      date,
      time,
      notes,
      reason,
      appointmentType,
      status: 'pending',
    });
    await appointment.save();

    res.status(201).json({ msg: 'Appointment booked', appointment });
  } catch (err) {
    console.error('❌ Error in bookAppointment:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('departmentId', 'name')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error in getAppointments:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

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
    console.error('❌ Error in cancelAppointment:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId, doctorId, date, time, notes, reason, appointmentType } = req.body;
    
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, patientId: req.user.id, status: 'pending' },
      { departmentId, doctorId, date, time, notes, reason, appointmentType },
      { new: true, runValidators: true }
    );
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found or not editable' });
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error in updateAppointment:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findOne({ _id: id, patientId })
      .populate('doctorId', 'name specialization')
      .populate('departmentId', 'name');

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error in getAppointmentById:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      console.error('❌ Invalid patientId from token:', patientId);
      return res.status(400).json({ msg: 'Invalid patient ID' });
    }

    const prescriptions = await Prescription.find({ patientId })
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'date time departmentId')
      .lean()
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (err) {
    console.error('❌ Error in getPrescriptions:', err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: 'Validation error', errors });
    }
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

//medical-history
export const getMedicalHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const history = await MedicalHistory.findOne({ patientId })
      .populate('records.doctorId', 'name')
      .populate('records.prescriptionId');

    if (!history) {
      return res.status(200).json({ patientId, records: [], msg: 'No medical history found' });
    }
    res.json(history);
  } catch (err) {
    console.error('❌ Error in getMedicalHistory:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

//Payment
export const createPayment = async (req, res) => {
  try {
    const { appointmentId, amount, method, transactionId } = req.body; // transactionId নিন
    const patientId = req.user.id;

    // validate...

    const payment = new Payment({
      patientId,
      appointmentId,
      amount,
      method,
      transactionId, // ইউজার থেকে আসা ট্রানজেকশন আইডি
      status: 'completed',
    });
    await payment.save();

    // ✅ স্পষ্টভাবে transactionId সহ রেসপন্স দিন
    res.status(201).json({
      msg: 'Payment successful',
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
      },
      transactionId: payment.transactionId, // আলাদাভাবেও পাঠাতে পারেন
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ _id: id, patientId: req.user.id });
    if (!payment) return res.status(404).json({ msg: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    console.error('❌ Error in getPaymentStatus:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// ---------- Get payment history for logged-in patient ----------
export const getPaymentHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const payments = await Payment.find({ patientId })
      .populate('appointmentId', 'date time doctorId')
      .populate({
        path: 'appointmentId',
        populate: { path: 'doctorId', select: 'name specialization' }
      })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('❌ Error in getPaymentHistory:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

export const getPatientLabRequests = async (req, res) => {
  try {
    const patientId = req.user.id;
    const requests = await LabTestRequest.find({ patientId })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('❌ Error in getPatientLabRequests:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LabTestRequest.findOne({ _id: id, patientId: req.user.id });
    if (!request) return res.status(404).json({ msg: 'Report not found' });
    res.json({ report: request.result, reportDate: request.reportDate });
  } catch (err) {
    console.error('❌ Error in downloadReport:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};