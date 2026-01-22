import { Router } from 'express';
import {
    createTask,
    getProjectTasks,
    getMyTasks,
    updateTaskCompletion,
    updateTask,
    deleteTask
} from '../controllers/task.controller.js';
import { requireAuth, requireTeamLead } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create a new task (team lead only) - check auth in controller
router.post('/create', createTask);

// Get all tasks for a project
router.get('/project/:projectId', getProjectTasks);

// Get tasks assigned to authenticated user
router.get('/project/:projectId/my-tasks', getMyTasks);

// Update task completion status (assigned user only)
router.patch('/:taskId/complete', updateTaskCompletion);

// Update task details (team lead only) - check auth in controller
router.patch('/:taskId', updateTask);

// Delete a task (team lead only) - check auth in controller
router.delete('/:taskId', deleteTask);

export default router;
