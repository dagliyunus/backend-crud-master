# Backend CRUD API with Frontend

A full-stack application with RESTful API built with Node.js and Express.js for user authentication and post management, featuring a modern frontend interface.

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client for Node.js
- **bcrypt** - Password hashing
- **cors** - Cross-origin resource sharing

### Frontend
- **HTML5** - Structure
- **CSS3** - Modern styling with CSS variables
- **Vanilla JavaScript** - Client-side logic and API integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# OR
POSTGRES_URI=postgresql://username:password@localhost:5432/database_name
PORT=8000
```

3. Make sure PostgreSQL is running and create a database:
```sql
CREATE DATABASE your_database_name;
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:8000
```

The frontend will be automatically served by the Express server.

## API Endpoints

### User Routes (`/api/v1/users`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /logout` - Logout user

### Post Routes (`/api/v1/posts`)
- `POST /create` - Create a new post
- `GET /getPosts` - Get all posts
- `PATCH /update/:id` - Update a post by ID
- `DELETE /delete/:id` - Delete a post by ID

## Project Structure

```
src/
├── config/          # Database configuration and schema
├── controllers/     # Route controllers
├── models/          # PostgreSQL models
├── routes/          # API routes
├── frontend/        # Frontend application
│   ├── index.html   # Main HTML file
│   ├── styles.css   # Modern CSS styling
│   └── app.js       # Frontend JavaScript and API integration
├── app.js           # Express app setup
└── index.js         # Server entry point
```

## Features

### Frontend
- **Modern UI Design** - Clean, responsive interface with dark theme
- **User Authentication** - Register, login, and logout functionality
- **Post Management** - Create, read, update, and delete posts
- **Real-time Updates** - Dynamic UI updates after API operations
- **Error Handling** - User-friendly error messages and notifications
- **Responsive Design** - Works on desktop, tablet, and mobile devices

### Backend
- **RESTful API** - Well-structured API endpoints
- **PostgreSQL Database** - Relational database with proper schema
- **Password Security** - Bcrypt hashing for secure password storage
- **Input Validation** - Server-side validation for all inputs
- **CORS Enabled** - Cross-origin requests supported
