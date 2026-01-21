/* ============================================
   API Configuration and Constants
   ============================================ */

// Base URL for API endpoints - this is where our backend server is running
// In production, this would be your actual server URL
const API_BASE_URL = window.location.origin; // Uses current origin (localhost:8000 or production URL)
const API_URL = `${API_BASE_URL}/api/v1`; // Full API base path

// API endpoint paths - these match the routes defined in the backend
const API_ENDPOINTS = {
    // User-related endpoints
    register: `${API_URL}/users/register`, // POST - Register a new user
    login: `${API_URL}/users/login`, // POST - Login existing user
    logout: `${API_URL}/users/logout`, // POST - Logout user
    
    // Post-related endpoints
    createPost: `${API_URL}/posts/create`, // POST - Create a new post
    getPosts: `${API_URL}/posts/getPosts`, // GET - Get all posts
    updatePost: (id) => `${API_URL}/posts/update/${id}`, // PATCH - Update post by ID
    deletePost: (id) => `${API_URL}/posts/delete/${id}`, // DELETE - Delete post by ID
};

/* ============================================
   State Management
   ============================================ */

// Store current user information after login
let currentUser = null;

// Store all posts in memory for quick access
let posts = [];

/* ============================================
   DOM Element References
   ============================================ */

// Get references to important DOM elements so we can manipulate them
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const postModal = document.getElementById('postModal');
const postForm = document.getElementById('postForm');
const postsList = document.getElementById('postsList');
const messageContainer = document.getElementById('messageContainer');
const currentUsername = document.getElementById('currentUsername');
const currentUserEmail = document.getElementById('currentUserEmail');
const createPostBtn = document.getElementById('createPostBtn');
const logoutBtn = document.getElementById('logoutBtn');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');

/* ============================================
   Utility Functions
   ============================================ */

/**
 * Display a message notification to the user
 * @param {string} message - The message text to display
 * @param {string} type - Type of message: 'success' or 'error'
 */
function showMessage(message, type = 'success') {
    // Create a new message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`; // Add CSS classes for styling
    
    // Add an icon based on message type
    const icon = type === 'success' ? '✓' : '✕';
    messageEl.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    // Add the message to the container
    messageContainer.appendChild(messageEl);
    
    // Automatically remove the message after 5 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideInRight 0.3s ease reverse'; // Reverse animation
        setTimeout(() => {
            messageEl.remove(); // Remove from DOM
        }, 300);
    }, 5000);
}

/**
 * Make an HTTP request to the API
 * @param {string} url - The API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} data - Optional data to send in request body
 * @returns {Promise} - Promise that resolves with response data
 */
async function apiRequest(url, method = 'GET', data = null) {
    try {
        // Configure the fetch request options
        const options = {
            method: method, // HTTP method
            headers: {
                'Content-Type': 'application/json', // Tell server we're sending JSON
            },
        };
        
        // Add request body if data is provided (for POST, PATCH requests)
        if (data) {
            options.body = JSON.stringify(data); // Convert object to JSON string
        }
        
        // Make the HTTP request to the backend API
        const response = await fetch(url, options);
        
        // Parse the JSON response from the server
        const result = await response.json();
        
        // Check if the request was successful (status 200-299)
        if (!response.ok) {
            // If not successful, throw an error with the message from server
            throw new Error(result.message || 'An error occurred');
        }
        
        // Return the successful response data
        return result;
    } catch (error) {
        // If anything goes wrong, throw the error so calling code can handle it
        throw error;
    }
}

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string from database
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    // Create a Date object from the string
    const date = new Date(dateString);
    
    // Format as: "Jan 21, 2025"
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/* ============================================
   Authentication Functions
   ============================================ */

/**
 * Handle user registration
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
    event.preventDefault(); // Prevent form from submitting normally (page refresh)
    
    try {
        // Get form input values
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        
        // Validate that all fields are filled
        if (!username || !email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        // Make API request to register the user
        const response = await apiRequest(API_ENDPOINTS.register, 'POST', {
            username,
            email,
            password,
        });
        
        // If registration successful, show success message and switch to login
        showMessage(response.message || 'Registration successful!', 'success');
        
        // Clear the form
        registerFormElement.reset();
        
        // Switch to login tab after a short delay
        setTimeout(() => {
            switchTab('login');
        }, 1500);
    } catch (error) {
        // If registration fails, show error message
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
    }
}

/**
 * Handle user login
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    event.preventDefault(); // Prevent form from submitting normally
    
    try {
        // Get form input values
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Validate that both fields are filled
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        // Make API request to login the user
        const response = await apiRequest(API_ENDPOINTS.login, 'POST', {
            email,
            password,
        });
        
        // Store user information in memory
        currentUser = response.user;
        
        // Update the UI to show user information
        currentUsername.textContent = currentUser.username;
        currentUserEmail.textContent = currentUser.email;
        
        // Show success message
        showMessage(response.message || 'Login successful!', 'success');
        
        // Switch to the main application view
        showAppSection();
        
        // Load all posts for the logged-in user
        await loadPosts();
    } catch (error) {
        // If login fails, show error message
        showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        // Make API request to logout (if backend requires it)
        // Even if it fails, we'll still log out on the frontend
        try {
            await apiRequest(API_ENDPOINTS.logout, 'POST', {
                email: currentUser?.email
            });
        } catch (error) {
            // Ignore logout API errors, still log out locally
            console.log('Logout API call failed, but logging out locally');
        }
        
        // Clear user data from memory
        currentUser = null;
        posts = [];
        
        // Show success message
        showMessage('Logged out successfully', 'success');
        
        // Switch back to authentication view
        showAuthSection();
    } catch (error) {
        // Even if logout fails, clear local state
        currentUser = null;
        posts = [];
        showAuthSection();
    }
}

/* ============================================
   UI State Management
   ============================================ */

/**
 * Show the authentication section (login/register)
 */
function showAuthSection() {
    authSection.classList.remove('hidden'); // Show auth section
    appSection.classList.add('hidden'); // Hide app section
    loginFormElement.reset(); // Clear login form
    registerFormElement.reset(); // Clear register form
}

/**
 * Show the main application section (posts management)
 */
function showAppSection() {
    authSection.classList.add('hidden'); // Hide auth section
    appSection.classList.remove('hidden'); // Show app section
}

/**
 * Switch between login and register tabs
 * @param {string} tab - Tab to show: 'login' or 'register'
 */
function switchTab(tab) {
    // Remove active class from all tabs and forms
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    
    // Add active class to selected tab
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Show corresponding form
    if (tab === 'login') {
        loginForm.classList.add('active');
    } else {
        registerForm.classList.add('active');
    }
}

/* ============================================
   Post Management Functions
   ============================================ */

/**
 * Load all posts from the API and display them
 */
async function loadPosts() {
    try {
        // Show loading message
        postsList.innerHTML = '<div class="loading-message">Loading posts...</div>';
        
        // Make API request to get all posts
        const response = await apiRequest(API_ENDPOINTS.getPosts, 'GET');
        
        // Store posts in memory
        posts = Array.isArray(response) ? response : [];
        
        // Display the posts
        displayPosts();
    } catch (error) {
        // If loading fails, show error message
        postsList.innerHTML = `<div class="empty-state">Error loading posts: ${error.message}</div>`;
        showMessage('Failed to load posts', 'error');
    }
}

/**
 * Display all posts in the UI
 */
function displayPosts() {
    // If no posts exist, show empty state message
    if (posts.length === 0) {
        postsList.innerHTML = '<div class="empty-state">No posts yet. Create your first post!</div>';
        return;
    }
    
    // Create HTML for each post card
    postsList.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-card-header">
                <div>
                    <div class="post-name">${escapeHtml(post.name)}</div>
                </div>
            </div>
            <div class="post-description">${escapeHtml(post.description)}</div>
            <div class="post-meta">
                <span class="post-age">Age: ${post.age}</span>
                <span class="post-date">${formatDate(post.created_at)}</span>
            </div>
            <div class="post-actions">
                <button class="btn btn-primary" onclick="editPost(${post.id})">Edit</button>
                <button class="btn btn-danger" onclick="deletePost(${post.id})">Delete</button>
            </div>
        </div>
    `).join(''); // Join all HTML strings into one
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text; // This automatically escapes HTML
    return div.innerHTML;
}

/**
 * Open the modal to create a new post
 */
function openCreatePostModal() {
    // Reset form and set title
    postForm.reset();
    document.getElementById('postId').value = ''; // Clear post ID
    modalTitle.textContent = 'Create New Post';
    postModal.classList.remove('hidden'); // Show modal
}

/**
 * Open the modal to edit an existing post
 * @param {number} postId - ID of the post to edit
 */
function editPost(postId) {
    // Find the post in our posts array
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        showMessage('Post not found', 'error');
        return;
    }
    
    // Fill form with post data
    document.getElementById('postId').value = post.id;
    document.getElementById('postName').value = post.name;
    document.getElementById('postDescription').value = post.description;
    document.getElementById('postAge').value = post.age;
    
    // Update modal title
    modalTitle.textContent = 'Edit Post';
    
    // Show modal
    postModal.classList.remove('hidden');
}

/**
 * Handle form submission for creating or updating a post
 * @param {Event} event - Form submit event
 */
async function handlePostSubmit(event) {
    event.preventDefault(); // Prevent form from submitting normally
    
    try {
        // Get form values
        const postId = document.getElementById('postId').value;
        const name = document.getElementById('postName').value.trim();
        const description = document.getElementById('postDescription').value.trim();
        const age = parseInt(document.getElementById('postAge').value);
        
        // Validate inputs
        if (!name || !description || !age) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (age < 1 || age > 150) {
            showMessage('Age must be between 1 and 150', 'error');
            return;
        }
        
        // Determine if we're creating or updating
        const isUpdate = postId !== '';
        
        if (isUpdate) {
            // Update existing post
            await apiRequest(API_ENDPOINTS.updatePost(postId), 'PATCH', {
                name,
                description,
                age,
            });
            showMessage('Post updated successfully!', 'success');
        } else {
            // Create new post
            await apiRequest(API_ENDPOINTS.createPost, 'POST', {
                name,
                description,
                age,
            });
            showMessage('Post created successfully!', 'success');
        }
        
        // Close modal and reload posts
        closePostModal();
        await loadPosts();
    } catch (error) {
        // If operation fails, show error message
        showMessage(error.message || 'Failed to save post', 'error');
    }
}

/**
 * Delete a post
 * @param {number} postId - ID of the post to delete
 */
async function deletePost(postId) {
    // Ask for confirmation before deleting
    if (!confirm('Are you sure you want to delete this post?')) {
        return; // User cancelled deletion
    }
    
    try {
        // Make API request to delete the post
        await apiRequest(API_ENDPOINTS.deletePost(postId), 'DELETE');
        
        // Show success message
        showMessage('Post deleted successfully!', 'success');
        
        // Reload posts to reflect the deletion
        await loadPosts();
    } catch (error) {
        // If deletion fails, show error message
        showMessage(error.message || 'Failed to delete post', 'error');
    }
}

/**
 * Close the post modal
 */
function closePostModal() {
    postModal.classList.add('hidden'); // Hide modal
    postForm.reset(); // Clear form
}

/* ============================================
   Event Listeners Setup
   ============================================ */

// Set up all event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching for login/register
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab'); // Get which tab was clicked
            switchTab(tab); // Switch to that tab
        });
    });
    
    // Form submissions
    loginFormElement.addEventListener('submit', handleLogin); // Handle login form submit
    registerFormElement.addEventListener('submit', handleRegister); // Handle register form submit
    postForm.addEventListener('submit', handlePostSubmit); // Handle post form submit
    
    // Button clicks
    createPostBtn.addEventListener('click', openCreatePostModal); // Open create post modal
    logoutBtn.addEventListener('click', handleLogout); // Handle logout
    cancelBtn.addEventListener('click', closePostModal); // Close modal on cancel
    
    // Close modal when clicking the X button
    document.querySelector('.close-modal').addEventListener('click', closePostModal);
    
    // Close modal when clicking outside of it
    postModal.addEventListener('click', (event) => {
        if (event.target === postModal) {
            closePostModal(); // Close if clicking the overlay (not the content)
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !postModal.classList.contains('hidden')) {
            closePostModal(); // Close modal when Escape is pressed
        }
    });
    
    // Check if user is already logged in (for page refresh)
    // In a real app, you'd check localStorage or cookies
    // For now, we'll start with the auth section
    showAuthSection();
});

/* ============================================
   Global Functions (for inline onclick handlers)
   ============================================ */

// Make these functions available globally so they can be called from inline onclick handlers
window.editPost = editPost;
window.deletePost = deletePost;
