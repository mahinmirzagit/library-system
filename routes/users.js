const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../database/db");
const { requireAdmin } = require("./auth");

router.get("/", (req, res) => {
  const { search, status, role, sortBy, sortOrder, includeDeleted } = req.query;

  let query =
    "SELECT id, name, email, role, status, created_at, updated_at FROM users";
  let params = [];
  let conditions = [];

  if (search) {
    conditions.push("(name ILIKE ? OR email ILIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status && status !== "all") {
    conditions.push("status = ?");
    params.push(status);
  }

  if (role && role !== "all") {
    conditions.push("role = ?");
    params.push(role);
  }

  if (includeDeleted !== "true") {
    conditions.push("is_deleted = FALSE");
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  if (sortBy) {
    const order = sortOrder === "desc" ? "DESC" : "ASC";
    query += ` ORDER BY ${sortBy} ${order}`;
  } else {
    query += " ORDER BY created_at DESC";
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows);
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ error: "Failed to fetch user" });
      }
      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(row);
    }
  );
});

router.post("/", async (req, res) => {
  const { name, email, password, role, status } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (name, email, password_hash, role, status)
                    VALUES (?, ?, ?, ?, ?)`;
    const params = [
      name,
      email,
      hashedPassword,
      role || "user",
      status || "active",
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error("Error creating user:", err);
        if (err.message.includes("UNIQUE constraint failed")) {
          return res.status(409).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: "Failed to create user" });
      }

      db.run("INSERT INTO activities (description) VALUES (?)", [
        `New user registered: ${name} (${email})`,
      ]);

      const notificationsDb = require("../database/submissions_db");
      notificationsDb.run(
        "INSERT INTO notifications (type, message) VALUES (?, ?)",
        [
          "user_registered",
          `New user "${name}" has registered with email ${email}.`,
        ]
      );

      res
        .status(201)
        .json({ id: this.lastID, message: "User created successfully" });
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  let query = `UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP`;
  let params = [name, email, role, status];

  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = query.replace(
        "updated_at = CURRENT_TIMESTAMP",
        "password_hash = ?, updated_at = CURRENT_TIMESTAMP"
      );
      params.splice(2, 0, hashedPassword);
    } catch (error) {
      console.error("Error hashing password:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }

  query += " WHERE id = ?";
  params.push(id);

  db.run(query, params, function (err) {
    if (err) {
      console.error("Error updating user:", err);
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(409).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Failed to update user" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated successfully" });
  });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query;

  db.get(
    "SELECT name, email, is_deleted FROM users WHERE id = ?",
    [id],
    (err, user) => {
      if (err) {
        console.error("Error fetching user for deletion:", err);
        return res.status(500).json({ error: "Failed to delete user" });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (permanent === "true") {
        db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
          if (err) {
            console.error("Error permanently deleting user:", err);
            return res
              .status(500)
              .json({ error: "Failed to permanently delete user" });
          }

          db.run("INSERT INTO activities (description) VALUES (?)", [
            `User permanently deleted: ${user.name} (${user.email})`,
          ]);

          res.json({ message: "User permanently deleted successfully" });
        });
      } else {
        db.run(
          "UPDATE users SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
          [id],
          function (err) {
            if (err) {
              console.error("Error soft deleting user:", err);
              return res.status(500).json({ error: "Failed to delete user" });
            }

            db.run("INSERT INTO activities (description) VALUES (?)", [
              `User moved to trash: ${user.name} (${user.email})`,
            ]);

            res.json({ message: "User moved to trash successfully" });
          }
        );
      }
    }
  );
});

router.delete("/", requireAdmin, (req, res) => {
  db.run("DELETE FROM users", function (err) {
    if (err) {
      console.error("Error deleting all users:", err);
      return res.status(500).json({ error: "Failed to delete all users" });
    }

    db.run("INSERT INTO activities (description) VALUES (?)", [
      "All users removed",
    ]);

    res.json({ message: "All users deleted successfully" });
  });
});

router.post("/:id/restore", (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE users SET is_deleted = FALSE, deleted_at = NULL WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        console.error("Error restoring user:", err);
        return res.status(500).json({ error: "Failed to restore user" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      db.get(
        "SELECT name, email FROM users WHERE id = ?",
        [id],
        (err, user) => {
          if (!err && user) {
            db.run("INSERT INTO activities (description) VALUES (?)", [
              `User restored: ${user.name} (${user.email})`,
            ]);
          }
        }
      );

      res.json({ message: "User restored successfully" });
    }
  );
});

module.exports = router;
