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
export const addResult = async (
  req,
  res
) => {
  try {
    const {
      studentId,
      subjectId,
      moduleId,
      score,
      maxScore,
    } = req.body;

    // ======================
    // Validation
    // ======================

    if (
      !studentId ||
      !subjectId ||
      !moduleId
    ) {
      return res.status(400).json({
        message:
          "Student, subject and module are required",
      });
    }

    if (
      score == null ||
      maxScore == null
    ) {
      return res.status(400).json({
        message:
          "Score and maxScore are required",
      });
    }

    if (
      Number(maxScore) <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid maxScore",
      });
    }

    // ======================
    // Find subject
    // ======================

    const subject =
      await Subject.findById(
        subjectId
      );

    if (!subject) {
      return res.status(404).json({
        message:
          "Subject not found",
      });
    }

    const subjectWeight =
      subject.weight;

    // ======================
    // Calculate contribution
    // ======================

    const examPercentage =
      (Number(score) /
        Number(maxScore)) *
      100;

    const contributionToModule =
      (examPercentage *
        subjectWeight) /
      100;

    // ======================
    // Create or update
    // ======================

    const result =
      await Result.findOneAndUpdate(
        {
          studentId,
          subjectId,
          moduleId,
        },
        {
          studentId,
          subjectId,
          moduleId,

          score:
            Number(score),

          maxScore:
            Number(maxScore),

          subjectWeight,

          contributionToModule,

          uploadedBy:
            req.user.id,
        },
        {
          new: true,
          upsert: true,
        }
      );

    res.status(201).json({
      message:
        "Result saved successfully",
      result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        "Add result failed",
      error: err.message,
    });
  }
};

// ===============================
// UPLOAD EXCEL RESULTS
// ===============================
export const uploadResults = async (req, res) => {
  try {
    const file = req.file;

    const {
      subjectId,
      moduleId,
      maxScore,
    } = req.body;

    // ==========================
    // Validation
    // ==========================

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    if (!subjectId || !moduleId) {
      return res.status(400).json({
        message:
          "Subject and module are required",
      });
    }

    if (!maxScore || Number(maxScore) <= 0) {
      return res.status(400).json({
        message: "Invalid maxScore",
      });
    }

    // ==========================
    // Find selected subject
    // ==========================

    const subject = await Subject.findById(
      subjectId
    );

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    // Example:
    // Histology = 10%
    const subjectWeight =
      subject.weight;

    // ==========================
    // Read Excel File
    // ==========================

    const workbook = xlsx.read(
      file.buffer,
      {
        type: "buffer",
      }
    );

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      xlsx.utils.sheet_to_json(sheet);

    // ==========================
    // Extract student IDs
    // ==========================

    const studentIds = rows.map(
      (row) =>
        row.studentId ||
        row["Student ID"]
    );

    // ==========================
    // Fetch all students once
    // ==========================

    const students =
      await Student.find({
        studentId: {
          $in: studentIds,
        },
      });

    // Fast lookup map
    const studentMap = new Map(
      students.map((student) => [
        student.studentId,
        student._id,
      ])
    );

    const prepared = [];

    // ==========================
    // Prepare results
    // ==========================

    for (const row of rows) {
      const studentIdRaw =
        row.studentId ||
        row["Student ID"];

      const score = Number(
        row.score ||
          row["Score"] ||
          row["Marks"]
      );

      const studentObjectId =
        studentMap.get(studentIdRaw);

      // skip invalid student
      if (!studentObjectId) {
        continue;
      }

      // skip invalid score
      if (isNaN(score)) {
        continue;
      }

      // ==========================
      // Calculate contribution
      // ==========================

      // example:
      // 12/15 × 100 = 80
      const examPercentage =
        (score / Number(maxScore)) *
        100;

      // 80 × 10 /100 = 8
      const contributionToModule =
        (examPercentage *
          subjectWeight) /
        100;

      prepared.push({
        studentId:
          studentObjectId,

        subjectId,

        moduleId,

        score,

        maxScore:
          Number(maxScore),

        subjectWeight,

        contributionToModule,

        uploadedBy:
          req.user.id,
      });
    }

    // ==========================
    // Insert results
    // ==========================

    const inserted =
      await Result.insertMany(
        prepared,
        {
          ordered: false,
        }
      );

    res.status(200).json({
      message:
        "Results uploaded successfully",

      count: inserted.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Upload failed",
      error: err.message,
    });
  }
};

export const releaseResults =
  async (req, res) => {
    try {
      const { moduleId } =
        req.params;

      const module =
        await Module.findById(
          moduleId
        );

      if (!module) {
        return res
          .status(404)
          .json({
            message:
              "Module not found",
          });
      }

      const updated =
        await Result.updateMany(
          { moduleId },
          {
            released: true,
          }
        );

      res.json({
        success: true,

        message:
          "Results released successfully",

        moduleId,

        released: true,

        modifiedCount:
          updated.modifiedCount,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Release failed",

        error:
          err.message,
      });
    }
  };

  export const unreleaseResults =
  async (req, res) => {
    try {
      const { moduleId } =
        req.params;

      const module =
        await Module.findById(
          moduleId
        );

      if (!module) {
        return res
          .status(404)
          .json({
            message:
              "Module not found",
          });
      }

      const updated =
        await Result.updateMany(
          { moduleId },
          {
            released: false,
          }
        );

      res.json({
        success: true,

        message:
          "Results hidden successfully",

        moduleId,

        released: false,

        modifiedCount:
          updated.modifiedCount,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Unrelease failed",

        error:
          err.message,
      });
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


export const getStudentResults =
  async (req, res) => {
    try {
      const { studentId } =
        req.params;

      // =====================
      // Grade Mapping
      // =====================

      const getGrade = (
        percentage
      ) => {
        if (percentage >= 90)
          return "A+";

        if (percentage >= 85)
          return "A";

        if (percentage >= 80)
          return "A-";

        if (percentage >= 75)
          return "B+";

        if (percentage >= 70)
          return "B";

        if (percentage >= 65)
          return "B-";

        if (percentage >= 60)
          return "C+";

        if (percentage >= 50)
          return "C";

        return "F";
      };

      // =====================
      // Fetch released results
      // =====================

      const results =
        await Result.find({
          studentId,
          released: true,
        })
          .populate(
            "subjectId",
            "name weight"
          )
          .populate({
            path: "moduleId",
            select:
              "name semesterId",
            populate: {
              path:
                "semesterId",
              select:
                "name order yearId",
              populate: {
                path:
                  "yearId",
                select:
                  "name order",
              },
            },
          });

      // =====================
      // Empty result check
      // =====================

      if (!results.length) {
        return res.json({
          studentId,
          cgpa: 0,
          years: [],
        });
      }

      // =====================
      // Build hierarchy
      // =====================

      const yearsMap =
        new Map();

      for (const result of results) {
        if (
          !result.moduleId ||
          !result.subjectId
        )
          continue;

        const module =
          result.moduleId;

        const semester =
          module.semesterId;

        if (!semester)
          continue;

        const year =
          semester.yearId;

        if (!year)
          continue;

        const yearKey =
          year._id.toString();

        const semesterKey =
          semester._id.toString();

        const moduleKey =
          module._id.toString();

        // =====================
        // Create year
        // =====================

        if (
          !yearsMap.has(
            yearKey
          )
        ) {
          yearsMap.set(
            yearKey,
            {
              yearId:
                year._id,

              yearName:
                year.name,

              order:
                year.order || 0,

              cgpa: 0,

              semesters: [],
            }
          );
        }

        const yearObj =
          yearsMap.get(
            yearKey
          );

        // =====================
        // Create semester
        // =====================

        let semesterObj =
          yearObj.semesters.find(
            (s) =>
              s.semesterId.toString() ===
              semesterKey
          );

        if (!semesterObj) {
          semesterObj = {
            semesterId:
              semester._id,

            semesterName:
              semester.name,

            order:
              semester.order ||
              0,

            gpa: 0,

            modules: [],
          };

          yearObj.semesters.push(
            semesterObj
          );
        }

        // =====================
        // Create module
        // =====================

        let moduleObj =
          semesterObj.modules.find(
            (m) =>
              m.moduleId.toString() ===
              moduleKey
          );

        if (!moduleObj) {
          moduleObj = {
            moduleId:
              module._id,

            moduleName:
              module.name,

            percentage: 0,

            grade: null,

            subjects: [],
          };

          semesterObj.modules.push(
            moduleObj
          );
        }

        // =====================
        // Add subject
        // =====================

        moduleObj.subjects.push(
          {
            subjectId:
              result.subjectId
                ._id,

            subjectName:
              result.subjectId
                .name,

            score:
              result.score,

            maxScore:
              result.maxScore,
          }
        );

        // =====================
        // Add contribution
        // =====================

        moduleObj.percentage +=
          Number(
            result.contributionToModule ||
              0
          );
      }

      // =====================
      // Final processing
      // =====================

      const years =
        Array.from(
          yearsMap.values()
        );

      for (const year of years) {
        // sort semesters
        year.semesters.sort(
          (a, b) =>
            a.order - b.order
        );

        for (const semester of year.semesters) {
          for (const module of semester.modules) {
            // round %
            module.percentage =
              Number(
                module.percentage.toFixed(
                  2
                )
              );

            // calculate grade
            module.grade =
              getGrade(
                module.percentage
              );

            // sort subjects
            module.subjects.sort(
              (a, b) =>
                a.subjectName.localeCompare(
                  b.subjectName
                )
            );
          }

          // TODO:
          // semester GPA
          semester.gpa = 0;
        }

        // TODO:
        // year CGPA
        year.cgpa = 0;
      }

      // sort years
      years.sort(
        (a, b) =>
          a.order - b.order
      );

      // TODO:
      // overall CGPA
      const cgpa = 0;

      // =====================
      // Response
      // =====================

      res.json({
        studentId,
        cgpa,
        years,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch student results",
        error:
          err.message,
      });
    }
  };

  export const getReleaseStatus =
  async (req, res) => {
    try {
      const modules =
        await Module.find()
          .populate({
            path:
              "semesterId",
            select:
              "name yearId",
            populate: {
              path:
                "yearId",
              select:
                "name",
            },
          });

      const data =
        await Promise.all(
          modules.map(
            async (module) => {
              const result =
                await Result.findOne(
                  {
                    moduleId:
                      module._id,
                  }
                );

              return {
                moduleId:
                  module._id,

                moduleName:
                  module.name,

                semester:
                  module
                    .semesterId
                    ?.name,

                year:
                  module
                    .semesterId
                    ?.yearId
                    ?.name,

                released:
                  result
                    ?.released ||
                  false,
              };
            }
          )
        );

      res.json(data);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          "Failed to fetch release status",

        error:
          err.message,
      });
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
    const studentId = req.params.studentId;

    console.log("PARAM:", studentId);

    const results = await Result.find({ studentId });

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
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