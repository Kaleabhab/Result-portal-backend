import { Result } from "../models/Result.js";
import { getGradePoint, getLetterGrade } from "../utils/gpaCalculator.js";

export const calculateModuleResult = async (req, res) => {
  try {
    const { studentId, moduleId } = req.params;

    const results = await Result.find({
      studentId,
      moduleId,
    }).populate("subjectId");

    if (!results.length) {
      return res.json({
        modulePercent: 0,
        gpa: 0,
        grade: "F",
      });
    }

    let totalWeighted = 0;
    let totalWeight = 0;

    const breakdown = [];

    for (const r of results) {
      const subject = r.subjectId;
      if (!subject) continue;

      const percent = (r.score / r.maxScore) * 100;
      const weight = subject.weightPercentage || 0;

      const contribution = (percent * weight) / 100;

      totalWeighted += contribution;
      totalWeight += weight;

      breakdown.push({
        subject: subject.name,
        percent,
        weight,
        contribution,
      });
    }

    const modulePercent = totalWeighted;

    const gpa = getGradePoint(modulePercent);
    const grade = getLetterGrade(modulePercent);

    res.json({
      studentId,
      moduleId,
      modulePercent: modulePercent.toFixed(2),
      gpa,
      grade,
      breakdown,
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

    const moduleMap = {};

    // 🔹 GROUP BY MODULE
    for (const r of results) {
      const moduleId = r.moduleId?.toString();
      if (!moduleId) continue;

      if (!moduleMap[moduleId]) {
        moduleMap[moduleId] = {
          totalWeighted: 0,
          totalWeight: 0,
        };
      }

      const subject = r.subjectId;
      if (!subject) continue;

      const percent = (r.score / r.maxScore) * 100;
      const weight = subject.weightPercentage || 0;

      const contribution = (percent * weight) / 100;

      moduleMap[moduleId].totalWeighted += contribution;
      moduleMap[moduleId].totalWeight += weight;
    }

    // 🔹 CONVERT EACH MODULE → GPA
    let totalGpa = 0;
    let moduleCount = 0;

    const modules = [];

    for (const [moduleId, data] of Object.entries(moduleMap)) {
      const modulePercent = data.totalWeighted;

      const moduleGpa = getGradePoint(modulePercent);

      totalGpa += moduleGpa;
      moduleCount++;

      modules.push({
        moduleId,
        modulePercent: modulePercent.toFixed(2),
        moduleGpa,
      });
    }

    const semesterGpa = moduleCount ? totalGpa / moduleCount : 0;

    res.json({
      studentId,
      semesterId,
      semesterGpa: semesterGpa.toFixed(2),
      modules,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "GPA error" });
  }
};