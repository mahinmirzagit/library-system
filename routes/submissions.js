const express = require("express");
const router = express.Router();
const db = require("../database/submissions_db");
const { requireAdmin } = require("./auth");

router.post("/rating", (req, res) => {
  const { stars, message, user, email } = req.body;
  const finalMessage = message || `${stars} star rating`;

  db.run(
    "INSERT INTO ratings (stars, message, user, email) VALUES (?, ?, ?, ?)",
    [stars, finalMessage, user, email],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const mainDb = require("../database/db");
      mainDb.run("INSERT INTO activities (description) VALUES (?)", [
        `New rating submitted: ${stars} stars by ${user || email}`,
      ]);

      const notificationsDb = require("../database/submissions_db");
      notificationsDb.run(
        "INSERT INTO notifications (type, message) VALUES (?, ?)",
        [
          "rating_submitted",
          `New rating: ${stars} stars submitted by ${user || email}.`,
        ]
      );

      res.json({ message: "Rating submitted successfully", id: this.lastID });
    }
  );
});

router.post("/contact", (req, res) => {
  const { username, email, message } = req.body;

  db.run(
    "INSERT INTO contact_submissions (username, email, message) VALUES (?, ?, ?)",
    [username, email, message],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const mainDb = require("../database/db");
      mainDb.run("INSERT INTO activities (description) VALUES (?)", [
        `New feedback received from ${username} (${email})`,
      ]);

      const notificationsDb = require("../database/submissions_db");
      notificationsDb.run(
        "INSERT INTO notifications (type, message) VALUES (?, ?)",
        [
          "contact_submitted",
          `New contact form submission from ${username} (${email}).`,
        ]
      );

      res.json({
        message: "Contact form submitted successfully",
        id: this.lastID,
      });
    }
  );
});

router.get("/rating", (req, res) => {
  db.all(
    "SELECT * FROM ratings WHERE stars > 3 ORDER BY timestamp DESC LIMIT 20",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.post("/rating/reply", (req, res) => {
  const { ratingId, reply } = req.body;

  db.run(
    "UPDATE ratings SET reply = ? WHERE id = ?",
    [reply, ratingId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Reply added successfully" });
    }
  );
});

router.delete("/ratings", requireAdmin, (req, res) => {
  db.run("DELETE FROM ratings", function (err) {
    if (err) {
      console.error("Error deleting all ratings:", err);
      return res.status(500).json({ error: "Failed to delete all ratings" });
    }
    res.json({ message: "All ratings deleted successfully" });
  });
});

router.delete("/contact", requireAdmin, (req, res) => {
  db.run("DELETE FROM contact_submissions", function (err) {
    if (err) {
      console.error("Error deleting all contact submissions:", err);
      return res
        .status(500)
        .json({ error: "Failed to delete all contact submissions" });
    }
    res.json({ message: "All contact submissions deleted successfully" });
  });
});

router.get("/notifications", (req, res) => {
  db.all(
    "SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.put("/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  db.run(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Notification marked as read" });
    }
  );
});

router.put("/notifications/:id/unread", (req, res) => {
  const { id } = req.params;
  db.run(
    "UPDATE notifications SET is_read = 0 WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Notification marked as unread" });
    }
  );
});

router.delete("/notifications/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM notifications WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Notification deleted" });
  });
});

module.exports = router;
