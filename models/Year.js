import mongoose from "mongoose";

const yearSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  // optional but VERY useful for sorting
  order: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Year", yearSchema);