const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.join(__dirname, "database", "library.db");
const db = new sqlite3.Database(dbPath);

async function seed() {
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  const userHashedPassword = await bcrypt.hash("User123!", 10);

  db.serialize(() => {
    // Insert Users
    const insertUser = db.prepare(
      "INSERT INTO users (name, email, password_hash, verification_code, role) VALUES (?, ?, ?, ?, ?)"
    );
    insertUser.run("System Admin", "admin@gmail.com", hashedPassword, "ADM123-ABC", "admin");
    insertUser.run("Zayn Library", "user@gmail.com", userHashedPassword, "USR001-XYZ", "user");
    insertUser.finalize();

    // Insert Books
    const books = [
      ["Atomic Habits", "James Clear", "978-0735211292", "Self-Help", 2018, "An easy & proven way to build good habits & break bad ones."],
      ["The Psychology of Money", "Morgan Housel", "978-0857197689", "Finance", 2020, "Doing well with money isn’t necessarily about what you know."],
      ["Clean Code", "Robert C. Martin", "978-0132350884", "Technology", 2008, "A Handbook of Agile Software Craftsmanship."],
      ["Deep Work", "Cal Newport", "978-1455586691", "Productivity", 2016, "Rules for Focused Success in a Distracted World."],
      ["The Alchemist", "Paulo Coelho", "978-0062315007", "Fiction", 1988, "A fable about following your dream."],
      ["Sapiens", "Yuval Noah Harari", "978-0062316091", "History", 2011, "A Brief History of Humankind."],
      ["The 5 AM Club", "Robin Sharma", "978-1443456623", "Self-Help", 2018, "Own Your Morning. Elevate Your Life."],
      ["Thinking, Fast and Slow", "Daniel Kahneman", "978-0374275631", "Psychology", 2011, "The two systems that drive the way we think."],
      ["The Midnight Library", "Matt Haig", "978-0525559474", "Fiction", 2020, "A novel about all the choices that go into a life well lived."],
      ["Can't Hurt Me", "David Goggins", "978-1544512280", "Biography", 2018, "Master Your Mind and Defy the Odds."]
    ];

    const insertBook = db.prepare(
      "INSERT INTO books (title, author, isbn, genre, publication_year, description) VALUES (?, ?, ?, ?, ?, ?)"
    );
    books.forEach((book) => insertBook.run(...book));
    insertBook.finalize();

    // Insert Initial Activities
    const insertActivity = db.prepare("INSERT INTO activities (description) VALUES (?)");
    insertActivity.run("System re-initialized with fresh audit dataset.");
    insertActivity.run("Admin account created.");
    insertActivity.finalize();

    console.log("Database seeded successfully!");
  });
}

seed().catch(console.error);
