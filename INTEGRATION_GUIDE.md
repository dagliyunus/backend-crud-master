# Integration Guide

## Database ↔ Backend ↔ Frontend Integration

This document explains how the three layers of the application are integrated.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  (HTML/CSS/JavaScript - src/frontend/)                   │
│  - User Interface                                        │
│  - API Calls via fetch()                                │
│  - State Management                                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Requests (REST API)
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Backend Layer                         │
│  (Node.js/Express - src/)                                │
│  - API Routes (routes/)                                  │
│  - Business Logic (controllers/)                         │
│  - Data Access (models/)                                 │
│  - Static File Serving (frontend/)                       │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Queries
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Database Layer                          │
│  (PostgreSQL)                                           │
│  - Tables: users, posts                                  │
│  - Schema: src/config/schema.sql                        │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Flow

### 1. Frontend → Backend Communication

**Location**: `src/frontend/app.js`

The frontend makes HTTP requests to the backend API using the `fetch()` API:

```javascript
// Example: User Registration
const response = await fetch('http://localhost:8000/api/v1/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
});
```

**API Endpoints Used**:
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/posts/create` - Create post
- `GET /api/v1/posts/getPosts` - Get all posts
- `PATCH /api/v1/posts/update/:id` - Update post
- `DELETE /api/v1/posts/delete/:id` - Delete post

### 2. Backend → Database Communication

**Location**: `src/models/`

The backend uses the `pg` library to execute SQL queries:

```javascript
// Example: Create User
const result = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [username, email, hashedPassword]
);
```

**Database Connection**: `src/config/database.js`
- Creates PostgreSQL connection pool
- Auto-initializes schema on startup
- Exports pool for use in models

### 3. Static File Serving

**Location**: `src/app.js`

The Express server serves the frontend files:

```javascript
app.use(express.static(join(__dirname, 'frontend')));
```

This allows:
- `http://localhost:8000/` → Serves `index.html`
- `http://localhost:8000/styles.css` → Serves CSS
- `http://localhost:8000/app.js` → Serves JavaScript

---

## Data Flow Examples

### Example 1: User Registration

1. **Frontend** (`app.js`):
   - User fills registration form
   - `handleRegister()` collects form data
   - Sends POST request to `/api/v1/users/register`

2. **Backend** (`routes/user.route.js` → `controllers/user.controller.js`):
   - Route receives request
   - Controller validates input
   - Calls `User.create()` from model

3. **Database** (`models/user.model.js`):
   - Hashes password with bcrypt
   - Executes SQL INSERT query
   - Returns created user data

4. **Response Chain**:
   - Database → Model → Controller → Route → Frontend
   - Frontend displays success message
   - UI switches to login form

### Example 2: Create Post

1. **Frontend** (`app.js`):
   - User clicks "Create New Post"
   - Modal opens with form
   - `handlePostSubmit()` sends POST to `/api/v1/posts/create`

2. **Backend** (`routes/post.route.js` → `controllers/post.controller.js`):
   - Route receives request
   - Controller validates data (name, description, age)
   - Calls `Post.create()` from model

3. **Database** (`models/post.model.js`):
   - Executes SQL INSERT query
   - Returns created post with ID and timestamps

4. **Response Chain**:
   - Database → Model → Controller → Route → Frontend
   - Frontend reloads posts list
   - New post appears in UI

---

## Key Integration Points

### CORS Configuration
**File**: `src/app.js`
```javascript
app.use(cors()); // Allows frontend to make cross-origin requests
```

### API Base URL
**File**: `src/frontend/app.js`
```javascript
const API_BASE_URL = window.location.origin; // Automatically uses current server
const API_URL = `${API_BASE_URL}/api/v1`;
```

### Database Schema Initialization
**File**: `src/config/database.js`
- Automatically runs `schema.sql` on first connection
- Creates tables and indexes if they don't exist

### Error Handling
- **Frontend**: Catches errors and displays user-friendly messages
- **Backend**: Returns error responses with status codes
- **Database**: Throws errors for invalid operations

---

## Testing the Integration

### 1. Start the Server
```bash
npm start
```

### 2. Verify Database Connection
Check console for:
```
PostgreSQL connected successfully
Database schema initialized
```

### 3. Access Frontend
Open browser: `http://localhost:8000`

### 4. Test Flow
1. Register a new user
2. Login with credentials
3. Create a post
4. Edit the post
5. Delete the post
6. Logout

---

## Troubleshooting

### Frontend not loading?
- Check that `src/frontend/` folder exists
- Verify static file path in `app.js`
- Check browser console for errors

### API requests failing?
- Verify backend is running on correct port
- Check CORS is enabled in `app.js`
- Verify API endpoints match in `app.js` and routes

### Database errors?
- Check PostgreSQL is running
- Verify `.env` file has correct `DATABASE_URL`
- Check database exists and is accessible

---

## File Structure Reference

```
src/
├── frontend/              # Frontend files (served as static)
│   ├── index.html        # Main HTML structure
│   ├── styles.css        # All styling
│   └── app.js            # Frontend logic & API calls
│
├── config/               # Configuration
│   ├── database.js      # PostgreSQL connection
│   └── schema.sql       # Database schema
│
├── models/              # Data access layer
│   ├── user.model.js    # User database operations
│   └── post.model.js    # Post database operations
│
├── controllers/         # Business logic
│   ├── user.controller.js
│   └── post.controller.js
│
├── routes/             # API route definitions
│   ├── user.route.js
│   └── post.route.js
│
├── app.js              # Express app setup
└── index.js            # Server entry point
```

---

## Summary

The integration follows a clean three-tier architecture:

1. **Frontend** handles user interaction and makes API calls
2. **Backend** processes requests, validates data, and calls models
3. **Database** stores and retrieves data using SQL queries

All layers are properly connected and communicate through well-defined interfaces (HTTP for frontend-backend, SQL for backend-database).
