import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { Notification } from "../models/notification.model.js";

/**
 * Create a new task (team lead only)
 */
export const createTask = async (req, res) => {
    try {
        const { projectId, assignedTo, title, description } = req.body;
        const createdBy = req.userId;

        if (!projectId || !assignedTo || !title) {
            return res.status(400).json({
                message: "Project ID, assigned user ID, and title are required"
            });
        }

        // Check if user is team lead
        const isLead = await Project.isTeamLead(projectId, createdBy);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can create tasks"
            });
        }

        // Verify assigned user is a member of the project
        const members = await Project.getMembers(projectId);
        const assignedMember = members.find(m => m.user_id === assignedTo);
        
        if (!assignedMember) {
            return res.status(400).json({
                message: "Assigned user must be a member of this project"
            });
        }

        const task = await Task.create({
            projectId,
            createdBy,
            assignedTo,
            title,
            description
        });

        // Create notification for assigned user
        const project = await Project.findById(projectId);
        await Notification.create({
            userId: assignedTo,
            type: 'task_assigned',
            title: `New Task: ${title}`,
            message: `You have been assigned a new task in "${project.name}" project.`,
            relatedProjectId: projectId
        });

        res.status(201).json({
            message: "Task created successfully",
            task
        });
    } catch (error) {
        console.error("Create task error:", error);
        res.status(500).json({
            message: "Failed to create task",
            error: error.message
        });
    }
};

/**
 * Get all tasks for a project
 */
export const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        // Check if user is a member of the project
        const members = await Project.getMembers(projectId);
        const isMember = members.some(m => m.user_id === userId);
        
        if (!isMember) {
            return res.status(403).json({
                message: "You must be a member of this project to view tasks"
            });
        }

        const tasks = await Task.findByProjectId(projectId);

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Get tasks error:", error);
        res.status(500).json({
            message: "Failed to fetch tasks",
            error: error.message
        });
    }
};

/**
 * Get tasks assigned to the authenticated user
 */
export const getMyTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        const tasks = await Task.findByAssignedUser(projectId, userId);

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Get my tasks error:", error);
        res.status(500).json({
            message: "Failed to fetch your tasks",
            error: error.message
        });
    }
};

/**
 * Update task completion status (assigned user only)
 */
export const updateTaskCompletion = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { isCompleted } = req.body;
        const userId = req.userId;

        if (typeof isCompleted !== 'boolean') {
            return res.status(400).json({
                message: "isCompleted must be a boolean value"
            });
        }

        const task = await Task.updateCompletion(taskId, userId, isCompleted);

        res.status(200).json({
            message: isCompleted ? "Task marked as completed" : "Task marked as incomplete",
            task
        });
    } catch (error) {
        console.error("Update task completion error:", error);
        res.status(500).json({
            message: "Failed to update task",
            error: error.message
        });
    }
};

/**
 * Update task details (team lead only)
 */
export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.userId;
        const { title, description, assignedTo, status } = req.body;

        // Get task to find project ID
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Check if user is team lead
        const isLead = await Project.isTeamLead(task.project_id, userId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can update task details"
            });
        }

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (assignedTo !== undefined) updates.assignedTo = assignedTo;
        if (status !== undefined) updates.status = status;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No fields to update"
            });
        }

        const updatedTask = await Task.update(taskId, updates);

        res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        console.error("Update task error:", error);
        res.status(500).json({
            message: "Failed to update task",
            error: error.message
        });
    }
};

/**
 * Delete a task (team lead only)
 */
export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.userId;

        // Get task to find project ID
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // Check if user is team lead
        const isLead = await Project.isTeamLead(task.project_id, userId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can delete tasks"
            });
        }

        await Task.delete(taskId);

        res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error("Delete task error:", error);
        res.status(500).json({
            message: "Failed to delete task",
            error: error.message
        });
    }
};
