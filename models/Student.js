import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: String,
  classId: String,
  uid: String, // optional (if linked with user login)
});

export const Student = mongoose.model("Student", studentSchema);
