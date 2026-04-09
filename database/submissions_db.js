const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const isRemote = process.env.TURSO_URL && process.env.TURSO_AUTH_TOKEN;
let db;

if (isRemote) {
  console.log("Using Turso (remote SQLite) for submissions database.");
  const { createClient } = require("@libsql/client");
  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = {
    get: (query, params, cb) => {
      if (typeof params === "function") {
        cb = params;
        params = [];
      }
      client.execute({ sql: query, args: params })
        .then(res => cb(null, res.rows[0]))
        .catch(err => cb(err));
    },
    all: (query, params, cb) => {
      if (typeof params === "function") {
        cb = params;
        params = [];
      }
      client.execute({ sql: query, args: params })
        .then(res => cb(null, res.rows))
        .catch(err => cb(err));
    },
    run: function(query, params, cb) {
      if (typeof params === "function") {
        cb = params;
        params = [];
      }
      client.execute({ sql: query, args: params })
        .then(res => {
          if (cb) cb.call({ lastID: res.lastInsertRowid, changes: res.rowsAffected }, null);
        })
        .catch(err => cb ? cb(err) : console.error(err));
    },
    exec: (query, cb) => {
      client.execute(query)
        .then(() => cb && cb(null))
        .catch(err => cb && cb(err));
    },
    serialize: (fn) => {
      // LibSQL doesn't need serialize like sqlite3 for standard operations
      fn();
    }
  };
} else {
  const dbPath = path.join(__dirname, "submissions.db");
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Connected to the local submissions database.");
  });
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stars INTEGER NOT NULL,
        message TEXT,
        user TEXT,
        email TEXT,
        reply TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        is_read INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  // Handle existing column addition safely
  if (!isRemote) {
    db.run(`ALTER TABLE ratings ADD COLUMN email TEXT`, (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Error adding email column:", err.message);
      }
    });
  }
});

module.exports = db;
