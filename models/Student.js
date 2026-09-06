import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
    },

    displayName: {
      type: String,
      required: true,
    },

    email: String,

    classId: String,

    // OPTIONAL ONLY (current tracking, not academic source of truth)
    currentYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Year",
    },

    uid: String,
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);