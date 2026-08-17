import './models/User.js';
import './models/Doctor.js';   
import './models/Patient.js';
import './models/LabStaff.js';
import './models/Department.js';
import './models/Appointment.js';
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commonRoutes from "./routes/commonRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import labStaffRoutes from "./routes/labStaffRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
dotenv.config({ quiet: true });

const app = express();

// Middleware (if any) – you can add express.json() etc. here
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/labstaff", labStaffRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api", commonRoutes); // or '/api/common' if you prefer

const PORT = process.env.PORT || 5000;

// Start server and connect to DB
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
