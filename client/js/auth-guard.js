/**
 * Auth Guard - Protects routes from unauthorized access
 * Include this script at the TOP of protected pages (in <head> before other scripts)
 */

(function() {
    'use strict';
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('user');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !user) {
        // Clear any partial auth data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.replace('login.html');
    }
})();

/**
 * Logout function - Call this when user clicks logout
 */
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.replace('login.html');
}

/**
 * Get current user info
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}
