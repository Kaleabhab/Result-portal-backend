import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    yearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Year",
      required: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

semesterSchema.index({ name: 1, yearId: 1 }, { unique: true });

export default mongoose.model("Semester", semesterSchema);