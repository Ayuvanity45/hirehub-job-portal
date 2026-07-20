const multer = require("multer");
const path = require("path");

// Store resumes on disk under /uploads/resumes with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "resumes"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

// Only allow PDF / DOC / DOCX resumes, capped at 5MB
function fileFilter(req, file, cb) {
  const allowedTypes = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed for resumes."));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
