import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
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
  
  // (Recommended for GPA weighting)
  credit: {
    type: Number,
    required: true,
    min: 1,
    default: 10,
  },
},
{
  timestamps: true,
}

);

export default mongoose.model("Module", moduleSchema);