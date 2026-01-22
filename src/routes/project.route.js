import { Router } from 'express';
import {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    deleteProject,
    assignTeamLead,
    removeMember,
    leaveProject
} from '../controllers/project.controller.js';
import { requireAuth, requireTeamLead } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create a new project
router.post('/create', createProject);

// Get all projects for authenticated user
router.get('/my-projects', getMyProjects);

// Get project by ID
router.get('/:projectId', getProjectById);

// Update project (team lead only)
router.patch('/:projectId', requireTeamLead, updateProject);

// Delete project (team lead only)
router.delete('/:projectId', requireTeamLead, deleteProject);

// Assign team lead role (team lead only)
router.post('/:projectId/assign-lead', requireTeamLead, assignTeamLead);

// Remove member from project (team lead only)
router.delete('/:projectId/members/:memberId', requireTeamLead, removeMember);

// Leave project (team member can remove themselves)
router.post('/:projectId/leave', leaveProject);

export default router;
