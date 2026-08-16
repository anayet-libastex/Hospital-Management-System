import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['patient', 'doctor', 'staff', 'department', 'financial'],
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // admin or doctor etc.
      required: true,
    },
    data: { type: mongoose.Schema.Types.Mixed }, // can store aggregated stats or JSON
    fileUrl: { type: String }, // if report is exported as PDF
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;