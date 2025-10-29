require('dotenv').config();
const crypto = require('crypto');
const db = require('./src/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
    console.log('\n=== Create Admin User ===\n');

    const fullName = await question('Enter admin full name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 6 chars): ');

    if (!fullName || !email || !password) {
        console.error('❌ All fields are required!');
        rl.close();
        return;
    }

    if (password.length < 6) {
        console.error('❌ Password must be at least 6 characters long!');
        rl.close();
        return;
    }

    const hashedPassword = hashPassword(password);

    const insertQuery = process.env.DATABASE_URL
        ? `INSERT INTO users (full_name, email, password, is_admin) 
           VALUES ($1, $2, $3, $4) RETURNING id`
        : `INSERT INTO users (full_name, email, password, is_admin) 
           VALUES (?, ?, ?, ?)`;

    // Wait a bit for database initialization
    setTimeout(() => {
        db.run(insertQuery, [fullName, email.toLowerCase(), hashedPassword, true], function(err) {
            if (err) {
                console.error('❌ Error creating admin user:', err.message);
                if (err.message.includes('UNIQUE')) {
                    console.error('   Email already exists!');
                }
            } else {
                console.log('\n✅ Admin user created successfully!');
                console.log(`   ID: ${this.lastID}`);
                console.log(`   Name: ${fullName}`);
                console.log(`   Email: ${email.toLowerCase()}`);
                console.log(`   Admin: Yes`);
                console.log('\n🔐 You can now login at: http://localhost:3000/admin-login.html\n');
            }
            rl.close();
            process.exit(0);
        });
    }, 2000);
}

createAdminUser();
