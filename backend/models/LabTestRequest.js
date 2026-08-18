// models/LabTestRequest.js
import mongoose from 'mongoose';

const labTestRequestSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'patient', required: true },
    labStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'labstaff' },
    testTypes: { type: [String], default: [] }, // একাধিক টেস্টের নাম
    testType: { type: String }, // ব্যাকওয়ার্ড কম্প্যাটিবিলিটি
    status: {
      type: String,
      enum: ['pending', 'assigned', 'completed', 'reported'],
      default: 'pending',
    },
    // ✅ প্রতিটি টেস্টের জন্য আলাদা ফলাফল
    testResults: [
      {
        testName: { type: String, required: true },
        result: { type: String },
      },
    ],
    // পুরোনো result ফিল্ড (ব্যাকওয়ার্ড কম্প্যাটিবিলিটি)
    result: { type: String },
    requestDate: { type: Date, default: Date.now },
    reportDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

const LabTestRequest = mongoose.model('LabTestRequest', labTestRequestSchema);
export default LabTestRequest;