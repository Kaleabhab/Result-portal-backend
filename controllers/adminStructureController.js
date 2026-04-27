import Year from "../models/Year.js";
import Semester from "../models/Semester.js";
import Module from "../models/Module.js";
import Subject from "../models/Subject.js";


export const createYear = async (req, res) => {
  try {
    const { name, order } = req.body;

    const year = await Year.create({
      name,   // "PC1", "C2", etc.
      order,  // optional sorting
    });

    res.json(year);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createSemester = async (req, res) => {
  try {
    const semester = await Semester.create(req.body);
    res.status(201).json(semester);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const createModule = async (req, res) => {
  try {
    const module = await Module.create(req.body);
    res.status(201).json(module);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

export const getStructure = async (req, res) => {
  try {
    const years = await Year.find();

    const data = await Promise.all(
      years.map(async (year) => {
        const semesters = await Semester.find({ yearId: year._id });

        const semData = await Promise.all(
          semesters.map(async (sem) => {
            const modules = await Module.find({ semesterId: sem._id });

            const modData = await Promise.all(
              modules.map(async (mod) => {
                const subjects = await Subject.find({ moduleId: mod._id });

                return {
                  ...mod._doc,
                  subjects,
                };
              })
            );

            return {
              ...sem._doc,
              modules: modData,
            };
          })
        );

        return {
          ...year._doc,
          semesters: semData,
        };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
};