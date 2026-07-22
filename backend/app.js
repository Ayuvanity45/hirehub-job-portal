const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");
const applicationRoutes = require("./routes/applications");

const app = express();
app.set("trust proxy", 1);

/* ---------------- Security ---------------- */

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cors());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use(limiter);

/* ---------------- Compression ---------------- */

app.use(compression());

/* ---------------- Body Parser ---------------- */

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/* ---------------- Static Files ---------------- */

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

app.use(
    express.static(path.join(__dirname, "..", "frontend"))
);

/* ---------------- API Routes ---------------- */

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/jobs", jobRoutes);

app.use("/api/v1/applications", applicationRoutes);

/* ---------------- Health ---------------- */

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        application: "HireHub",
        version: "1.0.0",
        status: "Running",
        uptime: process.uptime(),
        timestamp: new Date()
    });
});

/* ---------------- API Not Found ---------------- */

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API Route Not Found"
    });
});

/* ---------------- Error Handler ---------------- */

app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({

        success: false,

        message: err.message || "Internal Server Error"

    });

});

module.exports = app;