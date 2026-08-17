import mongoose from 'mongoose';
import './Doctor.js'; // ✅ Doctor মডেল রেজিস্টার করতে

const labTestRequestSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    labStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabStaff' },
    testType: { type: String, required: true },
    status: { type: String, enum: ['pending', 'assigned', 'completed', 'reported'], default: 'pending' },
    requestDate: { type: Date, default: Date.now },
    result: { type: String },
    reportDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

const LabTestRequest = mongoose.model('LabTestRequest', labTestRequestSchema);
export default LabTestRequest;