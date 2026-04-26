import express from "express";
import {
  createYear,
  createSemester,
  createModule,
  createSubject,
  getStructure,
} from "../controllers/adminStructureController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";


const router = express.Router();

router.post("/year", protect, isAdmin, createYear);
router.post("/semester", protect, isAdmin, createSemester);
router.post("/module", protect, isAdmin, createModule);
router.post("/subject", protect, isAdmin, createSubject);

router.get("/structure", protect, isAdmin, getStructure);

export default router;