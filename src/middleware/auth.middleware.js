import { Project } from "../models/project.model.js";
import { pool } from "../config/database.js";

/**
 * Middleware to check if user is authenticated
 * This is a simple auth - in production, use JWT tokens
 */
export const requireAuth = (req, res, next) => {
    // For now, we'll get user ID from request body, query, or headers
    // In production, this would come from JWT token
    // Safely check req.body - it might be undefined for GET requests
    const userId = (req.body && req.body.userId) || req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
        return res.status(401).json({ 
            message: "Authentication required. Please provide user ID in body, query, or x-user-id header." 
        });
    }
    
    // Attach userId to request for use in controllers
    req.userId = parseInt(userId);
    next();
};

/**
 * Middleware to check if user is team lead of a project
 */
export const requireTeamLead = async (req, res, next) => {
    try {
        const userId = req.userId;
        // Safely check req.body - it might be undefined for GET requests
        const projectId = parseInt(req.params.projectId || (req.body && req.body.projectId));
        
        if (!projectId) {
            return res.status(400).json({ 
                message: "Project ID is required" 
            });
        }
        
        const isLead = await Project.isTeamLead(projectId, userId);
        
        if (!isLead) {
            return res.status(403).json({ 
                message: "Access denied. Team lead role required." 
            });
        }
        
        req.projectId = projectId;
        next();
    } catch (error) {
        res.status(500).json({ 
            message: "Error checking permissions", 
            error: error.message 
        });
    }
};

/**
 * Middleware to check if user is a member of a project (team_member or team_lead)
 */
export const requireProjectMember = async (req, res, next) => {
    try {
        const userId = req.userId;
        // Safely check req.body - it might be undefined for GET requests
        const projectId = parseInt(req.params.projectId || (req.body && req.body.projectId));
        
        if (!projectId) {
            return res.status(400).json({ 
                message: "Project ID is required" 
            });
        }
        
        // Check if user is a member (either team_member or team_lead)
        const memberCheck = await pool.query(
            `SELECT role FROM project_members 
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ 
                message: "Access denied. You are not a member of this project." 
            });
        }
        
        req.projectId = projectId;
        req.userRole = memberCheck.rows[0].role;
        next();
    } catch (error) {
        res.status(500).json({ 
            message: "Error checking permissions", 
            error: error.message 
        });
    }
};
