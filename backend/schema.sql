-- Job Portal Database Schema
-- Run this once: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS job_portal;
USE job_portal;

-- ============================
-- USERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('recruiter', 'candidate') NOT NULL DEFAULT 'candidate',
    company_name VARCHAR(150) DEFAULT NULL,   -- only used by recruiters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- JOBS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    company VARCHAR(150) NOT NULL,
    location VARCHAR(100) NOT NULL,
    job_type ENUM('Full-time', 'Part-time', 'Internship', 'Contract', 'Remote') NOT NULL DEFAULT 'Full-time',
    salary_min INT DEFAULT NULL,
    salary_max INT DEFAULT NULL,
    skills VARCHAR(255) DEFAULT NULL,          -- comma-separated skills, used for filtering
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- APPLICATIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    candidate_id INT NOT NULL,
    resume_path VARCHAR(255) NOT NULL,
    cover_letter TEXT DEFAULT NULL,
    status ENUM('applied', 'reviewed', 'shortlisted', 'rejected', 'hired') NOT NULL DEFAULT 'applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, candidate_id) -- a candidate can apply to a job only once
);

-- Helpful indexes for search/filter performance
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_title ON jobs(title);
