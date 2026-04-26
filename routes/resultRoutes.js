import express from "express";
import multer from "multer";
import { uploadExcel } from "../controllers/resultController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// file upload config
const upload = multer({ dest: "uploads/" });

// EXCEL UPLOAD ROUTE
router.post(
  "/upload-excel",
  protect,
  isAdmin,
  upload.single("file"),
  uploadExcel
);

export default router;