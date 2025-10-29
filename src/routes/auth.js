const express = require('express');
const crypto = require('crypto');
const db = require('../database');

const router = express.Router();

// Simple password hashing (in production, use bcrypt)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate a simple JWT-like token
function generateToken(userId, email, isAdmin = false) {
    const payload = {
        userId,
        email,
        isAdmin,
        timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Verify token
function verifyToken(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        // Token expires after 7 days
        if (Date.now() - payload.timestamp > 7 * 24 * 60 * 60 * 1000) {
            return null;
        }
        return payload;
    } catch (error) {
        return null;
    }
}

// Middleware to check authentication
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = payload;
    next();
}

// Middleware to check admin access
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Sign up route
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const checkQuery = process.env.DATABASE_URL
        ? 'SELECT id FROM users WHERE email = $1'
        : 'SELECT id FROM users WHERE email = ?';

    db.get(checkQuery, [email.toLowerCase()], (err, existingUser) => {
        if (err) {
            console.error('Error checking existing user:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = hashPassword(password);

        // Insert new user
        const insertQuery = process.env.DATABASE_URL
            ? `INSERT INTO users (full_name, email, password, is_admin) 
               VALUES ($1, $2, $3, $4) RETURNING id`
            : `INSERT INTO users (full_name, email, password, is_admin) 
               VALUES (?, ?, ?, ?)`;

        db.run(insertQuery, [fullName, email.toLowerCase(), hashedPassword, false], function(err) {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ error: 'Failed to create account' });
            }

            const userId = this.lastID;
            const token = generateToken(userId, email, false);

            res.json({
                message: 'Account created successfully',
                token,
                user: {
                    id: userId,
                    fullName,
                    email: email.toLowerCase(),
                    isAdmin: false
                }
            });
        });
    });
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = hashPassword(password);

    const query = process.env.DATABASE_URL
        ? 'SELECT id, full_name, email, is_admin FROM users WHERE email = $1 AND password = $2'
        : 'SELECT id, full_name, email, is_admin FROM users WHERE email = ? AND password = ?';

    db.get(query, [email.toLowerCase(), hashedPassword], (err, user) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user.id, user.email, user.is_admin);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                isAdmin: user.is_admin
            }
        });
    });
});

// Admin login route
router.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = hashPassword(password);

    const query = process.env.DATABASE_URL
        ? 'SELECT id, full_name, email, is_admin FROM users WHERE email = $1 AND password = $2 AND is_admin = true'
        : 'SELECT id, full_name, email, is_admin FROM users WHERE email = ? AND password = ? AND is_admin = 1';

    db.get(query, [email.toLowerCase(), hashedPassword], (err, user) => {
        if (err) {
            console.error('Error logging in as admin:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const token = generateToken(user.id, user.email, true);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                isAdmin: true
            }
        });
    });
});

// Verify token route
router.get('/verify', requireAuth, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Logout route (client-side handles token removal)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = { router, requireAuth, requireAdmin };
