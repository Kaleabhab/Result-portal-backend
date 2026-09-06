import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
    },

    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
      index: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    // GPA system
    credit: {
      type: Number,
      required: true,
      min: 1,
      default: 3,
    },

    // optional classification (useful later)
    type: {
      type: String,
      enum: ["core", "elective"],
      default: "core",
    },
  },
  { timestamps: true }
);

moduleSchema.index({ name: 1, semesterId: 1 }, { unique: true });

export default mongoose.model("Module", moduleSchema);