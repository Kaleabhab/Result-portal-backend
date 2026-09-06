import xlsx from "xlsx";

//import Result from "../models/Result.js";
//import Student from "../models/Student.js";
import { Result } from "../models/Result.js";
import { Student } from "../models/Student.js";
import Subject from "../models/Subject.js";
import Module from "../models/Module.js";
import { getGrade, getStatus, getGradeDetails } from "../utils/gradeSystem.js";


// ===============================
// STATS DASHBOARD
// ===============================
export const getResultsStats = async (req, res) => {
  try {
    const total = await Result.countDocuments();
    const released = await Result.countDocuments({ released: true });
    const pending = await Result.countDocuments({ released: false });

    res.json({
      totalResults: total,
      releasedResults: released,
      pendingResults: pending,
    });
  } catch (err) {
    res.status(500).json({ message: "Stats failed", error: err.message });
  }
};


// ===============================
// ADD / UPDATE SINGLE RESULT
// (Manual fix for missing result)
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

    // ==========================
    // Validate required fields
    // ==========================

    if (
      !studentId ||
      !subjectId ||
      !moduleId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "studentId, subjectId and moduleId are required",
      });
    }

    const scoreNum =
      Number(score);

    const maxScoreNum =
      Number(maxScore);

    if (
      isNaN(scoreNum)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid score",
      });
    }

    if (
      isNaN(maxScoreNum) ||
      maxScoreNum <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid maxScore",
      });
    }

    if (
      scoreNum < 0 ||
      scoreNum >
        maxScoreNum
    ) {
      return res.status(400).json({
        success: false,
        message: `Score must be between 0 and ${maxScoreNum}`,
      });
    }

    // ==========================
    // Check student
    // ==========================

    const student =
      await Student.findById(
        studentId
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student not found",
      });
    }

    // ==========================
    // Check subject
    // ==========================

    const subject =
      await Subject.findById(
        subjectId
      );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message:
          "Subject not found",
      });
    }

    // ==========================
    // Check module
    // ==========================

    const module =
      await Module.findById(
        moduleId
      );

    if (!module) {
      return res.status(404).json({
        success: false,
        message:
          "Module not found",
      });
    }

    // ==========================
    // Verify subject belongs
    // to module
    // ==========================

    if (
      subject.moduleId.toString() !==
      moduleId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject does not belong to this module",
      });
    }

    // ==========================
    // Calculate contribution
    // ==========================

    const examPercentage =
      (scoreNum /
        maxScoreNum) *
      100;

    const contributionToModule =
      (examPercentage *
        subject.weight) /
      100;

    // ==========================
    // Create OR update result
    // ==========================

    const existingResult =
      await Result.findOne({
        studentId,
        subjectId,
        moduleId,
      });

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
            scoreNum,

          maxScore:
            maxScoreNum,

          subjectWeight:
            subject.weight,

          contributionToModule,

          uploadedBy:
            req.user.id,

          ...(existingResult
            ? {}
            : {
                released:
                  false,
              }),
        },
        {
          new: true,
          upsert: true,
        }
      );

    res.status(
      existingResult
        ? 200
        : 201
    ).json({
      success: true,
      message:
        existingResult
          ? "Result updated successfully"
          : "Result added successfully",

      result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Failed to save result",
      error:
        err.message,
    });
  }
};


// ===============================
// UPLOAD EXCEL RESULTS
// ===============================
export const uploadResults =
  async (req, res) => {
    try {
      const file =
        req.file;

      const {
        subjectId,
        moduleId,
        maxScore,
      } = req.body;

      // ==========================
      // Validation
      // ==========================

      if (!file) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Excel file required",
          });
      }

      if (
        !subjectId ||
        !moduleId
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "subjectId and moduleId are required",
          });
      }

      const maxScoreNum =
        Number(
          maxScore
        );

      if (
        isNaN(
          maxScoreNum
        ) ||
        maxScoreNum <=
          0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Invalid maxScore",
          });
      }

      // ==========================
      // Validate subject
      // ==========================

      const subject =
        await Subject.findById(
          subjectId
        );

      if (!subject) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Subject not found",
          });
      }

      // ==========================
      // Validate module
      // ==========================

      const module =
        await Module.findById(
          moduleId
        );

      if (!module) {
        return res
          .status(404)
          .json({
            success:
              false,
            message:
              "Module not found",
          });
      }

      // Subject belongs
      // to module
      if (
        subject.moduleId.toString() !==
        moduleId
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Subject does not belong to this module",
          });
      }

      // ==========================
      // Read Excel
      // ==========================

      const workbook =
        xlsx.read(
          file.buffer,
          {
            type:
              "buffer",
          }
        );

      const sheet =
        workbook.Sheets[
          workbook
            .SheetNames[0]
        ];

      const rows =
        xlsx.utils.sheet_to_json(
          sheet
        );

      if (
        !rows.length
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Excel file is empty",
          });
      }

      // ==========================
      // Get students
      // ==========================

      const studentIds =
        rows
          .map(
            (
              row
            ) =>
              row.studentId ||
              row[
                "Student ID"
              ]
          )
          .filter(
            Boolean
          );

      const students =
        await Student.find(
          {
            studentId:
              {
                $in:
                  studentIds,
              },
          }
        );

      const studentMap =
        new Map(
          students.map(
            (
              s
            ) => [
              s.studentId,
              s._id,
            ]
          )
        );

      // ==========================
      // Prepare bulk operations
      // ==========================

      const operations =
        [];

      let skipped =
        0;

      for (const row of rows) {
        const sid =
          row.studentId ||
          row[
            "Student ID"
          ];

        const score =
          Number(
            row.score ||
              row[
                "Score"
              ] ||
              row[
                "Marks"
              ]
          );

        const studentObjectId =
          studentMap.get(
            sid
          );

        if (
          !studentObjectId
        ) {
          skipped++;
          continue;
        }

        if (
          isNaN(
            score
          )
        ) {
          skipped++;
          continue;
        }

        if (
          score <
            0 ||
          score >
            maxScoreNum
        ) {
          skipped++;
          continue;
        }

        // ==========================
        // Calculate contribution
        // ==========================

        const examPercentage =
          (score /
            maxScoreNum) *
          100;

        const contributionToModule =
          (examPercentage *
            subject.weight) /
          100;

        operations.push(
          {
            updateOne:
              {
                filter:
                  {
                    studentId:
                      studentObjectId,

                    subjectId,

                    moduleId,
                  },

                update:
                  {
                    $set:
                      {
                        score,

                        maxScore:
                          maxScoreNum,

                        subjectWeight:
                          subject.weight,

                        contributionToModule,

                        uploadedBy:
                          req
                            .user
                            .id,

                        released:
                          false,
                      },
                  },

                upsert:
                  true,
              },
          }
        );
      }

      // ==========================
      // Save
      // ==========================

      const result =
        await Result.bulkWrite(
          operations,
          {
            ordered:
              false,
          }
        );

      res.json({
        success: true,

        message:
          "Results uploaded successfully",

        inserted:
          result.upsertedCount,

        updated:
          result.modifiedCount,

        skipped,
      });
    } catch (err) {
      console.error(
        err
      );

      res.status(
        500
      ).json({
        success:
          false,
        message:
          "Upload failed",
        error:
          err.message,
      });
    }
  };

  // ===============================
// UPDATE RESULT
// ===============================
export const updateResult =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        score,
        maxScore,
      } = req.body;

      // ==========================
      // Validate input
      // ==========================

      const scoreNum =
        Number(score);

      const maxScoreNum =
        Number(
          maxScore
        );

      if (
        isNaN(scoreNum)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid score",
          });
      }

      if (
        isNaN(
          maxScoreNum
        ) ||
        maxScoreNum <=
          0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid maxScore",
          });
      }

      if (
        scoreNum < 0 ||
        scoreNum >
          maxScoreNum
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message: `Score must be between 0 and ${maxScoreNum}`,
          });
      }

      // ==========================
      // Find result
      // ==========================

      const result =
        await Result.findById(
          id
        );

      if (!result) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Result not found",
          });
      }

      // ==========================
      // Get subject
      // ==========================

      const subject =
        await Subject.findById(
          result.subjectId
        );

      if (!subject) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Subject not found",
          });
      }

      // ==========================
      // Recalculate contribution
      // ==========================

      // Example:
      // 12/15 × 100 = 80

      const examPercentage =
        (scoreNum /
          maxScoreNum) *
        100;

      // Example:
      // 80 × 10 /100 = 8

      const contributionToModule =
        (examPercentage *
          subject.weight) /
        100;

      // ==========================
      // Update result
      // ==========================

      result.score =
        scoreNum;

      result.maxScore =
        maxScoreNum;

      result.subjectWeight =
        subject.weight;

      result.contributionToModule =
        contributionToModule;

      result.uploadedBy =
        req.user.id;

      await result.save();

      // ==========================
      // Response
      // ==========================

      res.json({
        success: true,

        message:
          "Result updated successfully",

        result,
      });
    } catch (err) {
      console.error(
        err
      );

      res.status(
        500
      ).json({
        success:
          false,

        message:
          "Update failed",

        error:
          err.message,
      });
    }
  };

  // ===============================
// DELETE RESULT
// ===============================

export const deleteResult =
  async (req, res) => {
    try {
      const { resultId } =
        req.params;

      // =========================
      // Validate ID
      // =========================

      if (!resultId) {
        return res.status(400).json({
          success: false,
          message:
            "Result ID is required",
        });
      }

      // =========================
      // Find result
      // =========================

      const result =
        await Result.findById(
          resultId
        )
          .populate(
            "studentId",
            "displayName studentId"
          )
          .populate(
            "subjectId",
            "name"
          )
          .populate(
            "moduleId",
            "name"
          );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Result not found",
        });
      }

      // =========================
      // Delete result
      // =========================

      await Result.findByIdAndDelete(
        resultId
      );

      // =========================
      // Response
      // =========================

      res.json({
        success: true,

        message:
          "Result deleted successfully",

        deletedResult: {
          resultId,

          studentName:
            result.studentId
              ?.displayName,

          studentCode:
            result.studentId
              ?.studentId,

          subject:
            result.subjectId
              ?.name,

          module:
            result.moduleId
              ?.name,
        },
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Delete result failed",

        error:
          err.message,
      });
    }
  };


// ===============================
// RELEASE RESULTS
// ===============================
// ===============================
// RELEASE RESULTS
// ===============================

export const releaseResults =
  async (req, res) => {
    try {
      const { moduleId } =
        req.params;

      // =========================
      // Find module
      // =========================

      const module =
        await Module.findById(
          moduleId
        );

      if (!module) {
        return res.status(404).json({
          success: false,
          message:
            "Module not found",
        });
      }

      // =========================
      // Release results
      // =========================

      const updated =
        await Result.updateMany(
          { moduleId },
          {
            released: true,
          }
        );

      // =========================
      // Response
      // =========================

      res.json({
        success: true,

        message:
          "Results released successfully",

        moduleId,

        moduleName:
          module.name,

        released: true,

        modifiedCount:
          updated.modifiedCount,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Release failed",
        error:
          err.message,
      });
    }
  };


// ===============================
// UNRELEASE RESULTS
// ===============================
// ===============================
// UNRELEASE RESULTS
// ===============================

export const unreleaseResults =
  async (req, res) => {
    try {
      const { moduleId } =
        req.params;

      // =========================
      // Find module
      // =========================

      const module =
        await Module.findById(
          moduleId
        );

      if (!module) {
        return res.status(404).json({
          success: false,
          message:
            "Module not found",
        });
      }

      // =========================
      // Hide results
      // =========================

      const updated =
        await Result.updateMany(
          { moduleId },
          {
            released: false,
          }
        );

      // =========================
      // Response
      // =========================

      res.json({
        success: true,

        message:
          "Results hidden successfully",

        moduleId,

        moduleName:
          module.name,

        released: false,

        modifiedCount:
          updated.modifiedCount,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Unrelease failed",
        error:
          err.message,
      });
    }
  };

  // ===============================
// GET RELEASE STATUS
// ===============================

export const getReleaseStatus =
  async (req, res) => {
    try {
      // =========================
      // Get modules with structure
      // =========================

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
          })
          .sort({
            createdAt: 1,
          });

      // =========================
      // Build response
      // =========================

      const data =
        await Promise.all(
          modules.map(
            async (
              module
            ) => {
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
                    ?.name ||
                  null,

                year:
                  module
                    .semesterId
                    ?.yearId
                    ?.name ||
                  null,

                released:
                  result
                    ?.released ||
                  false,
              };
            }
          )
        );

      res.json({
        success: true,
        count:
          data.length,
        data,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch release status",

        error:
          err.message,
      });
    }
  };


// ===============================
// STUDENT RESULTS (HIERARCHY)
// ===============================
export const getStudentResults =
  async (req, res) => {
    try {
      const { studentId } =
        req.params;

      
      // =====================
      // FETCH RELEASED RESULTS
      // =====================

      const results =
        await Result.find({
          studentId,
          released: true,
        })
          .populate(
            "studentId",
            "studentId displayName"
          )
          .populate(
            "subjectId",
            "name weight order"
          )
          .populate({
            path: "moduleId",
            select:
              "name code credit order semesterId",
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
      // EMPTY RESULT
      // =====================

      if (!results.length) {
        return res.json({
          student: null,
          years: [],
          cgpa: 0,
        });
      }

      // =====================
      // STUDENT INFO
      // =====================

      const student =
        results[0].studentId;

      // =====================
      // BUILD HIERARCHY
      // =====================

      const yearsMap =
        new Map();

      for (const r of results) {
        if (
          !r.moduleId ||
          !r.subjectId
        )
          continue;

        const module =
          r.moduleId;

        const semester =
          module.semesterId;

        if (!semester)
          continue;

        const year =
          semester.yearId;

        if (!year)
          continue;

        // =====================
        // YEAR
        // =====================

        const yearKey =
          year._id.toString();

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
                year.order ||
                0,

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
        // SEMESTER
        // =====================

        let semesterObj =
          yearObj.semesters.find(
            (s) =>
              s.semesterId.toString() ===
              semester._id.toString()
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
        // MODULE
        // =====================

        let moduleObj =
          semesterObj.modules.find(
            (m) =>
              m.moduleId.toString() ===
              module._id.toString()
          );

        if (!moduleObj) {
          moduleObj = {
            moduleId:
              module._id,

            moduleName:
              module.name,

            moduleCode:
              module.code,

            credit:
              module.credit,

            percentage: 0,

            grade: "",

            status: "",

            subjects: [],
          };

          semesterObj.modules.push(
            moduleObj
          );
        }

        // =====================
        // SUBJECT
        // =====================

        moduleObj.subjects.push(
          {
            subjectId:
              r.subjectId._id,

            subjectName:
              r.subjectId.name,

            weight:
              r.subjectId.weight,

            score:
              r.score,

            maxScore:
              r.maxScore,

            percentage:
              Number(
                (
                  (r.score /
                    r.maxScore) *
                  100
                ).toFixed(2)
              ),
          }
        );

        // add contribution
        moduleObj.percentage +=
          Number(
            r.contributionToModule ||
              0
          );
      }

      // =====================
      // FINAL PROCESSING
      // =====================

      const years =
        Array.from(
          yearsMap.values()
        );

      for (const year of years) {
        // sort semesters
        year.semesters.sort(
          (a, b) =>
            a.order -
            b.order
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

            // grade
            module.grade =
              getGrade(
                module.percentage
              );

            // status
            if (
              module.grade ===
              "F"
            ) {
              module.status =
                "RETAKE";
            } else if (
              module.grade ===
              "D"
            ) {
              module.status =
                "RE-EXAM";
            } else {
              module.status =
                "PASS";
            }

            // sort subjects
            module.subjects.sort(
              (a, b) =>
                a.subjectName.localeCompare(
                  b.subjectName
                )
            );
          }

          // TODO:
          // weighted GPA later
          semester.gpa = 0;
        }

        // TODO:
        // CGPA later
        year.cgpa = 0;
      }

      // sort years
      years.sort(
        (a, b) =>
          a.order -
          b.order
      );

      // TODO:
      // overall CGPA
      const cgpa = 0;

      // =====================
      // RESPONSE
      // =====================

      res.json({
        student: {
          id:
            student._id,

          studentId:
            student.studentId,

          displayName:
            student.displayName,
        },

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

  
  // ===============================
// GET STUDENT DETAIL FOR ADMIN
// ===============================
export const getStudentDetailAdmin = async (
  req,
  res
) => {
  try {
    const { studentId } = req.params;

    // ======================
    // Validate input
    // ======================

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // ======================
    // Find student
    // ======================

    const student =
      await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // ======================
    // Get ALL student results
    // Admin sees:
    // released + unreleased
    // ======================

    const results =
      await Result.find({
        studentId: student._id,
      })
        .populate(
          "subjectId",
          "name weight"
        )
        .populate({
          path: "moduleId",
          select:
            "name code credit semesterId",
          populate: {
            path: "semesterId",
            select: "name yearId",
            populate: {
              path: "yearId",
              select: "name",
            },
          },
        });

    // ======================
    // No results
    // ======================

    if (results.length === 0) {
      return res.status(200).json({
        success: true,
        student: {
          id: student._id,
          studentId:
            student.studentId,
          name:
            student.name,
          email:
            student.email,
        },
        years: [],
      });
    }

    // ======================
    // Build hierarchy
    // Year
    // → Semester
    // → Module
    // → Subject
    // ======================

    const yearsMap =
      new Map();

    for (const result of results) {
      if (
        !result.moduleId ||
        !result.subjectId
      ) {
        continue;
      }

      const module =
        result.moduleId;

      const semester =
        module.semesterId;

      if (!semester) continue;

      const year =
        semester.yearId;

      if (!year) continue;

      const yearKey =
        year._id.toString();

      const semesterKey =
        semester._id.toString();

      const moduleKey =
        module._id.toString();

      // ======================
      // Create year
      // ======================

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
            semesters: [],
          }
        );
      }

      const yearObj =
        yearsMap.get(
          yearKey
        );

      // ======================
      // Create semester
      // ======================

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
          modules: [],
        };

        yearObj.semesters.push(
          semesterObj
        );
      }

      // ======================
      // Create module
      // ======================

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
          moduleCode:
            module.code,
          credit:
            module.credit || 0,

          percentage: 0,
          grade: "",
          status: "",
          released:
            result.released,

          subjects: [],
        };

        semesterObj.modules.push(
          moduleObj
        );
      }

      // ======================
      // Add subject
      // ======================

      moduleObj.subjects.push({
        subjectId:
          result.subjectId._id,

        subjectName:
          result.subjectId.name,

        subjectWeight:
          result.subjectId.weight,

        score:
          result.score,

        maxScore:
          result.maxScore,

        contributionToModule:
          result.contributionToModule,

        released:
          result.released,
      });

      // ======================
      // Add module contribution
      // ======================

      moduleObj.percentage +=
        Number(
          result.contributionToModule ||
            0
        );
    }

    // ======================
    // Final processing
    // ======================

    const years =
      Array.from(
        yearsMap.values()
      );

    for (const year of years) {
      for (const semester of year.semesters) {
        for (const module of semester.modules) {
          module.percentage =
            Number(
              module.percentage.toFixed(
                2
              )
            );

          const gradeData =
            getGrade(
              module.percentage
            );

          module.grade =
            gradeData.grade;

          module.status =
            gradeData.status;

          module.subjects.sort(
            (a, b) =>
              a.subjectName.localeCompare(
                b.subjectName
              )
          );
        }
      }
    }

    // ======================
    // Response
    // ======================

    res.status(200).json({
      success: true,

      student: {
        id: student._id,
        studentId:
          student.studentId,
        name:
          student.name,
        email:
          student.email,
      },

      years,
    });
  } catch (err) {
    console.error(
      "Student detail error:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch student detail",
      error:
        err.message,
    });
  }
};

// ===============================
// ADMIN: GET RESULTS BY SUBJECT
// ===============================
export const getResultsBySubject =
  async (req, res) => {
    try {
      const { subjectId } =
        req.params;

      // ======================
      // Validate input
      // ======================

      if (!subjectId) {
        return res.status(400).json({
          success: false,
          message:
            "Subject ID is required",
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
          success: false,
          message:
            "Subject not found",
        });
      }

      // ======================
      // Get results
      // ======================

      const results =
        await Result.find({
          subjectId,
        })
          .populate(
            "studentId",
            "studentId name email"
          )
          .sort({
            score: -1,
          });

      // ======================
      // Format response
      // ======================

      const students =
        results.map((r) => ({
          resultId: r._id,

          studentId:
            r.studentId
              ?.studentId,

          studentName:
            r.studentId
              ?.name,

          email:
            r.studentId
              ?.email,

          score:
            r.score,

          maxScore:
            r.maxScore,

          percentage:
            Number(
              (
                (r.score /
                  r.maxScore) *
                100
              ).toFixed(2)
            ),

          released:
            r.released,
        }));

      res.status(200).json({
        success: true,

        subject: {
          id:
            subject._id,
          name:
            subject.name,
          code:
            subject.code,
          weight:
            subject.weight,
        },

        totalStudents:
          students.length,

        students,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          "Failed to fetch subject results",
        error:
          err.message,
      });
    }
  };

  // ===============================
// ADMIN: GET MODULE RESULTS
// ===============================
export const getModuleResults =
  async (req, res) => {
    try {
      const { moduleId } =
        req.params;

      // ======================
      // Validate input
      // ======================

      if (!moduleId) {
        return res.status(400).json({
          success: false,
          message:
            "Module ID is required",
        });
      }

      // ======================
      // Find module
      // ======================

      const module =
        await Module.findById(
          moduleId
        );

      if (!module) {
        return res.status(404).json({
          success: false,
          message:
            "Module not found",
        });
      }


      // ======================
      // Get module results
      // ======================

      const results =
        await Result.find({
          moduleId,
        })
          .populate(
            "studentId",
            "studentId name"
          )
          .populate(
            "subjectId",
            "name weight"
          );

      // ======================
      // Group by student
      // ======================

      const studentMap =
        new Map();

      for (const result of results) {
        if (
          !result.studentId
        )
          continue;

        const sid =
          result.studentId._id.toString();

        if (
          !studentMap.has(
            sid
          )
        ) {
          studentMap.set(
            sid,
            {
              studentId:
                result
                  .studentId
                  .studentId,

              studentName:
                result
                  .studentId
                  .name,

              modulePercentage: 0,

              grade: "",

              status: "",
            }
          );
        }

        const student =
          studentMap.get(
            sid
          );

        student.modulePercentage +=
          Number(
            result.contributionToModule ||
              0
          );
      }

      // ======================
      // Final processing
      // ======================

      const students =
        Array.from(
          studentMap.values()
        ).map(
          (student) => {
            student.modulePercentage =
              Number(
                student.modulePercentage.toFixed(
                  2
                )
              );

            const gradeData =
              getGrade(
                student.modulePercentage
              );

            student.grade =
              gradeData.grade;

            student.status =
              gradeData.status;

            return student;
          }
        );

      // Sort highest first
      students.sort(
        (a, b) =>
          b.modulePercentage -
          a.modulePercentage
      );

      res.status(200).json({
        success: true,

        module: {
          id:
            module._id,
          name:
            module.name,
          code:
            module.code,
        },

        totalStudents:
          students.length,

        students,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message:
          "Failed to fetch module results",
        error:
          err.message,
      });
    }
  };

  export const getReExamStudents = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("studentId", "studentId displayName")
      .populate("moduleId", "name");

    const moduleMap = new Map();

    for (const r of results) {
      const key =
        r.studentId._id.toString() +
        r.moduleId._id.toString();

      if (!moduleMap.has(key)) {
        moduleMap.set(key, {
          studentId: r.studentId.studentId,
          name: r.studentId.displayName,
          module: r.moduleId.name,
          percentage: 0,
        });
      }

      const entry = moduleMap.get(key);

      const percentage =
        (r.score / r.maxScore) * 100;

      entry.percentage +=
        r.contributionToModule || percentage;
    }

    const data = [];

    for (const m of moduleMap.values()) {
      const grade = getGrade(m.percentage);

      if (grade !== "D") continue;

      data.push({
        ...m,
        percentage: Number(m.percentage.toFixed(2)),
        grade,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Re-exam fetch failed",
      error: err.message,
    });
  }
};

export const getRetakeStudents = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("studentId", "studentId displayName")
      .populate("moduleId", "name");

    const moduleMap = new Map();

    for (const r of results) {
      const key =
        r.studentId._id.toString() +
        r.moduleId._id.toString();

      if (!moduleMap.has(key)) {
        moduleMap.set(key, {
          studentId: r.studentId.studentId,
          name: r.studentId.displayName,
          module: r.moduleId.name,
          percentage: 0,
        });
      }

      const entry = moduleMap.get(key);

      const percentage =
        (r.score / r.maxScore) * 100;

      entry.percentage +=
        r.contributionToModule || percentage;
    }

    const data = [];

    for (const m of moduleMap.values()) {
      const grade = getGrade(m.percentage);

      if (grade !== "F") continue;

      data.push({
        ...m,
        percentage: Number(m.percentage.toFixed(2)),
        grade,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      message: "Retake fetch failed",
      error: err.message,
    });
  }
};
export const getAdminStats = async (req, res) => {
  try {
    const results = await Result.find();

    const moduleMap = new Map();

    for (const r of results) {
      const key =
        r.studentId.toString() +
        r.moduleId.toString();

      if (!moduleMap.has(key)) {
        moduleMap.set(key, 0);
      }

      const percentage =
        (r.score / r.maxScore) * 100;

      moduleMap.set(
        key,
        moduleMap.get(key) +
          (r.contributionToModule ||
            percentage)
      );
    }

    let pass = 0;
    let reexam = 0;
    let retake = 0;

    for (const percent of moduleMap.values()) {
      const grade = getGrade(percent);

      if (grade === "F") retake++;
      else if (grade === "D") reexam++;
      else pass++;
    }

    res.json({
      totalModules: moduleMap.size,
      pass,
      reexam,
      retake,
    });
  } catch (err) {
    res.status(500).json({
      message: "Stats failed",
      error: err.message,
    });
  }
};