const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'jewelry.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
    // Create jewelry table
    db.run(`
        CREATE TABLE IF NOT EXISTS jewelry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image_path TEXT,
            weight REAL NOT NULL,
            weight_unit TEXT DEFAULT 'tola',
            working_cost REAL DEFAULT 0,
            metal_type TEXT DEFAULT 'silver',
            purity INTEGER DEFAULT 24,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_metal_type ON jewelry(metal_type)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON jewelry(created_at)`);
});

module.exports = db;