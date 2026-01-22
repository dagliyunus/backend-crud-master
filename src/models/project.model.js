import { pool } from "../config/database.js";

class Project {
    /**
     * Create a new project
     * The creator automatically becomes team_lead
     */
    static async create({ name, description, createdBy }) {
        // Validate input
        if (!name || !createdBy) {
            throw new Error("Project name and creator ID are required");
        }

        // Start a transaction to create project and add creator as team_lead
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN'); // Start transaction

            // Insert project
            const projectResult = await client.query(
                `INSERT INTO projects (name, description, created_by) 
                 VALUES ($1, $2, $3) 
                 RETURNING *`,
                [name.trim(), description?.trim() || null, createdBy]
            );

            const project = projectResult.rows[0];

            // Add creator as team_lead
            await client.query(
                `INSERT INTO project_members (project_id, user_id, role) 
                 VALUES ($1, $2, 'team_lead')`,
                [project.id, createdBy]
            );

            await client.query('COMMIT'); // Commit transaction

            return project;
        } catch (error) {
            await client.query('ROLLBACK'); // Rollback on error
            throw error;
        } finally {
            client.release(); // Release connection
        }
    }

    /**
     * Get all projects for a user (where user is a member)
     */
    static async findByUserId(userId) {
        const result = await pool.query(
            `SELECT DISTINCT p.*, 
                    pm.role as user_role,
                    u.username as created_by_username
             FROM projects p
             INNER JOIN project_members pm ON p.id = pm.project_id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE pm.user_id = $1
             ORDER BY p.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Get project by ID with member details
     */
    static async findById(projectId, userId = null) {
        let query = `
            SELECT p.*, 
                   u.username as created_by_username,
                   u.email as created_by_email
            FROM projects p
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = $1
        `;
        
        const params = [projectId];
        
        // If userId provided, also get user's role in this project
        if (userId) {
            query = `
                SELECT p.*, 
                       u.username as created_by_username,
                       u.email as created_by_email,
                       pm.role as user_role
                FROM projects p
                LEFT JOIN users u ON p.created_by = u.id
                LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $2
                WHERE p.id = $1
            `;
            params.push(userId);
        }

        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Get all members of a project
     */
    static async getMembers(projectId) {
        const result = await pool.query(
            `SELECT pm.*, 
                    u.id as user_id,
                    u.username, 
                    u.email,
                    pm.role,
                    pm.joined_at
             FROM project_members pm
             INNER JOIN users u ON pm.user_id = u.id
             WHERE pm.project_id = $1
             ORDER BY 
                 CASE pm.role 
                     WHEN 'team_lead' THEN 1 
                     ELSE 2 
                 END,
                 pm.joined_at ASC`,
            [projectId]
        );
        return result.rows;
    }

    /**
     * Add a member to a project
     */
    static async addMember(projectId, userId, role = 'team_member') {
        const result = await pool.query(
            `INSERT INTO project_members (project_id, user_id, role) 
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, user_id) 
             DO UPDATE SET role = $3
             RETURNING *`,
            [projectId, userId, role]
        );
        return result.rows[0];
    }

    /**
     * Update member role in a project
     */
    static async updateMemberRole(projectId, userId, newRole) {
        if (!['team_member', 'team_lead'].includes(newRole)) {
            throw new Error("Invalid role. Must be 'team_member' or 'team_lead'");
        }

        const result = await pool.query(
            `UPDATE project_members 
             SET role = $1 
             WHERE project_id = $2 AND user_id = $3
             RETURNING *`,
            [newRole, projectId, userId]
        );
        
        if (result.rows.length === 0) {
            throw new Error("Member not found in project");
        }
        
        return result.rows[0];
    }

    /**
     * Remove a member from a project
     */
    static async removeMember(projectId, userId) {
        const result = await pool.query(
            `DELETE FROM project_members 
             WHERE project_id = $1 AND user_id = $2
             RETURNING *`,
            [projectId, userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Check if user has specific role in project
     */
    static async hasRole(projectId, userId, role) {
        const result = await pool.query(
            `SELECT role FROM project_members 
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
        );
        
        if (result.rows.length === 0) {
            return false;
        }
        
        return result.rows[0].role === role;
    }

    /**
     * Check if user is team_lead of project
     */
    static async isTeamLead(projectId, userId) {
        return await this.hasRole(projectId, userId, 'team_lead');
    }

    /**
     * Check if user is a member of project (any role)
     */
    static async isMember(projectId, userId) {
        const result = await pool.query(
            `SELECT id FROM project_members 
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
        );
        return result.rows.length > 0;
    }

    /**
     * Update project details
     */
    static async update(projectId, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        if (updates.name !== undefined) {
            fields.push(`name = $${paramCount}`);
            values.push(updates.name.trim());
            paramCount++;
        }
        if (updates.description !== undefined) {
            fields.push(`description = $${paramCount}`);
            values.push(updates.description?.trim() || null);
            paramCount++;
        }

        if (fields.length === 0) {
            throw new Error("No fields to update");
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(projectId);

        const query = `
            UPDATE projects 
            SET ${fields.join(', ')} 
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Delete a project
     */
    static async delete(projectId) {
        const result = await pool.query(
            `DELETE FROM projects WHERE id = $1 RETURNING *`,
            [projectId]
        );
        return result.rows[0] || null;
    }
}

export { Project };
