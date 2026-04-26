import Result from "../models/Result.js";
import Subject from "../models/Subject.js";
export const calculateModuleResult = async (req, res) => {
  try {
    const { studentId, moduleId } = req.params;

    // 1. GET ALL RESULTS
    const results = await Result.find({ studentId, moduleId });

    if (!results.length) {
      return res.status(404).json({ message: "No results found" });
    }

    let total = 0;

    // 2. LOOP RESULTS
    for (const r of results) {
      const subject = await Subject.findById(r.subjectId);

      if (!subject) continue;

      // weighted score
      const scorePercent = (r.score / r.maxScore) * 100;
      const weighted = (scorePercent * subject.weightPercentage) / 100;

      total += weighted;
    }

    res.json({
      studentId,
      moduleId,
      moduleScore: total.toFixed(2),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Calculation error" });
  }
};
export const calculateSemesterGPA = async (req, res) => {
  try {
    const { studentId, semesterId } = req.params;

    const results = await Result.find({ studentId }).populate("subjectId");

    let moduleMap = {};

    // group by module
    for (const r of results) {
      const moduleId = r.moduleId;

      if (!moduleMap[moduleId]) {
        moduleMap[moduleId] = 0;
      }

      const subject = r.subjectId;

      const scorePercent = (r.score / r.maxScore) * 100;
      const weighted = (scorePercent * subject.weightPercentage) / 100;

      moduleMap[moduleId] += weighted;
    }

    // GPA conversion
    let total = 0;
    let count = 0;

    for (const m of Object.values(moduleMap)) {
      total += m;
      count++;
    }

    const gpa = total / count;

    res.json({
      studentId,
      semesterId,
      gpa: gpa.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: "GPA error" });
  }
};