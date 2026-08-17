import mongoose from "mongoose";
import "./Doctor.js"; // ✅ Doctor মডেল রেজিস্টার (discriminator নিবন্ধনের জন্য)

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    headDoctor: {
      // ✅ সঠিক স্ট্রাকচার – নেস্টেড নয়
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 'Doctor' এর বদলে 'User' – যেহেতু Doctor একটি ডিসক্রিমিনেটর
      default: null,
    },
  },
  { timestamps: true },
);


const Department = mongoose.model("Department", departmentSchema);

export default Department;