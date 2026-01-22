import { pool } from "../config/database.js";

class Notification {
    /**
     * Create a new notification
     */
    static async create({ userId, type, title, message, relatedProjectId = null, relatedInvitationId = null }) {
        // Validate input
        if (!userId || !type || !title || !message) {
            throw new Error("User ID, type, title, and message are required");
        }

        const result = await pool.query(
            `INSERT INTO notifications 
             (user_id, type, title, message, related_project_id, related_invitation_id) 
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, type, title.trim(), message.trim(), relatedProjectId, relatedInvitationId]
        );

        return result.rows[0];
    }

    /**
     * Get all notifications for a user
     */
    static async findByUserId(userId, unreadOnly = false) {
        let query = `
            SELECT n.*, 
                   p.name as project_name
            FROM notifications n
            LEFT JOIN projects p ON n.related_project_id = p.id
            WHERE n.user_id = $1
        `;

        const params = [userId];

        if (unreadOnly) {
            query += ` AND n.is_read = false`;
        }

        query += ` ORDER BY n.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get unread notification count for a user
     */
    static async getUnreadCount(userId) {
        const result = await pool.query(
            `SELECT COUNT(*) as count 
             FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId, userId) {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [notificationId, userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId) {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1 AND is_read = false
             RETURNING *`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Delete a notification
     */
    static async delete(notificationId, userId) {
        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [notificationId, userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Create notification for invitation
     */
    static async createInvitationNotification(invitation, project) {
        return await this.create({
            userId: invitation.invitee_id,
            type: 'invitation',
            title: `Project Invitation: ${project.name}`,
            message: `You have been invited to join the project "${project.name}" by ${invitation.inviter_username || 'a team lead'}.`,
            relatedProjectId: invitation.project_id,
            relatedInvitationId: invitation.id
        });
    }

    /**
     * Create notification for role change
     */
    static async createRoleChangeNotification(userId, projectId, projectName, newRole) {
        return await this.create({
            userId: userId,
            type: 'role_change',
            title: `Role Updated in ${projectName}`,
            message: `Your role in "${projectName}" has been changed to ${newRole}.`,
            relatedProjectId: projectId
        });
    }
}

export { Notification };
