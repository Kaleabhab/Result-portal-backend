import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
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
  moduleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Module",
    required: true,
    index:true,
  },
  

  weight: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
  }, // percentage

  order: {
    type: Number,
    default: 0,
  },
},
{
  timestamps: true,
}
);

subjectSchema.index({name:1, moduleId:1}, {unique: true});

export default mongoose.model("Subject", subjectSchema);