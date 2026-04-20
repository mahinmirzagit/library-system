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
          if (cb) cb.call({ lastID: res.lastInsertRowid, changes: Number(res.rowsAffected) }, null);
        })
        .catch(err => cb ? cb(err) : console.error(err));
    },
    exec: async (query, cb) => {
      try {
        // Split by semicolon and remove empty/comment-only lines
        const statements = query
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        // Execute sequentially to ensure schema builds correctly
        for (const statement of statements) {
          await client.execute(statement);
        }
        if (cb) cb(null);
      } catch (err) {
        console.error("Batch execution error:", err);
        if (cb) cb(err);
      }
    },
    close: (cb) => {
      if (cb) cb(null);
    }
  };
  
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

  // Check if the database has already been initialized by looking for the 'books' table.
  // If it exists, skip schema creation entirely to avoid "table already exists" errors.
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
        console.log("Initializing Physical Library database schema...");
        db.exec(schema, (err) => {
          if (err) {
            console.error("Error initializing database:", err.message);
          } else {
            console.log("Database initialized successfully with the pivot schema.");
          }
        });
      }

      // Always run migrations (safe: uses ADD COLUMN which is idempotent via error suppression)
      runMigrations();
    }
  );
}

// Adds new columns to support Firebase Auth without breaking existing data
function runMigrations() {
  const migrations = [
    // Firebase Auth columns (new)
    { sql: "ALTER TABLE users ADD COLUMN firebase_uid TEXT", label: "firebase_uid" },
    { sql: "ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'manual'", label: "auth_provider" },
    { sql: "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0", label: "is_verified" },
    // QR code column — schema.sql has this but older DBs may not
    { sql: "ALTER TABLE users ADD COLUMN user_qr_code TEXT", label: "user_qr_code" },
  ];

  migrations.forEach(({ sql, label }) => {
    db.run(sql, (err) => {
      if (err) {
        const msg = err.message.toLowerCase();
        // Silently skip if column already exists or constraint conflict
        if (!msg.includes("duplicate column name") && !msg.includes("already exists")) {
          console.error(`Migration error (${label}):`, err.message);
        }
      }
    });
  });
}

module.exports = db;
