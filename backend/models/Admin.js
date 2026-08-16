import mongoose from 'mongoose';
import User from './User.js';

const adminSchema = new mongoose.Schema(
  {
    // Admin has no extra fields beyond the base User
  },
  { timestamps: true }
);

const Admin = User.discriminator('admin', adminSchema);

export default Admin;