import express from "express";
import {
  getResultsStats,
  addResult,
  uploadResults,
 // bulkCreateResults,
  updateResult,
  deleteResult,
  getResultsBySubject,
  getStudentResults,
  releaseResults,
} from "../controllers/resultController.js";

import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get('/stats', protect, isAdmin, getResultsStats);
// 🔹 manual add
router.post("/add", protect, isAdmin, addResult);

// 🔹 excel upload
router.post(
  "/upload",
  protect,
  isAdmin,
  upload.single("file"),
  uploadResults
);

// ==========================
// 🟢 BULK CREATE
// ==========================
//router.post("/bulk", protect, isAdmin, bulkCreateResults);

// ==========================
// 🟢 UPDATE
// ==========================
router.put("/:id", protect, isAdmin, updateResult);

// ==========================
// 🟢 DELETE
// ==========================
router.delete("/:id", protect, isAdmin, deleteResult);



// 🔹 get by subject
router.get("/subject/:subjectId", protect, getResultsBySubject);

// 🔹 student results
router.get("/students/:studentId", protect, getStudentResults);

// 🔹 release
router.put("/release/:subjectId", protect, isAdmin, releaseResults);

export default router;