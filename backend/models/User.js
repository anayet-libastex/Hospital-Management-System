import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true}, // not returned by default
    role: {
      type: String,
      enum: ['admin', 'doctor', 'labstaff', 'patient'],
      required: true,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    discriminatorKey: 'role', // key used to distinguish child models
  }
);

// Index for faster lookup
// userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;