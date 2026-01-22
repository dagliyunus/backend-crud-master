import { pool } from "../config/database.js";
import bcrypt from "bcrypt";

class User {
    static async create({ username, email, password, loggedIn = false }) {
        // Validate
        if (!username || !email || !password) {
            throw new Error("All fields are required");
        }

        if (username.length < 1 || username.length > 25) {
            throw new Error("Username must be between 1 and 25 characters");
        }

        if (password.length < 6 || password.length > 50) {
            throw new Error("Password must be between 6 and 50 characters");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        // Ensure email is lowercase and trimmed for consistency
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedUsername = username.toLowerCase().trim();
        
        const result = await pool.query(
            `INSERT INTO users (username, email, password, logged_in) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email, created_at, updated_at`,
            [normalizedUsername, normalizedEmail, hashedPassword, loggedIn]
        );

        return result.rows[0];
    }

    static async findOne({ email, username, id }) {
        let query = 'SELECT * FROM users WHERE ';
        let params = [];
        let paramCount = 1;

        if (id) {
            query += `id = $${paramCount}`;
            params.push(id);
        } else if (email) {
            // Normalize email to lowercase and trim for consistent lookup
            const normalizedEmail = email.toLowerCase().trim();
            query += `email = $${paramCount}`;
            params.push(normalizedEmail);
        } else if (username) {
            // Normalize username to lowercase and trim for consistent lookup
            const normalizedUsername = username.toLowerCase().trim();
            query += `username = $${paramCount}`;
            params.push(normalizedUsername);
        } else {
            return null;
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    static async comparePassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }
}

export { User };
