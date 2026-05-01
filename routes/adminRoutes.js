import express from "express";
import {
  createYear,
  updateYear,
  deleteYear,

  createSemester,
  updateSemester,
  deleteSemester,

  createModule,
  updateModule,
  deleteModule,

  createSubject,
  updateSubject,
  deleteSubject,

  getStructure,
} from "../controllers/adminStructureController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";


const router = express.Router();

// 🔐 ALL ADMIN ROUTES PROTECTED
router.use(protect, isAdmin);

// ================= STRUCTURE =================
router.get("/structure", getStructure);

// ================= YEAR =================
router.post("/year", createYear);
router.put("/year/:id", updateYear);
router.delete("/year/:id", deleteYear);

// ================= SEMESTER =================
router.post("/semester", createSemester);
router.put("/semester/:id", updateSemester);
router.delete("/semester/:id", deleteSemester);

// ================= MODULE =================
router.post("/module", createModule);
router.put("/module/:id", updateModule);
router.delete("/module/:id", deleteModule);

// ================= SUBJECT =================
router.post("/subject", createSubject);
router.put("/subject/:id", updateSubject);
router.delete("/subject/:id", deleteSubject);




export default router;