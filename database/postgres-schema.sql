-- LibroHub PostgreSQL Database Schema (Supabase Optimized)

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Book Metadata Table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT,
    publication_year INTEGER,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Physical Copies Table
CREATE TABLE IF NOT EXISTS physical_copies (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL,
    copy_uuid TEXT UNIQUE NOT NULL,
    shelf_coordinate TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance')),
    qr_code_data TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_qr_code TEXT UNIQUE,
    verification_code TEXT, -- Legacy support
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    firebase_uid TEXT UNIQUE,
    auth_provider TEXT DEFAULT 'manual',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Borrowings Table
CREATE TABLE IF NOT EXISTS borrowings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    copy_id INTEGER NOT NULL,
    borrow_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_copy FOREIGN KEY (copy_id) REFERENCES physical_copies (id) ON DELETE CASCADE
);

-- 5. Activities Table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    CONSTRAINT fk_user_activity FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Initial Settings
INSERT INTO settings (key, value) VALUES ('daily_fine_rate', '50') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('default_borrow_days', '14') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('shelf_format_regex', '^[A-Z][0-9]-[A-Z][0-9]$') ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books (isbn);
CREATE INDEX IF NOT EXISTS idx_copies_uuid ON physical_copies (copy_uuid);
CREATE INDEX IF NOT EXISTS idx_users_qr ON users (user_qr_code);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON borrowings (status);

-- Automatic Updated_At Trigger Function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_books_modtime ON books;
CREATE TRIGGER update_books_modtime BEFORE UPDATE ON books FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_copies_modtime ON physical_copies;
CREATE TRIGGER update_copies_modtime BEFORE UPDATE ON physical_copies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_borrowings_modtime ON borrowings;
CREATE TRIGGER update_borrowings_modtime BEFORE UPDATE ON borrowings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
