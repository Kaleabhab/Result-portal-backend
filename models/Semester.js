import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  yearId: { type: mongoose.Schema.Types.ObjectId, ref: "Year" },
  order: { type: Number, default: 1 },
});

export default mongoose.model("Semester", semesterSchema);