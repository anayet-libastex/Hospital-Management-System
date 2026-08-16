import mongoose from 'mongoose';

const labTestRequestSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    labStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabStaff',
      // can be null until assigned by admin
    },
    testType: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'completed', 'reported'],
      default: 'pending',
    },
    requestDate: { type: Date, default: Date.now },
    result: { type: String, trim: true }, // or file URL
    reportDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

labTestRequestSchema.index({ doctorId: 1, patientId: 1 });

const LabTestRequest = mongoose.model('LabTestRequest', labTestRequestSchema);

export default LabTestRequest;