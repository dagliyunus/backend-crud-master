# Project Management System Features

## Overview
This system extends the CRUD API with a complete project management system including:
- User roles (Team Member, Team Lead)
- Project creation and management
- Invitation system
- Notification system
- Role-based authorization

## Database Schema

### New Tables

1. **projects**
   - `id` - Primary key
   - `name` - Project name
   - `description` - Project description
   - `created_by` - User ID who created the project
   - `created_at`, `updated_at` - Timestamps

2. **project_members**
   - `id` - Primary key
   - `project_id` - Foreign key to projects
   - `user_id` - Foreign key to users
   - `role` - Either 'team_member' or 'team_lead'
   - `joined_at` - When user joined

3. **invitations**
   - `id` - Primary key
   - `project_id` - Foreign key to projects
   - `inviter_id` - User who sent invitation
   - `invitee_id` - User being invited
   - `status` - 'pending', 'accepted', or 'rejected'
   - `message` - Optional invitation message
   - `created_at`, `responded_at` - Timestamps

4. **notifications**
   - `id` - Primary key
   - `user_id` - User receiving notification
   - `type` - Notification type (invitation, role_change, etc.)
   - `title` - Notification title
   - `message` - Notification message
   - `related_project_id` - Related project (optional)
   - `related_invitation_id` - Related invitation (optional)
   - `is_read` - Read status
   - `created_at` - Timestamp

## API Endpoints

### Projects (`/api/v1/projects`)

All endpoints require authentication (send `userId` in request body or `x-user-id` header).

- `POST /create` - Create a new project (creator becomes team_lead)
- `GET /my-projects` - Get all projects for authenticated user
- `GET /:projectId` - Get project details with members
- `PATCH /:projectId` - Update project (team_lead only)
- `DELETE /:projectId` - Delete project (team_lead only)
- `POST /:projectId/assign-lead` - Assign team_lead role to another member
- `DELETE /:projectId/members/:memberId` - Remove member (team_lead only)

### Invitations (`/api/v1/invitations`)

- `POST /send` - Send invitation to a user by email
- `GET /my-invitations?type=received|sent` - Get all invitations
- `GET /pending` - Get pending invitations for user
- `POST /:invitationId/accept` - Accept an invitation
- `POST /:invitationId/reject` - Reject an invitation
- `DELETE /:invitationId` - Cancel invitation (by inviter)

### Notifications (`/api/v1/notifications`)

- `GET /` - Get all notifications (add `?unreadOnly=true` for unread only)
- `GET /unread-count` - Get count of unread notifications
- `PATCH /:notificationId/read` - Mark notification as read
- `PATCH /mark-all-read` - Mark all notifications as read
- `DELETE /:notificationId` - Delete notification

## Authentication

Currently using simple authentication:
- Send `userId` in request body: `{ userId: 123, ...otherData }`
- Or send in header: `x-user-id: 123`
- Or send in query: `?userId=123`

**Note:** In production, replace this with JWT tokens.

## Authorization

### Roles

1. **Team Member** - Default role for all users
   - Can view projects they're members of
   - Can accept/reject invitations

2. **Team Lead** - Assigned when creating a project or by another team lead
   - All team member permissions
   - Can update/delete project
   - Can send invitations
   - Can assign team_lead role to others
   - Can remove members

### Middleware

- `requireAuth` - Checks if user is authenticated
- `requireTeamLead` - Checks if user is team_lead of project
- `requireProjectMember` - Checks if user is member of project

## Workflow

1. **User Registration/Login**
   - User registers → becomes a "team member" by default
   - User logs in → receives user ID for authentication

2. **Project Creation**
   - User creates project → automatically becomes "team_lead"
   - Project is created with creator as first member

3. **Inviting Users**
   - Team lead sends invitation by email
   - Invited user receives notification
   - User can accept or reject invitation
   - On accept → user becomes "team_member" of project

4. **Role Management**
   - Team lead can assign another member as "team_lead"
   - Notification sent to promoted user
   - Multiple team leads allowed per project

5. **Notifications**
   - Created automatically for:
     - New invitations
     - Role changes
     - Project updates (can be extended)

## Example API Calls

### Create Project
```bash
POST /api/v1/projects/create
Body: {
  "userId": 1,
  "name": "My New Project",
  "description": "Project description"
}
```

### Send Invitation
```bash
POST /api/v1/invitations/send
Body: {
  "userId": 1,
  "projectId": 1,
  "inviteeEmail": "user@example.com",
  "message": "Join my project!"
}
```

### Accept Invitation
```bash
POST /api/v1/invitations/123/accept
Body: {
  "userId": 2
}
```

### Get Notifications
```bash
GET /api/v1/notifications?unreadOnly=true
Headers: {
  "x-user-id": "2"
}
```

## Files Created/Modified

### New Files
- `src/models/project.model.js` - Project data operations
- `src/models/invitation.model.js` - Invitation data operations
- `src/models/notification.model.js` - Notification data operations
- `src/middleware/auth.middleware.js` - Authentication & authorization
- `src/controllers/project.controller.js` - Project business logic
- `src/controllers/invitation.controller.js` - Invitation business logic
- `src/controllers/notification.controller.js` - Notification business logic
- `src/routes/project.route.js` - Project routes
- `src/routes/invitation.route.js` - Invitation routes
- `src/routes/notification.route.js` - Notification routes

### Modified Files
- `src/config/schema.sql` - Added new tables
- `src/app.js` - Added new routes

## Next Steps

1. **Update Database**: Restart server to apply new schema
2. **Frontend Integration**: Update frontend to use new APIs
3. **JWT Authentication**: Replace simple auth with JWT tokens
4. **Real-time Notifications**: Add WebSocket support for real-time updates
5. **Email Notifications**: Send email when invitations are sent

## Testing

After restarting the server, the new tables will be created automatically. Test the endpoints using:

```bash
# Create a project
curl -X POST http://localhost:8000/api/v1/projects/create \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "name": "Test Project", "description": "Test"}'

# Get projects
curl http://localhost:8000/api/v1/projects/my-projects?userId=1
```
