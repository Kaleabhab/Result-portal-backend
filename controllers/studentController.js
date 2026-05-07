import { Student } from "../models/Student.js";
import Year from "../models/Year.js";
import Semester from "../models/Semester.js";
import Module from "../models/Module.js";
import Subject from "../models/Subject.js";


// CREATE
export const createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getStudentStructure = async (req, res) => {
  try {
    console.log("✅ STRUCTURE API HIT");

    const years = await Year.find().lean();

    for (let year of years) {
      const semesters = await Semester.find({ yearId: year._id }).lean();

      for (let semester of semesters) {
        const modules = await Module.find({ semesterId: semester._id }).lean();

        for (let module of modules) {
          const subjects = await Subject.find({ moduleId: module._id }).lean();
          module.subjects = subjects;
        }

        semester.modules = modules;
      }

      year.semesters = semesters;
    }

    res.json({ years });

  } catch (err) {
    console.error("❌ STRUCTURE ERROR:", err);   // 👈 IMPORTANT
    res.status(500).json({ message: err.message });
  }
};