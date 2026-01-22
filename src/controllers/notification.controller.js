import { Notification } from "../models/notification.model.js";

/**
 * Get all notifications for the authenticated user
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const unreadOnly = req.query.unreadOnly === 'true';

        const notifications = await Notification.findByUserId(userId, unreadOnly);

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await Notification.getUnreadCount(userId);

        res.status(200).json({ count });
    } catch (error) {
        console.error("Get unread count error:", error);
        res.status(500).json({
            message: "Failed to get unread count",
            error: error.message
        });
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;

        const notification = await Notification.markAsRead(notificationId, userId);

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({
            message: "Failed to mark notification as read",
            error: error.message
        });
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const notifications = await Notification.markAllAsRead(userId);

        res.status(200).json({
            message: "All notifications marked as read",
            count: notifications.length
        });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({
            message: "Failed to mark all notifications as read",
            error: error.message
        });
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.userId;

        const notification = await Notification.delete(notificationId, userId);

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({
            message: "Failed to delete notification",
            error: error.message
        });
    }
};
