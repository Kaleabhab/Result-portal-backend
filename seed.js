console.log("🔥 Seed script started...");

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

//import User from "./models/User.js";
import { User } from "./models/User.js";
//import Student from "./models/Student.js";
import { Student } from "./models/Student.js";

dotenv.config();

// =======================
// DB CONNECT
// =======================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

// =======================
// SAMPLE DATA
// =======================

// 👨‍💼 ADMINS
const admins = [
  {
    email: "Kaleab.AM16@hu.edu.et",
    password: "Kb@1452",
    displayName: "IT ADMIN",
  },
  {
    email: "Representative.AM16@hu.edu.com",
    password: "Registrar@123",
    displayName: "Representative",
  },
];

// 🎓 STUDENTS
const students = [
  {
    email: "Kaleab.SM16-1693@hu.edu.et",
    password: "Kb@1452",
    studentId: "UGPR1693/16",
    displayName: "Kaleab Habtamu WYohannes",
    classId: "class-2016-med",
  },
  {
    email: "Girum.SM16-1420@hu.edu.et",
    password: "Student@123",
    studentId: "UGPR1420/16",
    displayName: "Girum Gulilat Guja",
    classId: "class-2016-med",
  },
];

// =======================
// SEED FUNCTION
// =======================
const seed = async () => {
  try {
    console.log("🧹 Clearing old data...");

    await User.deleteMany();
    await Student.deleteMany();

    console.log("🔥 Seeding admins...");

    // =======================
    // CREATE ADMINS
    // =======================
    for (const a of admins) {
      const hashed = await bcrypt.hash(a.password, 10);

      await User.create({
        email: a.email,
        password: hashed,
        role: "admin",
        displayName: a.displayName,
      });
    }

    console.log("👨‍💼 Admins created");

    // =======================
    // CREATE STUDENTS
    // =======================
    console.log("🎓 Seeding students...");

    for (const s of students) {
      const year = await Year.findOne();
      const hashed = await bcrypt.hash(s.password, 10);

      // 1. Create user
      const user = await User.create({
        email: s.email,
        password: hashed,
        role: "student",
        displayName: s.displayName,
        studentId: s.studentId,
        classId: s.classId,
         yearId: year._id,  // ✅ ADD THIS
      });

      // 2. Create student profile
      await Student.create({
        userId: user._id,
        studentId: s.studentId,
        displayName: s.displayName,
        email: s.email,
        classId: s.classId,
      });
    }

    console.log("🎓 Students created");

    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY");

    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

// =======================
// RUN
// =======================
connectDB().then(seed);