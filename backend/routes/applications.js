const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

// ============================
// POST /api/applications/:jobId  (candidate only) - apply to a job with resume upload
// ============================
router.post(
  "/:jobId",
  authenticateToken,
  authorizeRoles("candidate"),
  upload.single("resume"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { cover_letter } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "A resume file (PDF/DOC/DOCX) is required." });
      }

      // Make sure the job exists and is still open
      const [jobRows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [jobId]);
      if (jobRows.length === 0) {
        return res.status(404).json({ message: "Job not found." });
      }
      if (jobRows[0].status !== "open") {
        return res.status(400).json({ message: "This job is no longer accepting applications." });
      }

      const resumePath = `/uploads/resumes/${req.file.filename}`;

      try {
        const [result] = await pool.query(
          `INSERT INTO applications (job_id, candidate_id, resume_path, cover_letter) VALUES (?, ?, ?, ?)`,
          [jobId, req.user.id, resumePath, cover_letter || null]
        );
        res.status(201).json({ message: "Application submitted successfully.", applicationId: result.insertId });
      } catch (dbErr) {
        // Duplicate application (unique key on job_id + candidate_id)
        if (dbErr.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "You have already applied to this job." });
        }
        throw dbErr;
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error while submitting application." });
    }
  }
);

// ============================
// GET /api/applications/my  (candidate only) - applications submitted by the logged-in candidate
// ============================
router.get("/my", authenticateToken, authorizeRoles("candidate"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT applications.*, jobs.title AS job_title, jobs.company, jobs.location
       FROM applications
       JOIN jobs ON applications.job_id = jobs.id
       WHERE applications.candidate_id = ?
       ORDER BY applications.applied_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching your applications." });
  }
});

// ============================
// GET /api/applications/job/:jobId  (recruiter only, must own the job) - view applicants
// ============================
router.get("/job/:jobId", authenticateToken, authorizeRoles("recruiter"), async (req, res) => {
  try {
    const [jobRows] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.jobId]);
    if (jobRows.length === 0) {
      return res.status(404).json({ message: "Job not found." });
    }
    if (jobRows[0].recruiter_id !== req.user.id) {
      return res.status(403).json({ message: "You can only view applicants for your own job postings." });
    }

    const [rows] = await pool.query(
      `SELECT applications.*, users.name AS candidate_name, users.email AS candidate_email
       FROM applications
       JOIN users ON applications.candidate_id = users.id
       WHERE applications.job_id = ?
       ORDER BY applications.applied_at DESC`,
      [req.params.jobId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching applicants." });
  }
});

// ============================
// PUT /api/applications/:id/status  (recruiter only) - update application status
// ============================
router.put("/:id/status", authenticateToken, authorizeRoles("recruiter"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["applied", "reviewed", "shortlisted", "rejected", "hired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Confirm the recruiter owns the job tied to this application
    const [rows] = await pool.query(
      `SELECT applications.id, jobs.recruiter_id
       FROM applications JOIN jobs ON applications.job_id = jobs.id
       WHERE applications.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found." });
    }
    if (rows[0].recruiter_id !== req.user.id) {
      return res.status(403).json({ message: "You can only update applications for your own job postings." });
    }

    await pool.query("UPDATE applications SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Application status updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating application status." });
  }
});

module.exports = router;
