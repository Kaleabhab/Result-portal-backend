import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: String,
  classId: String,
  uid: String, // optional (if linked with user login)
});

export const Student = mongoose.model("Student", studentSchema);