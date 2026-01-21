import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory path for serving static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();  // Create an Express application instance

// Enable CORS to allow frontend to communicate with backend
// This allows requests from any origin (in production, specify your frontend URL)
app.use(cors());

// Parse JSON request bodies - this middleware allows Express to understand JSON data sent from frontend
app.use(express.json());

// Serve static files from the frontend directory
// This allows the backend to serve HTML, CSS, and JavaScript files
app.use(express.static(join(__dirname, 'frontend')));

// Import route handlers - these contain the logic for handling API requests
import userRouter from './routes/user.route.js';
import postRouter from './routes/post.route.js';

// Mount API routes - these define the endpoints that the frontend will call
// All user-related endpoints will be prefixed with /api/v1/users
app.use("/api/v1/users", userRouter);
// All post-related endpoints will be prefixed with /api/v1/posts
app.use("/api/v1/posts", postRouter);

// Example API route: http://localhost:8000/api/v1/users/register
// Frontend will be served at: http://localhost:8000/

export default app;