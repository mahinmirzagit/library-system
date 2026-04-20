const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const isPostgres = process.env.DATABASE_URL;
let db;

if (isPostgres) {
  console.log("Using Supabase (PostgreSQL) for database.");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Helper: Convert SQLite '?' placeholders to PostgreSQL '$1, $2...'
  function translateQuery(query) {
    let count = 0;
    let translated = query.replace(/\?/g, () => {
      count++;
      return `$${count}`;
    });

    // Emulate lastID by adding RETURNING id to INSERT statements if not present
    if (translated.trim().toUpperCase().startsWith("INSERT") && !translated.toUpperCase().includes("RETURNING")) {
      translated += " RETURNING id";
    }
    
    translated = translated.replace(/DATETIME\('now'\)/gi, "CURRENT_TIMESTAMP");
    translated = translated.replace(/sqlite_master/gi, "information_schema.tables");
    
    return translated;
  }

  // Compatibility wrapper for Postgres to match sqlite3 API
  db = {
    get: (query, params, cb) => {
      if (typeof params === "function") { cb = params; params = []; }
      const sql = translateQuery(query);
      pool.query(sql, params)
        .then(res => cb(null, res.rows[0]))
        .catch(err => { console.error("PG GET Error:", err.message, "| SQL:", sql); cb(err); });
    },
    all: (query, params, cb) => {
      if (typeof params === "function") { cb = params; params = []; }
      const sql = translateQuery(query);
      pool.query(sql, params)
        .then(res => cb(null, res.rows))
        .catch(err => { console.error("PG ALL Error:", err.message, "| SQL:", sql); cb(err); });
    },
    run: function(query, params, cb) {
      if (typeof params === "function") { cb = params; params = []; }
      const sql = translateQuery(query);
      pool.query(sql, params)
        .then(res => {
          const context = {
            lastID: res.rows[0] ? res.rows[0].id : null,
            changes: res.rowCount
          };
          if (cb) cb.call(context, null);
        })
        .catch(err => {
          console.error("PG RUN Error:", err.message, "| SQL:", sql);
          if (cb) cb(err);
        });
    },
    exec: async (query, cb) => {
      try {
        await pool.query(query);
        if (cb) cb(null);
      } catch (err) {
        console.error("PG EXEC Error:", err.message);
        if (cb) cb(err);
      }
    },
    close: (cb) => {
      pool.end().then(() => cb && cb(null)).catch(cb);
    }
  };

  initializePostgres();
} else {
  // Fallback to local SQLite
  const dbPath = path.join(__dirname, "library.db");
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Error opening SQLite database:", err.message);
    else {
      console.log("Connected to local SQLite database.");
      initializeSQLite();
    }
  });
}

function initializePostgres() {
  const schemaPath = path.join(__dirname, "postgres-schema.sql");
  if (!fs.existsSync(schemaPath)) {
      console.error("Error: postgres-schema.sql missing.");
      return;
  }
  const schema = fs.readFileSync(schemaPath, "utf8");

  db.get(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'books'",
    (err, row) => {
      if (err) return console.error("PG Init Check Error:", err.message);
      if (row) {
        console.log("Postgres database already initialized.");
      } else {
        console.log("Initializing Supabase Postgres schema...");
        db.exec(schema, (err) => {
          if (err) console.error("Error initializing Postgres:", err.message);
          else console.log("Postgres initialized successfully.");
        });
      }
    }
  );
}

function initializeSQLite() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='books'", (err, row) => {
    if (err) return;
    if (row) console.log("SQLite database already initialized.");
    else {
      db.exec(schema, (err) => {
        if (err) console.error("Error initializing SQLite:", err.message);
        else console.log("SQLite initialized successfully.");
      });
    }
  });
}

module.exports = db;
