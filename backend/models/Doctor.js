import mongoose from 'mongoose';
import User from './User.js';

const doctorSchema = new mongoose.Schema(
  {
    specialization: { type: String, required: true, trim: true },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    schedule: {
      // flexible schedule; can be expanded later
      days: { type: [String]}, // e.g. ['Monday','Wednesday']
      startTime: { type: String }, // '09:00'
      endTime: { type: String },   // '17:00'
    },
    qualification: { type: String, trim: true },
  },
  { timestamps: true }
);

const Doctor = User.discriminator('doctor', doctorSchema);

export default Doctor;