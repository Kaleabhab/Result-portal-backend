import xlsx from "xlsx";
import Result from "../models/Result.js";
//import { Result } from "../models/Result.js";
//import Student from "../models/Student.js";
import { Student } from "../models/Student.js";
import Subject from "../models/Subject.js";

export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("📥 File received:", req.file.path);

    // 1. READ EXCEL FILE
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 2. CONVERT TO JSON
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log("📊 Parsed rows:", rows);

    let inserted = 0;

    // 3. LOOP ROWS
    for (const row of rows) {
      const { studentId, score, subjectId, maxScore } = row;

      if (!studentId || !score) continue;

      // 4. VALIDATE STUDENT
      const student = await Student.findOne({ studentId });
      if (!student) continue;

      // 5. VALIDATE SUBJECT
      const subject = await Subject.findById(subjectId);
      if (!subject) continue;

      // 6. SAVE RESULT
      await Result.create({
        studentId,
        subjectId,
        score,
        maxScore: maxScore || 20,
        uploadedAt: Date.now(),
        released: false,
      });

      inserted++;
    }

    res.json({
      message: "Excel uploaded successfully",
      inserted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};