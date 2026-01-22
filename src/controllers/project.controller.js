import { Project } from "../models/project.model.js";
import { Notification } from "../models/notification.model.js";

/**
 * Create a new project
 * The creator automatically becomes team_lead
 */
export const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.userId; // From auth middleware

        if (!name) {
            return res.status(400).json({ 
                message: "Project name is required" 
            });
        }

        const project = await Project.create({
            name,
            description,
            createdBy: userId
        });

        res.status(201).json({
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({
            message: "Failed to create project",
            error: error.message
        });
    }
};

/**
 * Get all projects for the authenticated user
 */
export const getMyProjects = async (req, res) => {
    try {
        const userId = req.userId;
        const projects = await Project.findByUserId(userId);

        res.status(200).json(projects);
    } catch (error) {
        console.error("Get projects error:", error);
        res.status(500).json({
            message: "Failed to fetch projects",
            error: error.message
        });
    }
};

/**
 * Get project details by ID
 */
export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        const project = await Project.findById(projectId, userId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // Get project members
        const members = await Project.getMembers(projectId);

        res.status(200).json({
            project,
            members
        });
    } catch (error) {
        console.error("Get project error:", error);
        res.status(500).json({
            message: "Failed to fetch project",
            error: error.message
        });
    }
};

/**
 * Update project details (team lead only)
 */
export const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;
        const { name, description } = req.body;

        // Check if user is team lead
        const isLead = await Project.isTeamLead(projectId, userId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can update project details"
            });
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No fields to update"
            });
        }

        const project = await Project.update(projectId, updates);

        res.status(200).json({
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        console.error("Update project error:", error);
        res.status(500).json({
            message: "Failed to update project",
            error: error.message
        });
    }
};

/**
 * Delete a project (team lead only)
 */
export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        // Check if user is team lead
        const isLead = await Project.isTeamLead(projectId, userId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can delete projects"
            });
        }

        const project = await Project.delete(projectId);

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.status(200).json({
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({
            message: "Failed to delete project",
            error: error.message
        });
    }
};

/**
 * Assign team lead role to another member
 */
export const assignTeamLead = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { memberId } = req.body;
        const userId = req.userId; // Current team lead

        if (!memberId) {
            return res.status(400).json({
                message: "Member ID is required"
            });
        }

        // Check if current user is team lead
        const isLead = await Project.isTeamLead(projectId, userId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can assign team lead role"
            });
        }

        // Check if member exists in project
        const members = await Project.getMembers(projectId);
        const member = members.find(m => m.user_id === parseInt(memberId));

        if (!member) {
            return res.status(404).json({
                message: "Member not found in this project"
            });
        }

        // Update member role to team_lead
        const updatedMember = await Project.updateMemberRole(projectId, memberId, 'team_lead');

        // Create notification for the new team lead
        const project = await Project.findById(projectId);
        await Notification.createRoleChangeNotification(
            memberId,
            projectId,
            project.name,
            'team_lead'
        );

        res.status(200).json({
            message: "Team lead assigned successfully",
            member: updatedMember
        });
    } catch (error) {
        console.error("Assign team lead error:", error);
        res.status(500).json({
            message: "Failed to assign team lead",
            error: error.message
        });
    }
};

/**
 * Leave a project (team member can remove themselves)
 */
export const leaveProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.userId;

        // Check if user is a member of the project
        const isMember = await Project.isMember(projectId, userId);
        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this project"
            });
        }

        // Check if user is team lead - team leads cannot leave, they must delete the project or assign another lead
        const isLead = await Project.isTeamLead(projectId, userId);
        if (isLead) {
            return res.status(403).json({
                message: "Team leads cannot leave projects. Please assign another team lead or delete the project."
            });
        }

        // Remove user from project
        await Project.removeMember(projectId, userId);

        res.status(200).json({
            message: "You have successfully left the project"
        });
    } catch (error) {
        console.error("Leave project error:", error);
        res.status(500).json({
            message: "Failed to leave project",
            error: error.message
        });
    }
};

/**
 * Remove a member from project (team lead only)
 */
export const removeMember = async (req, res) => {
    try {
        const { projectId, memberId } = req.params;
        const userId = req.userId;

        // Check if user is team lead
        const isLead = await Project.isTeamLead(projectId, userId);
        if (!isLead) {
            return res.status(403).json({
                message: "Only team leads can remove members"
            });
        }

        // Don't allow removing yourself
        if (parseInt(memberId) === userId) {
            return res.status(400).json({
                message: "You cannot remove yourself from the project"
            });
        }

        const removed = await Project.removeMember(projectId, memberId);

        if (!removed) {
            return res.status(404).json({
                message: "Member not found in this project"
            });
        }

        res.status(200).json({
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error("Remove member error:", error);
        res.status(500).json({
            message: "Failed to remove member",
            error: error.message
        });
    }
};
