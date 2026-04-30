import xlsx from "xlsx";
import { Result } from "../models/Result.js";
import { Student } from "../models/Student.js";

// ✅ GET /api/admin/results/stats
export const getResultsStats = async (req, res) => {
  try {
    const totalResults = await Result.countDocuments();
    const releasedCount = await Result.countDocuments({ released: true });
    const pendingRelease = await Result.countDocuments({ released: false });
    
    // Optional: Get stats by subject
    const subjectsWithResults = await Result.aggregate([
      {
        $group: {
          _id: '$subjectId',
          count: { $sum: 1 },
          released: { $sum: { $cond: ['$released', 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalResults,
        releasedCount,
        pendingRelease,
        subjectsWithResults: subjectsWithResults.length
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
};
// ===============================
// ADD SINGLE RESULT (MANUAL)
// ===============================
export const addResult = async (req, res) => {
  try {
    const { studentId, subjectId, moduleId, score, maxScore } = req.body;

    const percentage = (score / maxScore) * 100;

    const result = await Result.create({
      studentId,
      subjectId,
      moduleId,
      score,
      maxScore,
      percentage,
      uploadedBy: req.user.id,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: "Add result failed" });
  }
};

// ===============================
// UPLOAD EXCEL RESULTS
// ===============================
export const uploadResults = async (req, res) => {
  try {
    
    const file = req.file;
    const { subjectId, moduleId, maxScore } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const inserted = [];

    for (const row of rows) {
      // Excel format: studentId | score

      const student = await Student.findOne({
        studentId: row.studentId,
      });

      if (!student) continue;

      const percentage = (row.score / maxScore) * 100;

      const result = await Result.create({
        studentId: student._id,
        subjectId,
        moduleId,
        score: row.score,
        maxScore,
        percentage,
        uploadedBy: req.user.id,
      });

      inserted.push(result);
    }

    res.json({
      message: "Excel uploaded successfully",
      count: inserted.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// ==========================
// 🟢 BULK CREATE RESULTS
// ==========================
export const bulkCreateResults = async (req, res) => {
  try {
    const results = req.body.results;

    const prepared = results.map((r) => ({
      ...r,
      percentage: (r.score / r.maxScore) * 100,
      uploadedBy: req.user.id,
    }));

    const inserted = await Result.insertMany(prepared);

    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Bulk insert failed" });
  }
};


// ==========================
// 🟢 UPDATE RESULT
// ==========================
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, maxScore } = req.body;

    const percentage = (score / maxScore) * 100;

    const updated = await Result.findByIdAndUpdate(
      id,
      { score, maxScore, percentage },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// ==========================
// 🟢 DELETE RESULT
// ==========================
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    await Result.findByIdAndDelete(id);

    res.json({ message: "Result deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// ===============================
// GET RESULTS BY SUBJECT
// ===============================
export const getResultsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const results = await Result.find({ subjectId })
      .populate("studentId", "name studentId")

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ===============================
// GET STUDENT RESULTS
// ===============================
export const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const results = await Result.find({ studentId })
      .populate("subjectId", "name weight moduleId");

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};

// ===============================
// RELEASE RESULTS
// ===============================
export const releaseResults = async (req, res) => {
  try {
    const { moduleId } = req.params;

    await Result.updateMany(
      { moduleId },
      { released: true }
    );

    res.json({ message: "Results released" });
  } catch (err) {
    res.status(500).json({ message: "Release failed" });
  }
};