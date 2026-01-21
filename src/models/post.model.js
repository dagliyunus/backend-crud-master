import { pool } from "../config/database.js";

class Post {
    static async create({ name, description, age }) {
        // Validate
        if (!name || !description || age === undefined) {
            throw new Error("All fields are required");
        }

        if (age < 1 || age > 150) {
            throw new Error("Age must be between 1 and 150");
        }

        // Insert post
        const result = await pool.query(
            `INSERT INTO posts (name, description, age) 
             VALUES (TRIM($1), TRIM($2), $3) 
             RETURNING *`,
            [name, description, age]
        );

        return result.rows[0];
    }

    static async find() {
        const result = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    static async findByIdAndUpdate(id, updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic update query
        if (updateData.name !== undefined) {
            fields.push(`name = TRIM($${paramCount})`);
            values.push(updateData.name);
            paramCount++;
        }
        if (updateData.description !== undefined) {
            fields.push(`description = TRIM($${paramCount})`);
            values.push(updateData.description);
            paramCount++;
        }
        if (updateData.age !== undefined) {
            if (updateData.age < 1 || updateData.age > 150) {
                throw new Error("Age must be between 1 and 150");
            }
            fields.push(`age = $${paramCount}`);
            values.push(updateData.age);
            paramCount++;
        }

        if (fields.length === 0) {
            return null;
        }

        // Add updated_at
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE posts 
            SET ${fields.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    static async findByIdAndDelete(id) {
        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    }
}

export { Post };
