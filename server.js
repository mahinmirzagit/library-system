require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production if using HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

const db = require("./database/db");
const submissionsDb = require("./database/submissions_db");

app.use("/api/books", require("./routes/books"));
app.use("/api/users", require("./routes/users"));
app.use("/api/activities", require("./routes/activities"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/auth", require("./routes/auth").router);
app.use("/api/submissions", require("./routes/submissions"));

const { initCronJobs, calculateDailyFines } = require("./utils/cronJobs");
initCronJobs();

// Vercel Cron Endpoint
app.get("/api/cron/calculate-fines", async (req, res) => {
  try {
    const changes = await calculateDailyFines();
    res.json({ message: "Daily fines processed.", affected_rows: changes });
  } catch (error) {
    console.error("Cron Error:", error);
    res.status(500).json({ error: "Fine processing failed." });
  }
});

app.get("/api/welcome", (req, res) => {
  console.log(`Request received: ${req.method} ${req.path}`);
  res.json({ message: "Welcome to the Library Management System!" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Library Management System API is running",
  });
});

// Only listen if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0);
  });
});

module.exports = app;
