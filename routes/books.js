const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAdmin } = require("./auth");
const { fetchBookByISBN } = require("../utils/isbnService");
const { generateCopyUUID, generateQRCode } = require("../utils/qrService");

// 1. Fetch Book Metadata via ISBN (Google Books API)
router.get("/details/:isbn", requireAdmin, async (req, res) => {
    try {
        const metadata = await fetchBookByISBN(req.params.isbn);
        res.json(metadata);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// 2. Add Book Metadata to Library
router.post("/", requireAdmin, async (req, res) => {
    const { title, author, isbn, genre, publication_year, description, cover_image } = req.body;

    if (!isbn || !title || !author) {
        return res.status(400).json({ error: "ISBN, Title, and Author are required." });
    }

    const query = `
        INSERT INTO books (isbn, title, author, genre, publication_year, description, cover_image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(isbn) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `;
    const params = [isbn, title, author, genre, publication_year, description, cover_image];

    db.run(query, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to save book metadata." });
        }
        res.json({ id: this.lastID || null, message: "Metadata saved successfully." });
    });
});

// 3. Add a Physical Copy to a Book
router.post("/:id/copies", requireAdmin, async (req, res) => {
    const { shelf_coordinate } = req.body;
    const book_id = req.params.id;

    if (!shelf_coordinate) {
        return res.status(400).json({ error: "Shelf coordinate is required." });
    }

    const copyUUID = generateCopyUUID();
    try {
        const qrData = await generateQRCode(copyUUID);
        const query = `
            INSERT INTO physical_copies (book_id, copy_uuid, shelf_coordinate, qr_code_data)
            VALUES (?, ?, ?, ?)
        `;
        db.run(query, [book_id, copyUUID, shelf_coordinate, qrData], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to add physical copy." });
            }
            res.json({ id: this.lastID, uuid: copyUUID, qr: qrData });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate QR code." });
    }
});

// 4. List Books with Copy Statistics
router.get("/", (req, res) => {
    const query = `
        SELECT b.*, 
               COUNT(pc.id) as total_copies,
               SUM(CASE WHEN pc.status = 'available' THEN 1 ELSE 0 END) as available_copies
        FROM books b
        LEFT JOIN physical_copies pc ON b.id = pc.book_id
        GROUP BY b.id
        ORDER BY b.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to fetch inventory." });
        res.json(rows);
    });
});

// 5. Get Book Specific Copies
router.get("/:id/copies", (req, res) => {
    db.all("SELECT * FROM physical_copies WHERE book_id = ? AND is_deleted = FALSE", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to fetch copies." });
        res.json(rows);
    });
});

// 6. Issue Book (Admin Scan User QR + Copy QR)
router.post("/issue", requireAdmin, (req, res) => {
    const { user_qr, copy_qr, days } = req.body;

    if (!user_qr || !copy_qr) {
        return res.status(400).json({ error: "User QR and Copy QR are required." });
    }

    // Verify User and Copy
    db.get("SELECT id FROM users WHERE user_qr_code = ? AND status = 'active'", [user_qr], (err, user) => {
        if (!user) return res.status(404).json({ error: "Invalid or inactive user." });

        db.get("SELECT * FROM physical_copies WHERE copy_uuid = ? AND status = 'available'", [copy_qr], (err, copy) => {
            if (!copy) return res.status(404).json({ error: "Copy not available or invalid." });

            const borrowDays = days || 14;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + borrowDays);

            const query = `INSERT INTO borrowings (user_id, copy_id, due_date) VALUES (?, ?, ?)`;
            db.run(query, [user.id, copy.id, dueDate.toISOString()], function(err) {
                if (err) return res.status(500).json({ error: "Failed to create borrowing record." });

                db.run("UPDATE physical_copies SET status = 'borrowed' WHERE id = ?", [copy.id]);
                db.run("INSERT INTO activities (description, user_id) VALUES (?, ?)", [
                    `Issued copy ${copy_qr} to user ${user_qr}`, user.id
                ]);

                res.json({ message: "Book issued successfully.", due_date: dueDate });
            });
        });
    });
});

// 7. Return Book (Admin Scan Copy QR)
router.post("/return", requireAdmin, (req, res) => {
    const { copy_qr } = req.body;

    db.get("SELECT * FROM physical_copies WHERE copy_uuid = ?", [copy_qr], (err, copy) => {
        if (!copy) return res.status(404).json({ error: "Invalid Copy QR." });

        db.get("SELECT * FROM borrowings WHERE copy_id = ? AND status IN ('active', 'overdue')", [copy.id], (err, b) => {
            if (!b) return res.status(400).json({ error: "No active borrowing found for this copy." });

            db.run("UPDATE borrowings SET status = 'returned', return_date = CURRENT_TIMESTAMP WHERE id = ?", [b.id]);
            db.run("UPDATE physical_copies SET status = 'available' WHERE id = ?", [copy.id]);
            db.run("INSERT INTO activities (description, user_id) VALUES (?, ?)", [
                `Returned copy ${copy_qr}`, b.user_id
            ]);

            res.json({ message: "Book returned successfully.", fine_accrued: b.fine_amount });
        });
    });
});

// 8. Delete Book
router.delete("/:id", requireAdmin, (req, res) => {
  db.run("DELETE FROM books WHERE id = ?", [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: "Failed to delete book." });
      res.json({ message: "Book and metadata removed." });
  });
});

module.exports = router;
