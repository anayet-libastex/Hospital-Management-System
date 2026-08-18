import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    medicines: [
      {
        name: { type: String, required: true },
        dosage: { type: String },
        duration: { type: String },
        instructions: { type: String },
        // 👇 নতুন ফিল্ড
        times: {
          type: [String],
          enum: ["Morning", "Afternoon", "Night"],
          default: [],
        },
        mealRelation: {
          type: String,
          enum: ["before meal", "after meal", "with meal", "empty stomach"],
          default: "before meal",
        },
      },
    ],
    diagnosis: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
