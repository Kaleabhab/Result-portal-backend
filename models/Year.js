import mongoose from "mongoose";

const yearSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 1 },
});

export default mongoose.model("Year", yearSchema);