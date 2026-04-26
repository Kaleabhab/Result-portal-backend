import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
});

export default mongoose.model("Module", moduleSchema);