import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
  weight: { type: Number, required: true }, // percentage
});

export default mongoose.model("Subject", subjectSchema);