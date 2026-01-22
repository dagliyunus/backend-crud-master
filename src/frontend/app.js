/* ============================================
   API Configuration and Constants
   ============================================ */

const API_BASE_URL = window.location.origin;
const API_URL = `${API_BASE_URL}/api/v1`;

const API_ENDPOINTS = {
    register: `${API_URL}/users/register`,
    login: `${API_URL}/users/login`,
    logout: `${API_URL}/users/logout`,
    createPost: `${API_URL}/posts/create`,
    getPosts: `${API_URL}/posts/getPosts`,
    updatePost: (id) => `${API_URL}/posts/update/${id}`,
    deletePost: (id) => `${API_URL}/posts/delete/${id}`,
    createProject: `${API_URL}/projects/create`,
    getMyProjects: `${API_URL}/projects/my-projects`,
    getProject: (id) => `${API_URL}/projects/${id}`,
    updateProject: (id) => `${API_URL}/projects/${id}`,
    deleteProject: (id) => `${API_URL}/projects/${id}`,
    assignTeamLead: (id) => `${API_URL}/projects/${id}/assign-lead`,
    removeMember: (projectId, memberId) => `${API_URL}/projects/${projectId}/members/${memberId}`,
    leaveProject: (id) => `${API_URL}/projects/${id}/leave`,
    sendInvitation: `${API_URL}/invitations/send`,
    getMyInvitations: `${API_URL}/invitations/my-invitations`,
    getPendingInvitations: `${API_URL}/invitations/pending`,
    acceptInvitation: (id) => `${API_URL}/invitations/${id}/accept`,
    rejectInvitation: (id) => `${API_URL}/invitations/${id}/reject`,
    cancelInvitation: (id) => `${API_URL}/invitations/${id}`,
    getNotifications: `${API_URL}/notifications`,
    getUnreadCount: `${API_URL}/notifications/unread-count`,
    markAsRead: (id) => `${API_URL}/notifications/${id}/read`,
    markAllRead: `${API_URL}/notifications/mark-all-read`,
    deleteNotification: (id) => `${API_URL}/notifications/${id}`,
    createTask: `${API_URL}/tasks/create`,
    getProjectTasks: (projectId) => `${API_URL}/tasks/project/${projectId}`,
    getMyTasks: (projectId) => `${API_URL}/tasks/project/${projectId}/my-tasks`,
    updateTaskCompletion: (taskId) => `${API_URL}/tasks/${taskId}/complete`,
    updateTask: (taskId) => `${API_URL}/tasks/${taskId}`,
    deleteTask: (taskId) => `${API_URL}/tasks/${taskId}`,
};

/* ============================================
   State Management
   ============================================ */

let currentUser = null;
let posts = [];
let projects = [];
let invitations = [];
let notifications = [];
let tasks = [];

/* ============================================
   DOM Element References
   ============================================ */

const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const currentUsername = document.getElementById('currentUsername');
const currentUserEmail = document.getElementById('currentUserEmail');
const logoutBtn = document.getElementById('logoutBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationBadge = document.getElementById('notificationBadge');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationsList = document.getElementById('notificationsList');
const messageContainer = document.getElementById('messageContainer');

/* ============================================
   Utility Functions
   ============================================ */

function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    const icon = type === 'success' ? '✓' : '✕';
    messageEl.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    messageContainer.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => messageEl.remove(), 300);
    }, 5000);
}

async function apiRequest(url, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        
        if (currentUser && currentUser.id) {
            if (method === 'GET') {
                url += (url.includes('?') ? '&' : '?') + `userId=${currentUser.id}`;
            } else {
                if (data) {
                    data.userId = currentUser.id;
                } else {
                    data = { userId: currentUser.id };
                }
            }
        }
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || result.error || 'An error occurred');
        }
        
        return result;
    } catch (error) {
        throw error;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ============================================
   Authentication Functions
   ============================================ */

async function handleRegister(event) {
    event.preventDefault();
    try {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        
        if (!username || !email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        const response = await apiRequest(API_ENDPOINTS.register, 'POST', { username, email, password });
        showMessage(response.message || 'Registration successful!', 'success');
        registerFormElement.reset();
        setTimeout(() => switchTab('login'), 1500);
    } catch (error) {
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    try {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        const response = await apiRequest(API_ENDPOINTS.login, 'POST', { email, password });
        currentUser = response.user;
        currentUsername.textContent = currentUser.username;
        currentUserEmail.textContent = currentUser.email;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showMessage(response.message || 'Login successful!', 'success');
        showAppSection();
        await Promise.all([loadProjects(), loadPendingInvitations(), loadNotifications()]);
    } catch (error) {
        showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
    }
}

async function handleLogout() {
    try {
        if (currentUser) {
            await apiRequest(API_ENDPOINTS.logout, 'POST', { email: currentUser.email });
        }
    } catch (error) {
        console.log('Logout API call failed');
    }
    
    currentUser = null;
    localStorage.removeItem('currentUser');
    projects = [];
    posts = [];
    invitations = [];
    notifications = [];
    
    showMessage('Logged out successfully', 'success');
    showAuthSection();
}

/* ============================================
   UI State Management
   ============================================ */

function showAuthSection() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    loginFormElement.reset();
    registerFormElement.reset();
}

function showAppSection() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.form-container').forEach(form => form.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active');
    }
}

function switchMainTab(tab) {
    document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');
    
    if (tab === 'projects') loadProjects();
    else if (tab === 'invitations') loadPendingInvitations();
    else if (tab === 'posts') loadPosts();
}

/* ============================================
   Project Management Functions
   ============================================ */

async function loadProjects() {
    try {
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '<div class="loading-message">Loading projects...</div>';
        projects = await apiRequest(API_ENDPOINTS.getMyProjects, 'GET');
        
        if (projects.length === 0) {
            projectsList.innerHTML = '<div class="empty-state">No projects yet. Create your first project!</div>';
            return;
        }
        
        projectsList.innerHTML = projects.map(project => `
            <div class="card" onclick="viewProjectDetails(${project.id})">
                <div class="card-header">
                    <div>
                        <div class="card-title">${escapeHtml(project.name)}</div>
                        <div class="role-badge ${project.user_role === 'team_lead' ? '' : 'team-member'}">
                            ${project.user_role === 'team_lead' ? 'Team Lead' : 'Team Member'}
                        </div>
                    </div>
                </div>
                <div class="card-description">${escapeHtml(project.description || 'No description')}</div>
                <div class="card-meta">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">
                        Created: ${formatDate(project.created_at)}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('projectsList').innerHTML = 
            `<div class="empty-state">Error loading projects: ${error.message}</div>`;
        showMessage('Failed to load projects', 'error');
    }
}

async function viewProjectDetails(projectId) {
    try {
        // Store current project ID for task updates
        window.currentViewingProjectId = projectId;
        
        const [project, projectTasks] = await Promise.all([
            apiRequest(API_ENDPOINTS.getProject(projectId), 'GET'),
            apiRequest(API_ENDPOINTS.getProjectTasks(projectId), 'GET')
        ]);
        
        const members = project.members || [];
        tasks = projectTasks || [];
        const modal = document.getElementById('projectDetailsModal');
        const title = document.getElementById('projectDetailsTitle');
        const content = document.getElementById('projectDetailsContent');
        
        title.textContent = project.project.name;
        const isTeamLead = project.project.user_role === 'team_lead';
        
        // Get tasks assigned to current user
        const myTasks = tasks.filter(t => t.assigned_to === currentUser.id);
        const allTasks = tasks;
        
        content.innerHTML = `
            <div style="margin-bottom: var(--spacing-lg);">
                <p style="color: var(--text-muted); margin-bottom: var(--spacing-md);">
                    ${escapeHtml(project.project.description || 'No description')}
                </p>
                <div style="color: var(--text-muted); font-size: 0.85rem;">
                    Created by: ${escapeHtml(project.project.created_by_username || 'Unknown')}
                </div>
            </div>
            
            <!-- Team Members Section -->
            <div class="members-list" style="margin-bottom: var(--spacing-xl);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <h4 style="color: var(--text-primary); margin: 0;">Team Members</h4>
                    ${isTeamLead ? `
                        <button class="btn btn-small btn-primary" onclick="openInviteModal(${project.project.id})">
                            + Invite
                        </button>
                    ` : ''}
                </div>
                ${members.map(member => `
                    <div class="member-item">
                        <div class="member-info">
                            <div class="member-name">${escapeHtml(member.username)}</div>
                            <div class="member-email">${escapeHtml(member.email)}</div>
                        </div>
                        <div style="display: flex; gap: var(--spacing-xs); align-items: center;">
                            <span class="role-badge ${member.role === 'team_lead' ? '' : 'team-member'}">
                                ${member.role === 'team_lead' ? 'Team Lead' : 'Team Member'}
                            </span>
                            ${isTeamLead && member.user_id !== currentUser.id ? `
                                <button class="btn btn-small btn-primary" onclick="assignTeamLead(${project.project.id}, ${member.user_id})">
                                    Make Lead
                                </button>
                                <button class="btn btn-small btn-danger" onclick="removeMember(${project.project.id}, ${member.user_id})">
                                    Remove
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Tasks Section -->
            <div style="margin-bottom: var(--spacing-xl);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
                    <h4 style="color: var(--text-primary); margin: 0;">Tasks</h4>
                    ${isTeamLead ? `
                        <button class="btn btn-small btn-primary" onclick="openCreateTaskModal(${project.project.id}, ${JSON.stringify(members)})">
                            + Create Task
                        </button>
                    ` : ''}
                </div>
                
                ${allTasks.length === 0 ? `
                    <div class="empty-state" style="padding: var(--spacing-md);">
                        No tasks yet. ${isTeamLead ? 'Create your first task!' : 'No tasks assigned.'}
                    </div>
                ` : `
                    <div class="tasks-container">
                        ${allTasks.map(task => {
                            const isAssignedToMe = task.assigned_to === currentUser.id;
                            const canComplete = isAssignedToMe;
                            return `
                                <div class="task-item ${task.is_completed ? 'completed' : ''}" style="
                                    display: flex; 
                                    align-items: start; 
                                    gap: var(--spacing-sm);
                                    padding: var(--spacing-md);
                                    background: var(--black-elevated);
                                    border: 1px solid var(--border-color);
                                    border-radius: var(--radius-sm);
                                    margin-bottom: var(--spacing-sm);
                                ">
                                    ${canComplete ? `
                                        <input 
                                            type="checkbox" 
                                            ${task.is_completed ? 'checked' : ''} 
                                            onchange="toggleTaskCompletion(${task.id}, this.checked)"
                                            style="margin-top: 4px; cursor: pointer; width: 20px; height: 20px;"
                                        >
                                    ` : '<div style="width: 20px;"></div>'}
                                    <div style="flex: 1;">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-xs);">
                                            <div>
                                                <div style="color: var(--text-primary); font-weight: 600; ${task.is_completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                                                    ${escapeHtml(task.title)}
                                                </div>
                                                ${task.description ? `
                                                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: var(--spacing-xs);">
                                                        ${escapeHtml(task.description)}
                                                    </div>
                                                ` : ''}
                                            </div>
                                            ${isTeamLead ? `
                                                <button class="btn btn-small btn-danger" onclick="deleteTaskConfirm(${task.id}, ${project.project.id})" style="margin-left: var(--spacing-xs);">
                                                    Delete
                                                </button>
                                            ` : ''}
                                        </div>
                                        <div style="display: flex; gap: var(--spacing-sm); align-items: center; margin-top: var(--spacing-xs);">
                                            <span style="color: var(--text-muted); font-size: 0.75rem;">
                                                Assigned to: <strong>${escapeHtml(task.assigned_to_username)}</strong>
                                            </span>
                                            <span class="status-badge ${task.is_completed ? 'accepted' : 'pending'}" style="font-size: 0.7rem;">
                                                ${task.is_completed ? 'Completed' : 'Pending'}
                                            </span>
                                            <span style="color: var(--text-disabled); font-size: 0.7rem;">
                                                ${formatDate(task.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
            
            <div style="margin-top: var(--spacing-lg); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    ${!isTeamLead ? `
                        <button class="btn btn-danger" onclick="leaveProjectConfirm(${project.project.id})">
                             Leave Project
                        </button>
                    ` : ''}
                </div>
                <div style="display: flex; gap: var(--spacing-sm);">
                    ${isTeamLead ? `
                        <button class="btn btn-danger" onclick="deleteProjectConfirm(${project.project.id})">
                            🗑️ Delete Project
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closeModal('projectDetailsModal')">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        showMessage(error.message || 'Failed to load project details', 'error');
    }
}

async function createProject(event) {
    event.preventDefault();
    try {
        const name = document.getElementById('projectName').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        
        if (!name) {
            showMessage('Project name is required', 'error');
            return;
        }
        
        await apiRequest(API_ENDPOINTS.createProject, 'POST', { name, description });
        showMessage('Project created successfully!', 'success');
        closeModal('projectModal');
        document.getElementById('projectForm').reset();
        await loadProjects();
    } catch (error) {
        showMessage(error.message || 'Failed to create project', 'error');
    }
}

function openCreateProjectModal() {
    document.getElementById('projectId').value = '';
    document.getElementById('projectModalTitle').textContent = 'Create New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectModal').classList.remove('hidden');
}

function openInviteModal(projectId) {
    document.getElementById('inviteProjectId').value = projectId;
    document.getElementById('inviteForm').reset();
    document.getElementById('inviteModal').classList.remove('hidden');
}

async function sendInvitation(event) {
    event.preventDefault();
    try {
        const projectId = parseInt(document.getElementById('inviteProjectId').value);
        const inviteeEmail = document.getElementById('inviteeEmail').value.trim();
        const message = document.getElementById('inviteMessage').value.trim();
        
        if (!inviteeEmail) {
            showMessage('Email is required', 'error');
            return;
        }
        
        await apiRequest(API_ENDPOINTS.sendInvitation, 'POST', { projectId, inviteeEmail, message });
        showMessage('Invitation sent successfully!', 'success');
        closeModal('inviteModal');
        document.getElementById('inviteForm').reset();
    } catch (error) {
        showMessage(error.message || 'Failed to send invitation', 'error');
    }
}

async function assignTeamLead(projectId, memberId) {
    if (!confirm('Are you sure you want to assign this member as team lead?')) return;
    try {
        await apiRequest(API_ENDPOINTS.assignTeamLead(projectId), 'POST', { memberId });
        showMessage('Team lead assigned successfully!', 'success');
        await viewProjectDetails(projectId);
        await loadProjects();
    } catch (error) {
        showMessage(error.message || 'Failed to assign team lead', 'error');
    }
}

async function removeMember(projectId, memberId) {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    try {
        await apiRequest(API_ENDPOINTS.removeMember(projectId, memberId), 'DELETE');
        showMessage('Member removed successfully!', 'success');
        await viewProjectDetails(projectId);
        await loadProjects();
    } catch (error) {
        showMessage(error.message || 'Failed to remove member', 'error');
    }
}

async function deleteProjectConfirm(projectId) {
    if (!confirm('⚠️ WARNING: This will permanently delete the project and all associated tasks, invitations, and notifications. This action cannot be undone!\n\nAre you sure you want to delete this project?')) {
        return;
    }
    
    try {
        await apiRequest(API_ENDPOINTS.deleteProject(projectId), 'DELETE');
        showMessage('Project deleted successfully!', 'success');
        closeModal('projectDetailsModal');
        await loadProjects();
    } catch (error) {
        showMessage(error.message || 'Failed to delete project', 'error');
    }
}

async function leaveProjectConfirm(projectId) {
    if (!confirm('Are you sure you want to leave this project? You will lose access to all tasks and project information.')) {
        return;
    }
    
    try {
        await apiRequest(API_ENDPOINTS.leaveProject(projectId), 'POST');
        showMessage('You have successfully left the project', 'success');
        closeModal('projectDetailsModal');
        await loadProjects();
    } catch (error) {
        showMessage(error.message || 'Failed to leave project', 'error');
    }
}

/* ============================================
   Invitation Management Functions
   ============================================ */

async function loadPendingInvitations() {
    try {
        const invitationsList = document.getElementById('invitationsList');
        invitationsList.innerHTML = '<div class="loading-message">Loading invitations...</div>';
        invitations = await apiRequest(API_ENDPOINTS.getPendingInvitations, 'GET');
        
        if (invitations.length === 0) {
            invitationsList.innerHTML = '<div class="empty-state">No pending invitations</div>';
            return;
        }
        
        invitationsList.innerHTML = invitations.map(inv => `
            <div class="card">
                <div class="card-header">
                    <div>
                        <div class="card-title">${escapeHtml(inv.project_name)}</div>
                        <span class="status-badge pending">Pending</span>
                    </div>
                </div>
                <div class="card-description">
                    ${escapeHtml(inv.message || `Invited by ${inv.inviter_username}`)}
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary btn-small" onclick="acceptInvitation(${inv.id})">Accept</button>
                    <button class="btn btn-secondary btn-small" onclick="rejectInvitation(${inv.id})">Reject</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('invitationsList').innerHTML = 
            `<div class="empty-state">Error loading invitations: ${error.message}</div>`;
    }
}

async function acceptInvitation(invitationId) {
    try {
        await apiRequest(API_ENDPOINTS.acceptInvitation(invitationId), 'POST');
        showMessage('Invitation accepted!', 'success');
        await Promise.all([loadPendingInvitations(), loadProjects(), loadNotifications()]);
    } catch (error) {
        showMessage(error.message || 'Failed to accept invitation', 'error');
    }
}

async function rejectInvitation(invitationId) {
    try {
        await apiRequest(API_ENDPOINTS.rejectInvitation(invitationId), 'POST');
        showMessage('Invitation rejected', 'success');
        await loadPendingInvitations();
    } catch (error) {
        showMessage(error.message || 'Failed to reject invitation', 'error');
    }
}

/* ============================================
   Notification Management Functions
   ============================================ */

async function loadNotifications() {
    try {
        notifications = await apiRequest(`${API_ENDPOINTS.getNotifications}?unreadOnly=true`, 'GET');
        const count = notifications.length;
        
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
        
        if (notificationsPanel.classList.contains('hidden')) return;
        
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<div class="empty-state">No notifications</div>';
            return;
        }
        
        notificationsList.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatDate(notif.created_at)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

function toggleNotificationsPanel() {
    notificationsPanel.classList.toggle('hidden');
    if (!notificationsPanel.classList.contains('hidden')) {
        loadNotifications();
    }
}

async function markNotificationRead(notificationId) {
    try {
        await apiRequest(API_ENDPOINTS.markAsRead(notificationId), 'PATCH');
        await loadNotifications();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    try {
        await apiRequest(API_ENDPOINTS.markAllRead, 'PATCH');
        showMessage('All notifications marked as read', 'success');
        await loadNotifications();
    } catch (error) {
        showMessage(error.message || 'Failed to mark all as read', 'error');
    }
}

/* ============================================
   Post Management Functions
   ============================================ */

async function loadPosts() {
    try {
        const postsList = document.getElementById('postsList');
        postsList.innerHTML = '<div class="loading-message">Loading posts...</div>';
        posts = await apiRequest(API_ENDPOINTS.getPosts, 'GET');
        
        if (posts.length === 0) {
            postsList.innerHTML = '<div class="empty-state">No posts yet. Create your first post!</div>';
            return;
        }
        
        postsList.innerHTML = posts.map(post => `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">${escapeHtml(post.name)}</div>
                </div>
                <div class="card-description">${escapeHtml(post.description)}</div>
                <div class="card-meta">
                    <span class="role-badge team-member">Age: ${post.age}</span>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">${formatDate(post.created_at)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary btn-small" onclick="editPost(${post.id})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deletePost(${post.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('postsList').innerHTML = 
            `<div class="empty-state">Error loading posts: ${error.message}</div>`;
    }
}

function openCreatePostModal() {
    document.getElementById('postId').value = '';
    document.getElementById('modalTitle').textContent = 'Create New Post';
    document.getElementById('postForm').reset();
    document.getElementById('postModal').classList.remove('hidden');
}

function editPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) {
        showMessage('Post not found', 'error');
        return;
    }
    
    document.getElementById('postId').value = post.id;
    document.getElementById('postName').value = post.name;
    document.getElementById('postDescription').value = post.description;
    document.getElementById('postAge').value = post.age;
    document.getElementById('modalTitle').textContent = 'Edit Post';
    document.getElementById('postModal').classList.remove('hidden');
}

async function handlePostSubmit(event) {
    event.preventDefault();
    try {
        const postId = document.getElementById('postId').value;
        const name = document.getElementById('postName').value.trim();
        const description = document.getElementById('postDescription').value.trim();
        const age = parseInt(document.getElementById('postAge').value);
        
        if (!name || !description || !age) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (age < 1 || age > 150) {
            showMessage('Age must be between 1 and 150', 'error');
            return;
        }
        
        if (postId) {
            await apiRequest(API_ENDPOINTS.updatePost(postId), 'PATCH', { name, description, age });
            showMessage('Post updated successfully!', 'success');
        } else {
            await apiRequest(API_ENDPOINTS.createPost, 'POST', { name, description, age });
            showMessage('Post created successfully!', 'success');
        }
        
        closeModal('postModal');
        await loadPosts();
    } catch (error) {
        showMessage(error.message || 'Failed to save post', 'error');
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        await apiRequest(API_ENDPOINTS.deletePost(postId), 'DELETE');
        showMessage('Post deleted successfully!', 'success');
        await loadPosts();
    } catch (error) {
        showMessage(error.message || 'Failed to delete post', 'error');
    }
}

/* ============================================
   Task Management Functions
   ============================================ */

function openCreateTaskModal(projectId, membersJson) {
    const modal = document.getElementById('taskModal');
    const assignedToSelect = document.getElementById('taskAssignedTo');
    
    document.getElementById('taskProjectId').value = projectId;
    document.getElementById('taskForm').reset();
    
    // Parse members if it's a JSON string, otherwise use as-is
    let members;
    try {
        members = typeof membersJson === 'string' ? JSON.parse(membersJson) : membersJson;
    } catch (e) {
        members = membersJson;
    }
    
    // Populate team members dropdown (exclude team leads, only show team members)
    assignedToSelect.innerHTML = '<option value="">Select team member...</option>';
    if (Array.isArray(members)) {
        members.forEach(member => {
            if (member.role === 'team_member') {
                const option = document.createElement('option');
                option.value = member.user_id;
                option.textContent = `${member.username} (${member.email})`;
                assignedToSelect.appendChild(option);
            }
        });
    }
    
    modal.classList.remove('hidden');
}

async function createTask(event) {
    event.preventDefault();
    try {
        const projectId = parseInt(document.getElementById('taskProjectId').value);
        const assignedTo = parseInt(document.getElementById('taskAssignedTo').value);
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        
        if (!projectId || !assignedTo || !title) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        await apiRequest(API_ENDPOINTS.createTask, 'POST', {
            projectId,
            assignedTo,
            title,
            description
        });
        
        showMessage('Task created successfully!', 'success');
        closeModal('taskModal');
        document.getElementById('taskForm').reset();
        
        // Reload project details to show new task
        await viewProjectDetails(projectId);
        await loadProjects();
        await loadNotifications();
    } catch (error) {
        showMessage(error.message || 'Failed to create task', 'error');
    }
}

async function toggleTaskCompletion(taskId, isCompleted) {
    try {
        await apiRequest(API_ENDPOINTS.updateTaskCompletion(taskId), 'PATCH', {
            isCompleted: isCompleted
        });
        
        // Find the task in current view and update UI
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.is_completed = isCompleted;
            task.status = isCompleted ? 'completed' : 'pending';
        }
        
        // Find project ID from current modal or reload from stored state
        // We'll need to store current project ID when viewing details
        const currentProjectId = window.currentViewingProjectId;
        if (currentProjectId) {
            await viewProjectDetails(currentProjectId);
        }
        
        showMessage(isCompleted ? 'Task marked as completed!' : 'Task marked as incomplete', 'success');
    } catch (error) {
        showMessage(error.message || 'Failed to update task', 'error');
    }
}

async function deleteTaskConfirm(taskId, projectId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        await apiRequest(API_ENDPOINTS.deleteTask(taskId), 'DELETE');
        showMessage('Task deleted successfully!', 'success');
        await viewProjectDetails(projectId);
    } catch (error) {
        showMessage(error.message || 'Failed to delete task', 'error');
    }
}

/* ============================================
   Modal Management
   ============================================ */

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

/* ============================================
   Event Listeners Setup
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            currentUsername.textContent = currentUser.username;
            currentUserEmail.textContent = currentUser.email;
            showAppSection();
            Promise.all([loadProjects(), loadPendingInvitations(), loadNotifications()]);
        } catch (error) {
            localStorage.removeItem('currentUser');
        }
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
    
    document.querySelectorAll('.main-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMainTab(btn.getAttribute('data-tab')));
    });
    
    loginFormElement.addEventListener('submit', handleLogin);
    registerFormElement.addEventListener('submit', handleRegister);
    document.getElementById('projectForm').addEventListener('submit', createProject);
    document.getElementById('inviteForm').addEventListener('submit', sendInvitation);
    document.getElementById('taskForm').addEventListener('submit', createTask);
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    
    document.getElementById('createProjectBtn').addEventListener('click', openCreateProjectModal);
    document.getElementById('createPostBtn').addEventListener('click', openCreatePostModal);
    logoutBtn.addEventListener('click', handleLogout);
    notificationsBtn.addEventListener('click', toggleNotificationsPanel);
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotificationsRead);
    
    document.getElementById('cancelProjectBtn').addEventListener('click', () => closeModal('projectModal'));
    document.getElementById('cancelInviteBtn').addEventListener('click', () => closeModal('inviteModal'));
    document.getElementById('cancelTaskBtn').addEventListener('click', () => closeModal('taskModal'));
    document.getElementById('cancelBtn').addEventListener('click', () => closeModal('postModal'));
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (!modal.classList.contains('hidden')) modal.classList.add('hidden');
            });
        }
    });
});

window.viewProjectDetails = viewProjectDetails;
window.assignTeamLead = assignTeamLead;
window.removeMember = removeMember;
window.deleteProjectConfirm = deleteProjectConfirm;
window.leaveProjectConfirm = leaveProjectConfirm;
window.openInviteModal = openInviteModal;
window.openCreateTaskModal = openCreateTaskModal;
window.toggleTaskCompletion = toggleTaskCompletion;
window.deleteTaskConfirm = deleteTaskConfirm;
window.acceptInvitation = acceptInvitation;
window.rejectInvitation = rejectInvitation;
window.editPost = editPost;
window.deletePost = deletePost;
window.markNotificationRead = markNotificationRead;
