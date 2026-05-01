import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
  },
  yearId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Year",
    required: true,
  },
  order: { 
    type: Number, 
    default: 0,
  },
});

export default mongoose.model("Semester", semesterSchema);