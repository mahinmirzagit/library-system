-- LibroHub Physical Library Management System Database Schema
-- Optimized for B2B Physical Inventory Tracking

-- 1. Book Metadata Table (General information about a book)
CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT,
    publication_year INTEGER,
    description TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Physical Copies Table (Specific instances of books)
CREATE TABLE physical_copies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    copy_uuid TEXT UNIQUE NOT NULL,
    shelf_coordinate TEXT NOT NULL, -- e.g., "A1-B2"
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance')),
    qr_code_data TEXT, -- Base64 or Link to QR
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

-- 3. Users Table (Optimized for QR-based identification)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_qr_code TEXT UNIQUE, -- UUID for badge scanning
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Borrowings Table (Circulation tracking with fine logic)
CREATE TABLE borrowings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    copy_id INTEGER NOT NULL,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (copy_id) REFERENCES physical_copies (id) ON DELETE CASCADE
);

-- 5. Activities Table
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 6. Settings Table (Organizational configurations)
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial Settings
INSERT INTO settings (key, value) VALUES ('daily_fine_rate', '50');
INSERT INTO settings (key, value) VALUES ('default_borrow_days', '14');
INSERT INTO settings (key, value) VALUES ('shelf_format_regex', '^[A-Z][0-9]-[A-Z][0-9]$'); -- Default A1-B2 style

-- Indexes
CREATE INDEX idx_books_isbn ON books (isbn);
CREATE INDEX idx_copies_uuid ON physical_copies (copy_uuid);
CREATE INDEX idx_users_qr ON users (user_qr_code);
CREATE INDEX idx_borrowings_status ON borrowings (status);

-- Triggers for automated timestamps
CREATE TRIGGER update_books_timestamp AFTER UPDATE ON books BEGIN
    UPDATE books SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_copies_timestamp AFTER UPDATE ON physical_copies BEGIN
    UPDATE physical_copies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_users_timestamp AFTER UPDATE ON users BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;