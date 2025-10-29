// Authentication helper functions

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Check if user is admin
function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login.html';
}

// Redirect to login if not authenticated (for protected pages)
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Redirect to home if already logged in (for auth pages)
function redirectIfLoggedIn() {
    if (isLoggedIn()) {
        window.location.href = '/';
        return true;
    }
    return false;
}

// Get auth headers for API calls
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Make authenticated API call
async function authenticatedFetch(url, options = {}) {
    const headers = {
        ...getAuthHeaders(),
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return response;
}
