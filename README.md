# Backend CRUD API

A RESTful API built with Node.js and Express.js for user authentication and post management.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client for Node.js
- **bcrypt** - Password hashing

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

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

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
├── app.js           # Express app setup
└── index.js         # Server entry point
```
