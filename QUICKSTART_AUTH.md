# Quick Start - Authentication System

## 🚀 Getting Started with Login & Admin Features

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Your First Admin User
```bash
npm run create-admin
```

Follow the prompts:
- Enter admin full name
- Enter admin email
- Enter admin password (minimum 6 characters)

### Step 3: Start the Server
```bash
npm start
```

### Step 4: Access the Application

**For Admin Users:**
1. Open: http://localhost:3000/admin-login.html
2. Login with your admin credentials
3. You can now add, edit, and delete jewelry items

**For Regular Users:**
1. Open: http://localhost:3000/signup.html
2. Create a new account
3. You'll be logged in automatically

**Main Application:**
- Open: http://localhost:3000/
- If not logged in, you'll be redirected to the login page

## 🔑 User Roles

### Regular Users Can:
- ✅ View jewelry inventory
- ✅ Use price calculator
- ✅ View price history
- ❌ Cannot add/edit/delete jewelry

### Admin Users Can:
- ✅ Everything regular users can do
- ✅ Add new jewelry items
- ✅ Edit existing jewelry
- ✅ Delete jewelry items

## 📁 Important Files

- `/login.html` - User login page
- `/signup.html` - User registration page
- `/admin-login.html` - Admin login page
- `/src/routes/auth.js` - Authentication routes
- `create-admin.js` - Script to create admin users

## 📚 Full Documentation

See [AUTH_GUIDE.md](AUTH_GUIDE.md) for complete documentation including:
- API endpoints
- Security features
- Database schema
- Frontend integration
- Troubleshooting
- Production recommendations
