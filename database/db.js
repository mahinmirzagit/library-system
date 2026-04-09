const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const isRemote = process.env.TURSO_URL && process.env.TURSO_AUTH_TOKEN;
let db;

if (isRemote) {
  console.log("Using Turso (remote SQLite) for database.");
  const { createClient } = require("@libsql/client");
  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Compatibility wrapper for Turso to match sqlite3 API
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
    close: (cb) => {
      // LibSQL client doesn't have a close method like sqlite3, but we can call it a success
      if (cb) cb(null);
    }
  };
  
  // Initialize on remote if needed
  initializeDatabase();
} else {
  const dbPath = path.join(__dirname, "library.db");
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
    } else {
      console.log("Connected to local SQLite database.");
      initializeDatabase();
    }
  });
}

function initializeDatabase() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='books'",
    (err, row) => {
      if (err) {
        console.error("Error checking database:", err.message);
        return;
      }

      if (row) {
        console.log("Database already initialized.");
      } else {
        console.log("Initializing database schema...");
        // Split schema into individual statements for Turso if needed, 
        // but db.exec should handle it if it's multiple statements.
        db.exec(schema, (err) => {
          if (err) {
            console.error("Error initializing database:", err.message);
          } else {
            console.log("Database initialized successfully.");
          }
        });
      }
    }
  );
}

module.exports = db;
