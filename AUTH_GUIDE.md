# Authentication System Guide

This jewelry calculator now includes a complete user authentication system with role-based access control.

## Features

### User Roles
1. **Regular Users** - Can view jewelry inventory and use the calculator
2. **Admin Users** - Full access including adding, editing, and deleting jewelry items

## Authentication Pages

### 1. Login Page (`/login.html`)
- Standard user login
- Email and password authentication
- "Remember me" option
- Link to sign up and admin login pages

### 2. Sign Up Page (`/signup.html`)
- Create new user accounts
- Required fields: Full Name, Email, Password
- Password confirmation
- Terms and conditions checkbox
- Automatic login after successful registration

### 3. Admin Login Page (`/admin-login.html`)
- Dedicated login for administrators
- Only users with admin privileges can access
- Enhanced security with admin-specific authentication

## Getting Started

### Creating the First Admin User

1. Make sure your server is running or database is accessible
2. Run the admin creation script:
   ```bash
   npm run create-admin
   ```
3. Follow the prompts to enter:
   - Full name
   - Email address
   - Password (minimum 6 characters)

### User Registration

Regular users can sign up through the sign-up page:
1. Navigate to `/signup.html`
2. Fill in the registration form
3. Click "Create Account"
4. You'll be automatically logged in and redirected to the main app

### Login Process

**For Regular Users:**
1. Navigate to `/login.html`
2. Enter your email and password
3. Optionally check "Remember me"
4. Click "Login"

**For Admins:**
1. Navigate to `/admin-login.html`
2. Enter your admin email and password
3. Click "Admin Login"

## Access Control

### Protected Features

#### Admin Only:
- ✅ Add new jewelry items
- ✅ Edit existing jewelry items
- ✅ Delete jewelry items
- ✅ "Add New Jewelry" button is visible only to admins
- ✅ Edit/Delete buttons on jewelry cards visible only to admins

#### All Authenticated Users:
- ✅ View jewelry inventory
- ✅ Use price calculator
- ✅ View price history
- ✅ Refresh prices

### API Endpoints

#### Authentication Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/verify` - Verify token (requires auth)
- `POST /api/auth/logout` - Logout

#### Jewelry Endpoints
- `GET /api/jewelry` - Get all jewelry (public)
- `GET /api/jewelry/:id` - Get single jewelry item (public)
- `POST /api/jewelry` - Add jewelry (requires admin)
- `PUT /api/jewelry/:id` - Update jewelry (requires admin)
- `DELETE /api/jewelry/:id` - Delete jewelry (requires admin)

## Security Features

1. **Password Hashing**: Passwords are hashed using SHA-256 before storage
2. **Token-based Authentication**: JWT-like tokens for session management
3. **Token Expiration**: Tokens expire after 7 days
4. **Role-based Access Control**: Separate permissions for users and admins
5. **Protected Routes**: Admin-only operations are secured at the API level
6. **Client-side Guards**: UI elements are hidden/shown based on user role

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Frontend Integration

### Checking Authentication Status
```javascript
// Check if user is logged in
if (isLoggedIn()) {
    // User is authenticated
}

// Check if user is admin
if (isAdmin()) {
    // User has admin privileges
}

// Get current user info
const user = getCurrentUser();
console.log(user.fullName, user.email, user.isAdmin);
```

### Making Authenticated API Calls
```javascript
// Using the helper function
const response = await authenticatedFetch('/api/jewelry', {
    method: 'POST',
    body: JSON.stringify(data)
});

// Or manually
const token = localStorage.getItem('token');
const response = await fetch('/api/jewelry', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});
```

### Logout
```javascript
// Call logout function
logout(); // Clears storage and redirects to login
```

## Troubleshooting

### Can't Login
- Verify email and password are correct
- Check if the account exists
- Try resetting by creating a new account

### Admin Can't Add Jewelry
- Verify you logged in through `/admin-login.html`
- Check that your account has `is_admin = true` in the database
- Verify the token is being sent with requests

### Token Expired
- Tokens expire after 7 days
- Simply log in again to get a new token

## Production Recommendations

Before deploying to production, consider these improvements:

1. **Use bcrypt** instead of SHA-256 for password hashing
   ```bash
   npm install bcrypt
   ```

2. **Use proper JWT tokens** with signing keys
   ```bash
   npm install jsonwebtoken
   ```

3. **Add rate limiting** to prevent brute force attacks
   ```bash
   npm install express-rate-limit
   ```

4. **Add email verification** for new accounts

5. **Add password reset functionality**

6. **Use HTTPS** in production

7. **Add CSRF protection**

8. **Implement refresh tokens** for better security

9. **Add session management** with Redis

10. **Add audit logging** for admin actions

## Support

For issues or questions about the authentication system, please check:
- Database connection is working
- All required npm packages are installed
- Environment variables are set correctly
- Tables are created in the database

## License

This authentication system is part of the Shree Thina Ganesh Calculator project.
