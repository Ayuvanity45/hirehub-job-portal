const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// ============================
// POST /api/jobs  (recruiter only) - create a job posting
// ============================
router.post("/", authenticateToken, authorizeRoles("recruiter"), async (req, res) => {
  try {
    const { title, description, company, location, job_type, salary_min, salary_max, skills } = req.body;

    if (!title || !description || !company || !location) {
      return res.status(400).json({ message: "Title, description, company and location are required." });
    }

    const [result] = await pool.query(
      `INSERT INTO jobs (recruiter_id, title, description, company, location, job_type, salary_min, salary_max, skills)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description,
        company,
        location,
        job_type || "Full-time",
        salary_min || null,
        salary_max || null,
        skills || null,
      ]
    );

    res.status(201).json({ message: "Job posted successfully.", jobId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while posting job." });
  }
});

// ============================
// GET /api/jobs  (public) - list all open jobs, with search & filter
// Query params: keyword, location, job_type, min_salary
// ============================
router.get("/", async (req, res) => {
  try {
    const { keyword, location, job_type, min_salary } = req.query;

    let sql = `
      SELECT jobs.*, users.name AS recruiter_name
      FROM jobs
      JOIN users ON jobs.recruiter_id = users.id
      WHERE jobs.status = 'open'
    `;
    const params = [];

    if (keyword) {
      sql += " AND (jobs.title LIKE ? OR jobs.description LIKE ? OR jobs.skills LIKE ?)";
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }
    if (location) {
      sql += " AND jobs.location LIKE ?";
      params.push(`%${location}%`);
    }
    if (job_type) {
      sql += " AND jobs.job_type = ?";
      params.push(job_type);
    }
    if (min_salary) {
      sql += " AND (jobs.salary_max IS NULL OR jobs.salary_max >= ?)";
      params.push(Number(min_salary));
    }

    sql += " ORDER BY jobs.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching jobs." });
  }
});

// ============================
// GET /api/jobs/my  (recruiter only) - jobs posted by the logged-in recruiter
// NOTE: defined before /:id so "my" isn't parsed as an id
// ============================
router.get("/my", authenticateToken, authorizeRoles("recruiter"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT jobs.*,
        (SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id) AS applicant_count
       FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching your jobs." });
  }
});

// ============================
// GET /api/jobs/:id  (public) - single job details
// ============================
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT jobs.*, users.name AS recruiter_name, users.email AS recruiter_email
       FROM jobs JOIN users ON jobs.recruiter_id = users.id WHERE jobs.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Job not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching job." });
  }
});

// ============================
// PUT /api/jobs/:id  (recruiter only, must own the job)
// ============================
router.put("/:id", authenticateToken, authorizeRoles("recruiter"), async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Job not found." });
    }
    if (existing[0].recruiter_id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own job postings." });
    }

    const { title, description, company, location, job_type, salary_min, salary_max, skills, status } = req.body;

    await pool.query(
      `UPDATE jobs SET title=?, description=?, company=?, location=?, job_type=?, salary_min=?, salary_max=?, skills=?, status=?
       WHERE id = ?`,
      [
        title || existing[0].title,
        description || existing[0].description,
        company || existing[0].company,
        location || existing[0].location,
        job_type || existing[0].job_type,
        salary_min ?? existing[0].salary_min,
        salary_max ?? existing[0].salary_max,
        skills ?? existing[0].skills,
        status || existing[0].status,
        req.params.id,
      ]
    );

    res.json({ message: "Job updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating job." });
  }
});

// ============================
// DELETE /api/jobs/:id  (recruiter only, must own the job)
// ============================
router.delete("/:id", authenticateToken, authorizeRoles("recruiter"), async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Job not found." });
    }
    if (existing[0].recruiter_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own job postings." });
    }

    await pool.query("DELETE FROM jobs WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting job." });
  }
});

module.exports = router;
