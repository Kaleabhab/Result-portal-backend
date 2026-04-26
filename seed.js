import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { User } from "./models/User.js";
import { Student } from "./models/Student.js";
import { Subject } from "./models/Subject.js";
import { Result } from "./models/Result.js";

dotenv.config();

// CONNECT DB
await mongoose.connect(process.env.MONGO_URI);
console.log("✅ MongoDB connected");

// =======================
// SAMPLE DATA
// =======================

// ADMIN
const admins = [
{
  email: "admin@school.com",
  password: await bcrypt.hash("Admin@123", 10),
  role: "admin",
  displayName: "Principal Office",
},

];

// STUDENT USER
const students = [
{
  email: "habtamu@school.com",
  password: await bcrypt.hash("Student@123", 10),
  role: "student",
  studentId: "UGPR169/16",
  name: "Habtamu Worku",
  classId: "class-2024-A",
},

];


// STUDENT PROFILE



// SUBJECTS
const subjects = [
  { name: "Exam", moduleId: "programming", weightPercentage: 60 },
  { name: "Lab", moduleId: "programming", weightPercentage: 40 },
];

// RESULTS
const results = [
  {
    studentId: "UGPR169/16",
    subjectId: "Exam",
    moduleId: "programming",
    score: 80,
    released: true,
  },
  {
    studentId: "UGPR169/16",
    subjectId: "Lab",
    moduleId: "programming",
    score: 90,
    released: true,
  },
];

// =======================
// SEED FUNCTION
// =======================

const seed = async () => {
  try {
    console.log("🔥 Seeding started...");

    // CLEAR OLD DATA (optional)
    await User.deleteMany();
    await Student.deleteMany();
    await Subject.deleteMany();
    await Result.deleteMany();

    // CREATE ADMIN
    for (const adminDataItem of admins) {
      await User.create(adminDataItem);
    }
    console.log("✅ Admin(s) created");


    
    // =========================
    // 2. CREATE STUDENTS (USER + PROFILE TOGETHER)
    // =========================
    for (const s of students) {
      // create user
      const user = await User.create({
        email: s.email,
        password: s.password,
        role: s.role,
        studentId: s.studentId,
        name: s.name,
        classId: s.classId,
      });

      // create student profile (linked)
      await Student.create({
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        classId: s.classId,
        userId: user._id, // 🔥 correct linking
      });
    }

    console.log("✅ Student created");

    // CREATE SUBJECTS
    await Subject.insertMany(subjects);
    console.log("✅ Subjects added");

    // CREATE RESULTS
    await Result.insertMany(results);
    console.log("✅ Results added");

    console.log("🎉 ALL DATA SEEDED");
    process.exit();

  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
};

seed();