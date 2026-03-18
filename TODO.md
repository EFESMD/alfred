# Alfred - Project Progress

- [x] **Project Foundation**
    - [x] Project Scaffolding (Next.js 15+, Tailwind, TS)
    - [x] Database Schema (SQLite + Prisma)
    - [x] Authentication (NextAuth.js with Credentials only)
    - [x] **Rebranded platform to "Alfred"**

- [x] **Workspace & Members**
    - [x] Multi-workspace support
    - [x] Workspace creation & switching
    - [x] Member Invite system (Link-based)
    - [x] **Consolidated Workspace Settings Hub**
        - [x] General: Rename workspace & manage invite links
        - [x] Members: Role management (Owner, Admin, Member) and removal
        - [x] Archive: Library of archived projects for easy restoration
        - [x] Danger Zone: Full workspace deletion with confirmation
    - [x] **Streamlined Sidebar**: Removed redundant links; consolidated administration into Settings
    - [x] **Automated Join Flow**: New users are automatically enrolled in workspaces via invite links after registration.

- [x] **Project & Task Management**
    - [x] Project creation (Scratch vs Template)
    - [x] **Project Sections** (Grouping tasks into milestones/categories)
        - [x] Section Management (Renaming and deleting sections)
        - [x] Promotion logic: Renaming "Uncategorized" converts it to a real section
        - [x] Template support: Sections are preserved when cloning projects
    - [x] List View (Grouped by sections with collapsible headers)
    - [x] Kanban Board (Optimized Drag & Drop)
    - [x] Calendar View
    - [x] **Interactive Timeline (Gantt Chart)**
        - [x] Grouped by sections (Swimlanes)
        - [x] Task dependencies visualization
        - [x] **Multi-resolution Zoom** (Days/Weeks view)
        - [x] Weekend and Today highlighting
    - [x] Task Detail Panel (Inline editing)
    - [x] Subtasks (Nested task management)
    - [x] Task & Subtask Deletion (with confirmation)
    - [x] **Project Templates**
        - [x] Deep cloning engine (Tasks, Subtasks, and Sections)
        - [x] Template library in creation UI
        - [x] Save existing project as template
        - [x] Sanitized templates (removes dates and assignees)

- [x] **Collaboration & Security**
    - [x] Task Comments
    - [x] **Real-time Activity Log** (with state tracking and relative timestamps)
    - [x] Profile Management (Name editing & Manual Avatar Upload)
    - [x] **Split Name Support**: Added firstName and lastName fields for better user identification.
    - [x] **Email Domain Restriction**: Restricted registration to @md.anadoluefes.com for corporate security.
    - [x] Task Attachments (Local storage system)
    - [x] Real-time updates (Pusher integration)
    - [x] Project Leader assignment and display
    - [x] Project Settings (Color, Icon, Leader, Archiving)
    - [x] **Strict Read-Only mode for archived projects**
    - [x] **Grouped \"My Tasks\"** view by project for cross-workspace clarity
    - [x] **Auto-Assign Project Leader**: New tasks are automatically assigned to the project leader by default.
    - [x] **Subtask Inline Editing**: Enabled direct editing of subtask titles in the task detail pane.
    - [x] **Email Server Integration**: Integrated corporate mail server (mail.efes.md).
    - [x] **Private Projects**: Projects are now private by default; members only see what they are invited to.
    - [x] **Granular Project Roles**: Implemented OWNER, MEMBER, and VIEWER roles with UI-level restrictions.

- [x] **Maintenance & Bug Fixes**
    - [x] Resolved Prisma client synchronization issues with Turbopack
    - [x] **API Security**: Replaced detailed error responses with generic "Internal Error" for production
    - [x] UI Refinement: Improved spacing and layout for Project, Workspace, and Login pages
    - [x] **Compact UI**: Reduced row height across all task lists (List, My Tasks, Subtasks)
    - [x] Optimized Settings page loading speed via targeted API calls
    - [x] Task Pane Housekeeping: Moved name to top, unified selector styles
    - [x] **Fixed P2003 Foreign Key error** in project creation
    - [x] **Improved contrast** for Timeline zoom toggle and active states
    - [x] **Dynamic Timeline Grid**: Grid dynamically adjusts to project task durations.
    - [x] **Performance Boost**: Removed redundant client-side API calls.
    - [x] **Session Persistence**: 30-day persistent login and Opera compatibility.
    - [x] **Admin Navigation**: Integrated Super Admin dashboard link in profile menu.
    - [x] **Data Migration Tool**: Built a master admin tool to migrate legacy project data to the new roles system.
    - [x] **Storage Cleanup**: Automated physical file deletion when tasks, projects, or workspaces are deleted, and old avatars are replaced.
    - [x] **UI Theme**: Updated Sidebar and Topbar background colors to standard grey scheme (#f5f6f8 and #efefef).
    - [x] **State Synchronization**: Fixed issue where user avatar in Sidebar did not update immediately upon upload via Profile page.
    - [x] **Visibility Filters**: Implemented "Hide Done" toggle in List, Board, Timeline, and Calendar views (Persistent via URL parameters).
    - [x] **Unified Role Management**: Standardized role calculation to elevate Workspace Admins/Owners in all project views and enforced strict read-only access for archived content.

- [x] **Infrastructure & Professional Deployment**
    - [x] **Professional Git Workflow**: Established `main` and `develop` branches for safe deployment.
    - [x] **Railway Environment Isolation**: Strategy for separate Dev and Prod environments.
    - [x] **Deployment Documentation**: Created `GHID_DEPLOYMENT.md` for step-by-step guidance.
    - [x] **Automated Server Maintenance**: Added `start:railway` script for automated DB sync on Railway.
    - [x] **Environment Configuration**: Created `.env.example` as a template for Railway setup.

- [ ] **Next Steps**
    - [ ] **Global Search**: Quick navigation across workspace projects and tasks.
    - [ ] **Timeline Export**: Export project timeline to PDF/image formats.
    - [ ] **Notifications System**: In-app and potentially email alerts for task assignments and mentions.
    - [x] Manual Task Sorting (Drag & Drop reordering in List and Kanban)
    - [ ] **Account & Security Enhancements**
        - [x] **Email Verification**: Formalize account creation with email confirmation link.
        - [ ] **Password Management**: Allow users to change their password from profile settings.
    - [ ] **Internationalization (i18n)**: Support for multiple languages (Romanian and Russian).
    - [ ] **Advanced Roles & Permissions (Workspace Level)**
    - [x] **Super Admin**: Full platform control (Global stats, User management, Manual verification)
    - [x] **Admin**: Workspace management (Invite/Remove members, Workspace settings)
    - [x] **Manager/Project Owner**: Project control (Manage settings, Manage members)
    - [x] **Member/Contributor**: Standard task management (Create/Edit tasks)
    - [x] **Viewer/Guest**: Read-only access to specific projects or tasks

Export la timeline
Sortare campuri in list view
My tasks:
 ———Filtre
 ———Grupari
 ———Sortari
Tasks by others
Roluri in proiect
Notificari
Dependente intre taskuri
Email verification
