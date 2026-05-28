import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },

    // student raw score
    score: {
      type: Number,
      required: true,
    },

    // exam total
    maxScore: {
      type: Number,
      required: true,
    },

    // Histology = 10%
    subjectWeight: {
      type: Number,
      required: true,
    },

    // actual earned module %
    // example = 8%
    contributionToModule: {
      type: Number,
      required: true,
    },

    grade: {
      type: String,
      default: null,
    },

    released: {
      type: Boolean,
      default: false,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

resultSchema.index(
  {
    studentId: 1,
    subjectId: 1,
    moduleId: 1,
  },
  {
    unique: true,
  }
);

export const Result = mongoose.model(
  "Result",
  resultSchema
);