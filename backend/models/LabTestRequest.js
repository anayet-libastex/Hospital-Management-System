import mongoose from 'mongoose';
import './Doctor.js'; // (ঐচ্ছিক) ডক্টর মডেল রেজিস্টার নিশ্চিত করতে

const labTestRequestSchema = new mongoose.Schema(
  {
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'doctor', // ✅ ছোট হাতের
      required: true 
    },
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'patient', // ✅ ছোট হাতের
      required: true 
    },
    labStaffId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'labstaff' // যদি LabStaff ডিসক্রিমিনেটর থাকে, তাহলে ছোট হাতের; নাহলে এই লাইন কমেন্ট করুন
    },
    testTypes: { type: [String], default: [] }, // নতুন অ্যারে ফিল্ড
    testType: { type: String }, // ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য রাখা
    status: { 
      type: String, 
      enum: ['pending', 'assigned', 'completed', 'reported'], 
      default: 'pending' 
    },
    requestDate: { type: Date, default: Date.now },
    result: { type: String },
    reportDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

const LabTestRequest = mongoose.model('LabTestRequest', labTestRequestSchema);
export default LabTestRequest;