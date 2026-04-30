import express from "express";
import {
  calculateModuleResult,
  calculateSemesterGPA,
} from "../controllers/gpaController.js";

import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();


// 🟢 MODULE RESULT (MAIN UNIT)
// GET /api/gpa/module/:moduleId/:studentId
router.get(
  "/module/:moduleId/:studentId",
  protect,
  calculateModuleResult
);


// 🟢 SEMESTER GPA
// GET /api/gpa/semester/:semesterId/:studentId
router.get(
  "/semester/:semesterId/:studentId",
  protect,
  calculateSemesterGPA
);


// 🟢 (OPTIONAL) ADMIN VIEW ANY STUDENT
// you can restrict later if needed
// router.get("/admin/module/:moduleId/:studentId", protect, isAdmin, calculateModuleResult);

export default router;