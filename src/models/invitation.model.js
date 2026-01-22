import { pool } from "../config/database.js";

class Invitation {
    /**
     * Create a new invitation
     */
    static async create({ projectId, inviterId, inviteeId, message = null }) {
        // Validate input
        if (!projectId || !inviterId || !inviteeId) {
            throw new Error("Project ID, inviter ID, and invitee ID are required");
        }

        // Check if user is already a member
        const memberCheck = await pool.query(
            `SELECT id FROM project_members 
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, inviteeId]
        );

        if (memberCheck.rows.length > 0) {
            throw new Error("User is already a member of this project");
        }

        // Check if there's already a pending invitation
        const existingInvitation = await pool.query(
            `SELECT id FROM invitations 
             WHERE project_id = $1 AND invitee_id = $2 AND status = 'pending'`,
            [projectId, inviteeId]
        );

        if (existingInvitation.rows.length > 0) {
            throw new Error("A pending invitation already exists for this user");
        }

        // Create invitation
        const result = await pool.query(
            `INSERT INTO invitations (project_id, inviter_id, invitee_id, message, status) 
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [projectId, inviterId, inviteeId, message?.trim() || null]
        );

        return result.rows[0];
    }

    /**
     * Get invitation by ID
     */
    static async findById(invitationId) {
        const result = await pool.query(
            `SELECT i.*, 
                    p.name as project_name,
                    p.description as project_description,
                    u1.username as inviter_username,
                    u2.username as invitee_username
             FROM invitations i
             INNER JOIN projects p ON i.project_id = p.id
             INNER JOIN users u1 ON i.inviter_id = u1.id
             INNER JOIN users u2 ON i.invitee_id = u2.id
             WHERE i.id = $1`,
            [invitationId]
        );
        return result.rows[0] || null;
    }

    /**
     * Get all invitations for a user (sent or received)
     */
    static async findByUserId(userId, type = 'received') {
        let query;
        
        if (type === 'received') {
            // Invitations received by user
            query = `
                SELECT i.*, 
                       p.name as project_name,
                       p.description as project_description,
                       u.username as inviter_username,
                       u.email as inviter_email
                FROM invitations i
                INNER JOIN projects p ON i.project_id = p.id
                INNER JOIN users u ON i.inviter_id = u.id
                WHERE i.invitee_id = $1
                ORDER BY i.created_at DESC
            `;
        } else {
            // Invitations sent by user
            query = `
                SELECT i.*, 
                       p.name as project_name,
                       p.description as project_description,
                       u.username as invitee_username,
                       u.email as invitee_email
                FROM invitations i
                INNER JOIN projects p ON i.project_id = p.id
                INNER JOIN users u ON i.invitee_id = u.id
                WHERE i.inviter_id = $1
                ORDER BY i.created_at DESC
            `;
        }

        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Get pending invitations for a user
     */
    static async findPendingByUserId(userId) {
        const result = await pool.query(
            `SELECT i.*, 
                    p.name as project_name,
                    p.description as project_description,
                    u.username as inviter_username,
                    u.email as inviter_email
             FROM invitations i
             INNER JOIN projects p ON i.project_id = p.id
             INNER JOIN users u ON i.inviter_id = u.id
             WHERE i.invitee_id = $1 AND i.status = 'pending'
             ORDER BY i.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Accept an invitation
     */
    static async accept(invitationId, userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Get invitation and verify it belongs to user
            const invitationResult = await client.query(
                `SELECT * FROM invitations 
                 WHERE id = $1 AND invitee_id = $2 AND status = 'pending'
                 FOR UPDATE`,
                [invitationId, userId]
            );

            if (invitationResult.rows.length === 0) {
                throw new Error("Invitation not found or already processed");
            }

            const invitation = invitationResult.rows[0];

            // Add user to project as team_member
            await client.query(
                `INSERT INTO project_members (project_id, user_id, role) 
                 VALUES ($1, $2, 'team_member')
                 ON CONFLICT (project_id, user_id) DO NOTHING`,
                [invitation.project_id, userId]
            );

            // Update invitation status
            await client.query(
                `UPDATE invitations 
                 SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [invitationId]
            );

            await client.query('COMMIT');

            return invitationResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reject an invitation
     */
    static async reject(invitationId, userId) {
        const result = await pool.query(
            `UPDATE invitations 
             SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND invitee_id = $2 AND status = 'pending'
             RETURNING *`,
            [invitationId, userId]
        );

        if (result.rows.length === 0) {
            throw new Error("Invitation not found or already processed");
        }

        return result.rows[0];
    }

    /**
     * Cancel an invitation (by inviter)
     */
    static async cancel(invitationId, inviterId) {
        const result = await pool.query(
            `UPDATE invitations 
             SET status = 'rejected', responded_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND inviter_id = $2 AND status = 'pending'
             RETURNING *`,
            [invitationId, inviterId]
        );

        if (result.rows.length === 0) {
            throw new Error("Invitation not found or already processed");
        }

        return result.rows[0];
    }
}

export { Invitation };
