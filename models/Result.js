import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  studentId: String,
  subjectId: String,
  moduleId: String,
  score: Number,
  released: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

export const Result = mongoose.model("Result", resultSchema);