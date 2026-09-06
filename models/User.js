import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "student"],
      required: true,
    },

    displayName: String,

    studentId: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);