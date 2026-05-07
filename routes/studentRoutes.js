import express from "express";
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentStructure,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/structure", protect, getStudentStructure);

// Authenticated users
router.get("/", protect, getStudents);
router.get("/:id", protect, getStudent);

//Admin only

router.post("/", protect, isAdmin, createStudent);
router.put("/:id", protect, isAdmin, updateStudent);
router.delete("/:id", protect, isAdmin, deleteStudent);





export default router;