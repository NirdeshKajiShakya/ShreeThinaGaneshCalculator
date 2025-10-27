require('dotenv').config();
const { Pool } = require('pg');

// Determine if we're using PostgreSQL (production) or SQLite (development)
const usePostgres = process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

let db;

if (usePostgres) {
    // PostgreSQL setup for production/deployment
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });

    // Initialize PostgreSQL tables
    const initPostgres = async () => {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS jewelry (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    image_path TEXT,
                    weight REAL NOT NULL,
                    weight_unit TEXT DEFAULT 'tola',
                    working_cost REAL DEFAULT 0,
                    metal_type TEXT DEFAULT 'silver',
                    purity INTEGER DEFAULT 24,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create indexes for better performance
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_metal_type ON jewelry(metal_type)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_created_at ON jewelry(created_at)`);

            console.log('✅ PostgreSQL database initialized');
        } catch (error) {
            console.error('❌ Error initializing PostgreSQL:', error);
        }
    };

    initPostgres();

    // Wrapper to make PostgreSQL compatible with SQLite-style callbacks
    db = {
        all: (query, params, callback) => {
            pool.query(query, params)
                .then(result => callback(null, result.rows))
                .catch(err => callback(err));
        },
        get: (query, params, callback) => {
            pool.query(query, params)
                .then(result => callback(null, result.rows[0]))
                .catch(err => callback(err));
        },
        run: (query, params, callback) => {
            pool.query(query, params)
                .then(result => {
                    if (callback) {
                        // Simulate SQLite's this.lastID and this.changes
                        const context = {
                            lastID: result.rows[0]?.id || null,
                            changes: result.rowCount
                        };
                        callback.call(context, null);
                    }
                })
                .catch(err => {
                    if (callback) callback(err);
                });
        },
        query: pool.query.bind(pool) // Direct access to pool.query for raw queries
    };

} else {
    // SQLite setup for local development
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');

    const dbPath = path.join(__dirname, '../jewelry.db');
    const sqliteDb = new sqlite3.Database(dbPath);

    // Initialize SQLite database tables
    sqliteDb.serialize(() => {
        sqliteDb.run(`
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
        sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_metal_type ON jewelry(metal_type)`);
        sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON jewelry(created_at)`);
    });

    db = sqliteDb;
    console.log('✅ SQLite database initialized (local development)');
}

module.exports = db;