import mongoose from 'mongoose';
import User from './User.js';

const patientSchema = new mongoose.Schema(
  {
    dateOfBirth: { type: Date },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
    medicalHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalHistory',
    }, // will be populated later
  },
  { timestamps: true }
);

const Patient = User.discriminator('patient', patientSchema);

export default Patient;