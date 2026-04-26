import express from "express";
import {
  calculateModuleResult,
  calculateSemesterGPA,
} from "../controllers/gpaController.js";

import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// MODULE RESULT
router.get(
  "/module/:studentId/:moduleId",
  protect,
  isAdmin,
  calculateModuleResult
);

// GPA
router.get(
  "/semester/:studentId/:semesterId",
  protect,
  isAdmin,
  calculateSemesterGPA
);

export default router;