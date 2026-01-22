import { pool } from "../config/database.js";

class Task {
    /**
     * Create a new task (only team leads can create tasks)
     */
    static async create({ projectId, createdBy, assignedTo, title, description }) {
        // Validate input
        if (!projectId || !createdBy || !assignedTo || !title) {
            throw new Error("Project ID, creator ID, assigned user ID, and title are required");
        }

        // Insert task
        const result = await pool.query(
            `INSERT INTO tasks (project_id, created_by, assigned_to, title, description, status, is_completed) 
             VALUES ($1, $2, $3, $4, $5, 'pending', false) 
             RETURNING *`,
            [projectId, createdBy, assignedTo, title.trim(), description?.trim() || null]
        );

        return result.rows[0];
    }

    /**
     * Get all tasks for a project
     */
    static async findByProjectId(projectId) {
        const result = await pool.query(
            `SELECT t.*, 
                    u1.username as created_by_username,
                    u2.username as assigned_to_username,
                    u2.email as assigned_to_email
             FROM tasks t
             LEFT JOIN users u1 ON t.created_by = u1.id
             LEFT JOIN users u2 ON t.assigned_to = u2.id
             WHERE t.project_id = $1
             ORDER BY t.created_at DESC`,
            [projectId]
        );
        return result.rows;
    }

    /**
     * Get tasks assigned to a specific user in a project
     */
    static async findByAssignedUser(projectId, userId) {
        const result = await pool.query(
            `SELECT t.*, 
                    u1.username as created_by_username,
                    u2.username as assigned_to_username
             FROM tasks t
             LEFT JOIN users u1 ON t.created_by = u1.id
             LEFT JOIN users u2 ON t.assigned_to = u2.id
             WHERE t.project_id = $1 AND t.assigned_to = $2
             ORDER BY t.is_completed ASC, t.created_at DESC`,
            [projectId, userId]
        );
        return result.rows;
    }

    /**
     * Get task by ID
     */
    static async findById(taskId) {
        const result = await pool.query(
            `SELECT t.*, 
                    u1.username as created_by_username,
                    u2.username as assigned_to_username,
                    u2.email as assigned_to_email
             FROM tasks t
             LEFT JOIN users u1 ON t.created_by = u1.id
             LEFT JOIN users u2 ON t.assigned_to = u2.id
             WHERE t.id = $1`,
            [taskId]
        );
        return result.rows[0] || null;
    }

    /**
     * Update task completion status (for assigned user)
     */
    static async updateCompletion(taskId, userId, isCompleted) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Verify task is assigned to this user
            const taskCheck = await client.query(
                `SELECT assigned_to, project_id FROM tasks WHERE id = $1 FOR UPDATE`,
                [taskId]
            );

            if (taskCheck.rows.length === 0) {
                throw new Error("Task not found");
            }

            if (taskCheck.rows[0].assigned_to !== userId) {
                throw new Error("You can only update tasks assigned to you");
            }

            // Update task completion
            const updateResult = await client.query(
                `UPDATE tasks 
                 SET is_completed = $1, 
                     status = CASE WHEN $1 = true THEN 'completed' ELSE 'pending' END,
                     completed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING *`,
                [isCompleted, taskId]
            );

            await client.query('COMMIT');
            return updateResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update task details (team lead only)
     */
    static async update(taskId, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.title !== undefined) {
            fields.push(`title = $${paramCount}`);
            values.push(updates.title.trim());
            paramCount++;
        }
        if (updates.description !== undefined) {
            fields.push(`description = $${paramCount}`);
            values.push(updates.description?.trim() || null);
            paramCount++;
        }
        if (updates.assignedTo !== undefined) {
            fields.push(`assigned_to = $${paramCount}`);
            values.push(updates.assignedTo);
            paramCount++;
        }
        if (updates.status !== undefined) {
            if (!['pending', 'in_progress', 'completed'].includes(updates.status)) {
                throw new Error("Invalid status. Must be 'pending', 'in_progress', or 'completed'");
            }
            fields.push(`status = $${paramCount}`);
            values.push(updates.status);
            paramCount++;
        }

        if (fields.length === 0) {
            throw new Error("No fields to update");
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(taskId);

        const query = `
            UPDATE tasks 
            SET ${fields.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Delete a task (team lead only)
     */
    static async delete(taskId) {
        const result = await pool.query(
            `DELETE FROM tasks WHERE id = $1 RETURNING *`,
            [taskId]
        );
        return result.rows[0] || null;
    }
}

export { Task };
