import { Invitation } from "../models/invitation.model.js";
import { Project } from "../models/project.model.js";
import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";

/**
 * Send an invitation to a user
 */
export const sendInvitation = async (req, res) => {
    try {
        const { projectId, inviteeEmail, message } = req.body;
        const inviterId = req.userId;

        if (!projectId || !inviteeEmail) {
            return res.status(400).json({
                message: "Project ID and invitee email are required"
            });
        }

        // Check if inviter is team lead
        const isLead = await Project.isTeamLead(projectId, inviterId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can send invitations"
            });
        }

        // Find invitee by email
        const invitee = await User.findOne({ email: inviteeEmail });
        if (!invitee) {
            return res.status(404).json({
                message: "User with this email not found"
            });
        }

        // Don't allow inviting yourself
        if (invitee.id === inviterId) {
            return res.status(400).json({
                message: "You cannot invite yourself"
            });
        }

        // Create invitation
        const invitation = await Invitation.create({
            projectId,
            inviterId,
            inviteeId: invitee.id,
            message
        });

        // Get project details for notification
        const project = await Project.findById(projectId);
        const inviter = await User.findOne({ id: inviterId });

        // Create notification for invitee
        await Notification.createInvitationNotification(
            {
                ...invitation,
                inviter_username: inviter.username
            },
            project
        );

        res.status(201).json({
            message: "Invitation sent successfully",
            invitation: {
                ...invitation,
                invitee_username: invitee.username,
                invitee_email: invitee.email
            }
        });
    } catch (error) {
        console.error("Send invitation error:", error);
        res.status(500).json({
            message: "Failed to send invitation",
            error: error.message
        });
    }
};

/**
 * Get all invitations for the authenticated user
 */
export const getMyInvitations = async (req, res) => {
    try {
        const userId = req.userId;
        const type = req.query.type || 'received'; // 'received' or 'sent'

        const invitations = await Invitation.findByUserId(userId, type);

        res.status(200).json(invitations);
    } catch (error) {
        console.error("Get invitations error:", error);
        res.status(500).json({
            message: "Failed to fetch invitations",
            error: error.message
        });
    }
};

/**
 * Get pending invitations for the authenticated user
 */
export const getPendingInvitations = async (req, res) => {
    try {
        const userId = req.userId;
        const invitations = await Invitation.findPendingByUserId(userId);

        res.status(200).json(invitations);
    } catch (error) {
        console.error("Get pending invitations error:", error);
        res.status(500).json({
            message: "Failed to fetch pending invitations",
            error: error.message
        });
    }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.userId;

        const invitation = await Invitation.accept(invitationId, userId);

        res.status(200).json({
            message: "Invitation accepted successfully",
            invitation
        });
    } catch (error) {
        console.error("Accept invitation error:", error);
        res.status(500).json({
            message: "Failed to accept invitation",
            error: error.message
        });
    }
};

/**
 * Reject an invitation
 */
export const rejectInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.userId;

        const invitation = await Invitation.reject(invitationId, userId);

        res.status(200).json({
            message: "Invitation rejected",
            invitation
        });
    } catch (error) {
        console.error("Reject invitation error:", error);
        res.status(500).json({
            message: "Failed to reject invitation",
            error: error.message
        });
    }
};

/**
 * Cancel an invitation (by inviter)
 */
export const cancelInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const inviterId = req.userId;

        const invitation = await Invitation.cancel(invitationId, inviterId);

        res.status(200).json({
            message: "Invitation cancelled successfully",
            invitation
        });
    } catch (error) {
        console.error("Cancel invitation error:", error);
        res.status(500).json({
            message: "Failed to cancel invitation",
            error: error.message
        });
    }
};
