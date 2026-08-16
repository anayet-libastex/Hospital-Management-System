import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['bkash', 'rocket', 'nogod', 'cash'],
      required: true,
    },
    transactionId: { type: String, trim: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ patientId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;