# HireHub — Job Portal

A full-stack job portal: recruiters post jobs, candidates search/apply with a resume upload, and both sides track progress from a dashboard.

**Stack:** Node.js + Express (backend API) · MySQL (database) · Vanilla HTML/CSS/JavaScript (frontend, served by Express)

---

## Features

- Registration & login with hashed passwords (bcrypt) and JWT-based sessions
- Two roles: **Recruiter** and **Candidate**, enforced on both frontend routes and backend endpoints
- Recruiters: post jobs, view/edit/delete their listings, view applicants, update application status
- Candidates: search and filter jobs (keyword, location, job type, salary), apply with a resume upload (PDF/DOC/DOCX), track application status
- Resume file storage via Multer, served statically
- Dashboards for both roles

---

## Project structure

```
job-portal/
├── backend/
│   ├── config/db.js           # MySQL connection pool
│   ├── middleware/auth.js     # JWT verification + role guard
│   ├── middleware/upload.js   # Multer resume upload config
│   ├── routes/auth.js         # register / login / me
│   ├── routes/jobs.js         # CRUD + search/filter
│   ├── routes/applications.js # apply, view applicants, update status
│   ├── uploads/resumes/       # uploaded resume files land here
│   ├── schema.sql             # MySQL schema (run this first)
│   ├── server.js              # Express app entry point
│   ├── .env.example           # copy to .env and fill in
│   └── package.json
└── frontend/
    ├── css/style.css
    ├── js/api.js               # fetch wrapper (attaches JWT)
    ├── js/auth.js              # session helpers + navbar
    ├── index.html               # landing page
    ├── login.html / register.html
    ├── jobs.html                # search & browse jobs
    ├── job-detail.html          # job details + apply form
    ├── post-job.html            # recruiter: create a job
    ├── dashboard-recruiter.html # recruiter: manage jobs
    ├── applicants.html          # recruiter: review applicants
    └── dashboard-candidate.html # candidate: track applications
```

---

## Setup

### 1. Database

Make sure MySQL is running locally, then create the schema:

```bash
mysql -u root -p < backend/schema.sql
```

This creates the `job_portal` database with `users`, `jobs`, and `applications` tables.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DB_PASSWORD and a strong JWT_SECRET
npm start
```

The server starts on `http://localhost:5000` by default and **also serves the frontend** — so you don't need a separate static server. Just open:

```
http://localhost:5000
```

### 3. (Optional) Frontend on its own

If you'd rather serve the frontend separately (e.g. VS Code Live Server on port 5500), it will still work — `js/api.js` calls relative `/api/...` paths, so either point your static server's proxy at the backend, or open the frontend directly from `http://localhost:5000` as described above (simplest option).

---

## API reference

| Method | Endpoint                            | Auth              | Description                          |
|--------|--------------------------------------|-------------------|---------------------------------------|
| POST   | `/api/auth/register`                | Public            | Create an account                     |
| POST   | `/api/auth/login`                   | Public            | Log in, receive JWT                   |
| GET    | `/api/auth/me`                      | Any               | Get current user profile              |
| GET    | `/api/jobs`                         | Public            | List/search/filter open jobs          |
| GET    | `/api/jobs/my`                      | Recruiter         | Jobs posted by the logged-in user     |
| GET    | `/api/jobs/:id`                     | Public            | Job detail                            |
| POST   | `/api/jobs`                         | Recruiter         | Create a job                          |
| PUT    | `/api/jobs/:id`                     | Recruiter (owner) | Update a job                          |
| DELETE | `/api/jobs/:id`                     | Recruiter (owner) | Delete a job                          |
| POST   | `/api/applications/:jobId`          | Candidate         | Apply with resume (multipart/form-data) |
| GET    | `/api/applications/my`              | Candidate         | My submitted applications             |
| GET    | `/api/applications/job/:jobId`      | Recruiter (owner) | Applicants for a job                  |
| PUT    | `/api/applications/:id/status`      | Recruiter (owner) | Update application status             |

Search/filter query params on `GET /api/jobs`: `keyword`, `location`, `job_type`, `min_salary`.

---

## Notes on this being an "intermediate" build

- No frontend framework — plain HTML pages + a small shared `api.js`/`auth.js`, so it's easy to read top-to-bottom.
- No refresh tokens / password reset flow — JWTs are long-lived (`.env` controls expiry) to keep the auth layer simple.
- One resume per candidate per job is enforced with a unique DB constraint rather than app-level locking.
- No pagination on job search results — fine for demo/small datasets; add `LIMIT`/`OFFSET` to `routes/jobs.js` if you scale it up.
