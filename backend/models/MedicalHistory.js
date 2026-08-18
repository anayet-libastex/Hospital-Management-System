import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    diagnosis: { type: String, trim: true },
    treatment: { type: String, trim: true },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'doctor',
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    attachments: [{ type: String }], // URLs to files
  },
  { _id: false }
);

const medicalHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'patient',
      required: true,
      unique: true, // one-to-one with Patient
    },
    records: [recordSchema],
  },
  { timestamps: true }
);

const MedicalHistory = mongoose.model('MedicalHistory', medicalHistorySchema);

export default MedicalHistory;