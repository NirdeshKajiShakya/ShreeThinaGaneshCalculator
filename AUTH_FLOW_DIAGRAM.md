# Authentication Flow Diagram

## 🔄 User Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    New User Journey                          │
└─────────────────────────────────────────────────────────────┘

1. User visits → http://localhost:3000/
                 ↓
2. Not logged in? → Redirect to /login.html
                 ↓
3. Click "Sign Up" → /signup.html
                 ↓
4. Fill form:
   - Full Name
   - Email
   - Password
   - Confirm Password
   - Accept Terms
                 ↓
5. Submit → POST /api/auth/signup
                 ↓
6. Account Created ✅
   - User stored in database (is_admin = false)
   - Token generated
   - Auto login
                 ↓
7. Redirect → http://localhost:3000/
                 ↓
8. Access granted! 🎉
   - Can view jewelry
   - Can use calculator
   - Cannot add/edit/delete jewelry
```

## 🔐 Admin Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Login Journey                       │
└─────────────────────────────────────────────────────────────┘

1. Run command → npm run create-admin
                 ↓
2. Enter details:
   - Full Name
   - Email
   - Password
                 ↓
3. Admin Created ✅
   - User stored in database (is_admin = true)
                 ↓
4. Visit → http://localhost:3000/admin-login.html
                 ↓
5. Enter credentials
                 ↓
6. Submit → POST /api/auth/admin-login
                 ↓
7. Verify is_admin = true
                 ↓
8. Login successful ✅
   - Admin token generated
   - isAdmin flag set
                 ↓
9. Redirect → http://localhost:3000/
                 ↓
10. Full Access! 🎉
    - Can view jewelry
    - Can use calculator
    - Can add/edit/delete jewelry
    - See "Add New Jewelry" button
    - See Edit/Delete buttons on items
```

## 📱 Page Access Control

```
┌────────────────────────────────────────────────────────────────┐
│                     Route Protection                           │
└────────────────────────────────────────────────────────────────┘

PUBLIC PAGES (No auth required)
├── /login.html          → Login page
├── /signup.html         → Registration page
└── /admin-login.html    → Admin login page

PROTECTED PAGES (Auth required)
└── /index.html          → Main application
                          ↓
                    Check if logged in
                          ↓
                    No → Redirect to /login.html
                          ↓
                    Yes → Load application
                          ↓
                    Check if admin
                          ↓
            ┌───────────┴───────────┐
            ↓                       ↓
        is_admin = false       is_admin = true
            ↓                       ↓
    REGULAR USER VIEW          ADMIN VIEW
    ├── View jewelry           ├── View jewelry
    ├── Use calculator         ├── Use calculator
    ├── View prices            ├── View prices
    └── [Add Jewelry HIDDEN]   ├── [Add Jewelry VISIBLE]
                               ├── [Edit buttons VISIBLE]
                               └── [Delete buttons VISIBLE]
```

## 🔌 API Request Flow

```
┌────────────────────────────────────────────────────────────────┐
│              API Request with Authentication                   │
└────────────────────────────────────────────────────────────────┘

Example: Adding a new jewelry item

1. User clicks "Add New Jewelry" button
                 ↓
2. Fills out form and submits
                 ↓
3. Frontend JavaScript:
   const token = localStorage.getItem('token');
   fetch('/api/jewelry', {
       method: 'POST',
       headers: {
           'Authorization': `Bearer ${token}`
       },
       body: formData
   })
                 ↓
4. Backend receives request
                 ↓
5. Middleware: requireAuth
   - Extract token from Authorization header
   - Verify token is valid
   - Decode user info
                 ↓
   ┌─────────────┴─────────────┐
   ↓                           ↓
Invalid/Missing           Valid Token
   ↓                           ↓
Return 401              Continue to requireAdmin
"Authentication              ↓
required"              Check if user.isAdmin === true
                             ↓
               ┌─────────────┴─────────────┐
               ↓                           ↓
           is_admin = false           is_admin = true
               ↓                           ↓
          Return 403                  Process request
          "Admin access                    ↓
          required"                   Add jewelry to DB
                                           ↓
                                      Return success ✅
```

## 💾 Data Storage

```
┌────────────────────────────────────────────────────────────────┐
│                   User Session Storage                         │
└────────────────────────────────────────────────────────────────┘

When user logs in successfully:

localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify({
    id: 1,
    fullName: "John Doe",
    email: "john@example.com",
    isAdmin: false
}));
localStorage.setItem('isAdmin', 'false');

┌───────────────────────────────────┐
│         localStorage              │
├───────────────────────────────────┤
│ token: "eyJhbGc..."               │
│ user: "{id:1,fullName:..."        │
│ isAdmin: "false"                  │
└───────────────────────────────────┘

Used for:
✅ Maintaining login state
✅ Making authenticated API calls
✅ Showing/hiding UI elements
✅ Displaying user name
```

## 🎨 UI State Changes

```
┌────────────────────────────────────────────────────────────────┐
│                UI Elements by User Role                        │
└────────────────────────────────────────────────────────────────┘

HEADER
┌─────────────────────────────────────────────────────────┐
│ 🪙✨ Nepal Gold & Silver Jewelry Calculator             │
│                                                         │
│ Regular User:                                           │
│ └─ Welcome, John Doe [Logout]                          │
│                                                         │
│ Admin User:                                             │
│ └─ Welcome, Admin Name (Admin) [Logout]                │
└─────────────────────────────────────────────────────────┘

INVENTORY CONTROLS
┌─────────────────────────────────────────────────────────┐
│ Regular User:                                           │
│ [🔄 Refresh]                                            │
│                                                         │
│ Admin User:                                             │
│ [➕ Add New Jewelry]  [🔄 Refresh]                      │
└─────────────────────────────────────────────────────────┘

JEWELRY CARD
┌─────────────────────────────────────────────────────────┐
│ Regular User:                                           │
│ ┌───────────────┐                                       │
│ │   💍 Ring     │                                       │
│ │   2.5 tola    │                                       │
│ │   NPR 35,000  │                                       │
│ └───────────────┘                                       │
│                                                         │
│ Admin User:                                             │
│ ┌───────────────┐                                       │
│ │   💍 Ring     │                                       │
│ │   2.5 tola    │                                       │
│ │   NPR 35,000  │                                       │
│ │ [Edit] [Delete]                                       │
│ └───────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## 🚨 Error Handling

```
┌────────────────────────────────────────────────────────────────┐
│                   Error Response Flow                          │
└────────────────────────────────────────────────────────────────┘

API Request
    ↓
┌───────────────────────┐
│  Token missing/invalid │
│  → 401 Unauthorized    │
└───────────────────────┘
    ↓
Show error: "Please log in to continue"
    ↓
Redirect to /login.html after 1 second

OR

API Request
    ↓
┌───────────────────────┐
│ User not admin        │
│ → 403 Forbidden       │
└───────────────────────┘
    ↓
Show error: "Admin access required"
    ↓
Stay on page (user sees error)
```

## 🔄 Complete User Journey

```
START
  ↓
Visit website
  ↓
Not logged in? → Go to login page
  ↓
New user? → Sign up
  ↓
Create account
  ↓
Auto login
  ↓
View main app
  ↓
Browse jewelry ✅
  ↓
Use calculator ✅
  ↓
Try to add jewelry
  ↓
Is admin?
  ├─ No → Button not visible
  └─ Yes → Can add jewelry ✅
  ↓
Use app...
  ↓
Click logout
  ↓
Clear session
  ↓
Redirect to login
  ↓
END
```
