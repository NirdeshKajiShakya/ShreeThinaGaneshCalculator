require('dotenv').config();

// Determine if we're using PostgreSQL (production) or SQLite (development)
// Only use PostgreSQL if DATABASE_URL is explicitly set
const usePostgres = !!process.env.DATABASE_URL;

let db;

if (usePostgres) {
    // PostgreSQL setup for production/deployment
    const { Pool } = require('pg');
    
    console.log('🔌 Connecting to PostgreSQL database...');
    
    // Parse connection string to extract host
    let poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    };

    // For Supabase compatibility: Add connection pooling optimizations
    if (process.env.DATABASE_URL?.includes('supabase.com')) {
        console.log('🔵 Detected Supabase database');
        console.log('💡 TIP: Use Supabase Connection Pooler (Session mode) for IPv4 compatibility');
        console.log('💡 Format: postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres');
        
        // Add pgbouncer mode for connection pooling
        poolConfig.connectionTimeoutMillis = 5000;
        poolConfig.max = 20; // Limit connections for serverless
    }
    
    const pool = new Pool(poolConfig);

    // Initialize PostgreSQL tables
    const initPostgres = async () => {
        try {
            // Test connection first
            await pool.query('SELECT NOW()');
            console.log('✅ PostgreSQL connection successful');
            
            // Create users table
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    full_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    is_admin BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create jewelry table
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
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_metal_type ON jewelry(metal_type)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_created_at ON jewelry(created_at)`);

            console.log('✅ PostgreSQL database initialized');
        } catch (error) {
            console.error('❌ Error initializing PostgreSQL:', error.message);
            
            // Specific error handling for IPv6 issues
            if (error.code === 'ENETUNREACH' && error.message.includes('2406:')) {
                console.error('');
                console.error('🔴 IPv6 CONNECTION ERROR DETECTED!');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('📌 You are using Supabase with Render');
                console.error('📌 Render does NOT support IPv6 connections');
                console.error('');
                console.error('✅ SOLUTION: Use Supabase Connection Pooler');
                console.error('');
                console.error('1. Go to Supabase Dashboard → Settings → Database');
                console.error('2. Find "Connection string" section');
                console.error('3. Select "Session mode" (NOT Direct connection)');
                console.error('4. Copy the pooler URL - should look like:');
                console.error('   postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres');
                console.error('');
                console.error('5. Update DATABASE_URL on Render with the pooler URL');
                console.error('6. Make sure it has:');
                console.error('   ✓ pooler.supabase.com (not just supabase.co)');
                console.error('   ✓ Port 6543 (not 5432)');
                console.error('');
                console.error('📚 Full guide: See SUPABASE_RENDER_FIX.md');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('');
            } else {
                console.error('💡 SOLUTION: Use the INTERNAL Database URL from Render, not External!');
                console.error('💡 Internal URL format: postgresql://user:pass@dpg-xxxxx-a.region.render.com/dbname');
                console.error('💡 Find it in: Render Dashboard → Your Database → Connections → Internal Database URL');
            }
            
            // Don't throw - let the app continue running
        }
    };

    // Initialize asynchronously without blocking app startup
    initPostgres().catch(err => {
        console.error('💥 PostgreSQL initialization failed, but app will continue running');
    });

    // Wrapper to make PostgreSQL compatible with SQLite-style callbacks
    db = {
        all: (query, params, callback) => {
            pool.query(query, params)
                .then(result => callback(null, result.rows))
                .catch(err => {
                    console.error('❌ Database query error:', err.message);
                    callback(err);
                });
        },
        get: (query, params, callback) => {
            pool.query(query, params)
                .then(result => callback(null, result.rows[0]))
                .catch(err => {
                    console.error('❌ Database query error:', err.message);
                    callback(err);
                });
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
                    console.error('❌ Database query error:', err.message);
                    if (callback) callback(err);
                });
        },
        query: pool.query.bind(pool) // Direct access to pool.query for raw queries
    };

    console.log('📦 PostgreSQL database wrapper ready (awaiting connection...)');

} else {
    // SQLite setup for local development
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');

    const dbPath = path.join(__dirname, '../jewelry.db');
    const sqliteDb = new sqlite3.Database(dbPath);

    // Initialize SQLite database tables
    sqliteDb.serialize(() => {
        // Create users table
        sqliteDb.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_admin INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create jewelry table
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
        sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_metal_type ON jewelry(metal_type)`);
        sqliteDb.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON jewelry(created_at)`);
    });

    db = sqliteDb;
    console.log('✅ SQLite database initialized (local development)');
}

module.exports = db;