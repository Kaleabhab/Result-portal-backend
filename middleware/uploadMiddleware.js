/**
 * Upload Middleware
 * Handles file uploads for:
 *   • Bulk student registration (Excel)
 *   • Bulk result upload (Excel)
 *
 * Features:
 *   • Auto-creates uploads/ folder if missing
 *   • Validates MIME type AND file extension
 *   • 5 MB size limit
 *   • Field-specific uploaders (single + bulk)
 *   • Safe filename generation
 *   • Wraps multer errors into consistent JSON
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// UPLOAD DIRECTORY — auto-create if it does not exist
// ============================================================
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ============================================================
// STORAGE — disk storage with unique filename
// ============================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${safeName}`);
  }
});

// ============================================================
// ALLOWED MIME TYPES + EXTENSIONS
// ============================================================
const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                          // .xls
  'application/octet-stream'                                            // some browsers
];

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

// ============================================================
// FILE FILTER — check both MIME and extension
// ============================================================
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIMES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    return cb(null, true);
  }

  return cb(
    new Error('Only Excel files (.xlsx, .xls) are allowed'),
    false
  );
};

// ============================================================
// MULTER INSTANCE
// ============================================================
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1
  },
  fileFilter
});

// ============================================================
// FIELD-SPECIFIC EXPORTS
// ============================================================
// Single Excel file on field "file"
const uploadExcel = upload.single('file');

// Bulk student registration — field "file"
const uploadStudentFile = upload.single('file');

// Bulk result upload — field "file"
const uploadResultFile = upload.single('file');

// Multiple files (rare) — max 5
const uploadMultipleFiles = upload.array('files', 5);

// ============================================================
// ERROR HANDLER WRAPPER
// Wraps multer errors into consistent JSON responses
// ============================================================
const handleUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5 MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected field: ${err.field}. Use "file" as the field name.`
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err.message && err.message.includes('Excel files')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  return next(err);
};

// ============================================================
// EXPORTS
// ============================================================
// Default export (backward-compatible with your existing
// `module.exports = upload` usage)
module.exports = upload;

// Named exports for explicit use in routes
module.exports.upload = upload;
module.exports.uploadExcel = uploadExcel;
module.exports.uploadStudentFile = uploadStudentFile;
module.exports.uploadResultFile = uploadResultFile;
module.exports.uploadMultipleFiles = uploadMultipleFiles;
module.exports.handleUploadError = handleUploadError;
module.exports.UPLOAD_DIR = UPLOAD_DIR;