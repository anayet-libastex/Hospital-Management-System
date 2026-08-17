import mongoose from 'mongoose';
import './Doctor.js';   // Doctor ডিসক্রিমিনেটর রেজিস্টার
import './Patient.js';  // Patient ডিসক্রিমিনেটর রেজিস্টার

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'doctor',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    // ✅ নতুন ফিল্ড – Reason for Visit (Mandatory)
    reason: { 
      type: String, 
      trim: true,
      required: true,
    },
    // ✅ নতুন ফিল্ড – Appointment Type (Optional)
    appointmentType: {
      type: String,
      enum: ['general', 'followup', 'emergency', 'telemedicine'],
      default: 'general',
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;