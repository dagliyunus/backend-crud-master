import { Router } from 'express';
import {
    sendInvitation,
    getMyInvitations,
    getPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation
} from '../controllers/invitation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Send invitation
router.post('/send', sendInvitation);

// Get all invitations (received or sent)
router.get('/my-invitations', getMyInvitations);

// Get pending invitations
router.get('/pending', getPendingInvitations);

// Accept invitation
router.post('/:invitationId/accept', acceptInvitation);

// Reject invitation
router.post('/:invitationId/reject', rejectInvitation);

// Cancel invitation (by inviter)
router.delete('/:invitationId', cancelInvitation);

export default router;
