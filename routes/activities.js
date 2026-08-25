const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  db.all("SELECT * FROM activities ORDER BY timestamp DESC", (err, rows) => {
    if (err) {
      console.error("Error fetching the activities:", err);
      return res.status(500).json({ error: "Failed to fetch activities" });
    }
    res.json(rows);
  });
});

router.post("/", (req, res) => {
  const { description, user_id } = req.body;
  db.run(
    "INSERT INTO activities (description, user_id) VALUES (?, ?)",
    [description, user_id],
    function (err) {
      if (err) {
        console.error("Error adding activity:", err);
        return res.status(500).json({ error: "Failed to add activity" });
      }

      const notificationsDb = require("../database/submissions_db");
      notificationsDb.run(
        "INSERT INTO notifications (type, message) VALUES (?, ?)",
        [
          "activity",
          description,
        ]
      );

      res.status(201).json({ id: this.lastID });
    }
  );
});

router.delete("/", (req, res) => {
  db.run("DELETE FROM activities", function (err) {
    if (err) {
      console.error("Error deleting activities:", err);
      return res.status(500).json({ error: "Failed to delete activities" });
    }
    res.json({ message: "All activities deleted" });
  });
});

module.exports = router;
