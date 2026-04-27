import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "student" }, // admin | student
  displayName: String,
  studentId: String,
});

export const User = mongoose.model("User", userSchema);
