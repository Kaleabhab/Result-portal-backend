import Year from "../models/Year.js";
import Semester from "../models/Semester.js";
import Module from "../models/Module.js";
import Subject from "../models/Subject.js";


// =======================
// YEAR CRUD
// =======================
export const createYear = async (req, res) => {
  try {
    const { name, order } = req.body;

    const exists = await Year.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Year already exists" });
    }

    const year = await Year.create({ name, order });
    res.status(201).json(year);
  } catch (err) {
    res.status(500).json({ message: "Create year failed" });
  }
};

export const updateYear = async (req, res) => {
  try {
    const year = await Year.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(year);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteYear = async (req, res) => {
  try {
    const yearId = req.params.id;

    const semesters = await Semester.find({ yearId });

    for (let sem of semesters) {
      const modules = await Module.find({ semesterId: sem._id });

      for (let mod of modules) {
        await Subject.deleteMany({ moduleId: mod._id });
      }

      await Module.deleteMany({ semesterId: sem._id });
    }

    await Semester.deleteMany({ yearId });
    await Year.findByIdAndDelete(yearId);

    res.json({ message: "Year and all nested data deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};


// =======================
// SEMESTER CRUD
// =======================
export const createSemester = async (req, res) => {
  try {
    const semester = await Semester.create(req.body);
    res.status(201).json(semester);
  } catch (err) {
    res.status(500).json({ message: "Create semester failed" });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(semester);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const semesterId = req.params.id;

    const modules = await Module.find({ semesterId });

    for (let mod of modules) {
      await Subject.deleteMany({ moduleId: mod._id });
    }

    await Module.deleteMany({ semesterId });
    await Semester.findByIdAndDelete(semesterId);

    res.json({ message: "Semester deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};


// =======================
// MODULE CRUD
// =======================
export const createModule = async (req, res) => {
  try {
    const module = await Module.create(req.body);
    res.status(201).json(module);
  } catch {
    res.status(500).json({ message: "Create module failed" });
  }
};

export const updateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(module);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteModule = async (req, res) => {
  try {
    const moduleId = req.params.id;

    await Subject.deleteMany({ moduleId });
    await Module.findByIdAndDelete(moduleId);

    res.json({ message: "Module deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// =======================
// SUBJECT CRUD
// =======================
export const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch {
    res.status(500).json({ message: "Create subject failed" });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(subject);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

export const getStructure = async (req, res) => {
  try {
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

    res.json(years);
   } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch structure" });
  }
};