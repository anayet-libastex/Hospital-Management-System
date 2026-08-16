import mongoose from 'mongoose';
import User from './User.js';

const labStaffSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    qualification: { type: String, trim: true },
  },
  { timestamps: true }
);

const LabStaff = User.discriminator('labstaff', labStaffSchema);

export default LabStaff;