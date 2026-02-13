# Oxana - Project Progress

- [x] **Project Foundation**
    - [x] Project Scaffolding (Next.js 15+, Tailwind, TS)
    - [x] Database Schema (SQLite + Prisma)
    - [x] Authentication (NextAuth.js with Credentials only)
    - [x] **Rebranded platform from "Asana" to "Oxana"**

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

- [x] **Project & Task Management**
    - [x] Project creation (Scratch vs Template)
    - [x] List View & Kanban Board
    - [x] Calendar View
    - [x] **Interactive Timeline (Gantt Chart)**
        - [x] Task dependencies visualization
        - [x] **Multi-resolution Zoom** (Days/Weeks view)
        - [x] Weekend and Today highlighting
    - [x] Task Detail Panel (Inline editing)
    - [x] Subtasks (Nested task management)
    - [x] Task & Subtask Deletion (with confirmation)
    - [x] **Project Templates**
        - [x] Deep cloning engine (Tasks & Subtasks)
        - [x] Template library in creation UI
        - [x] Save existing project as template
        - [x] Sanitized templates (removes dates and assignees)
        - [x] Delete templates from library

- [x] **Collaboration & Features**
    - [x] Task Comments
    - [x] **Real-time Activity Log** (with state tracking and relative timestamps)
    - [x] Profile Management (Name editing & Manual Avatar Upload)
    - [x] Task Attachments (Local storage system)
    - [x] Real-time updates (Pusher integration)
    - [x] Project Leader assignment and display
    - [x] Project Settings (Color, Icon, Leader, Archiving)
    - [x] **Strict Read-Only mode for archived projects**

- [x] **Maintenance & Bug Fixes**
    - [x] Resolved Prisma client synchronization issues with Turbopack
    - [x] **API Security**: Replaced detailed error responses with generic "Internal Error" for production
    - [x] UI Refinement: Improved spacing and layout for Project, Workspace, and Login pages
    - [x] Optimized Settings page loading speed via targeted API calls
    - [x] Task Pane Housekeeping: Moved name to top, unified selector styles
    - [x] Task Sorting: Fixed order to ensure new tasks appear at the bottom
    - [x] **Fixed P2003 Foreign Key error** in project creation (Member vs User ID mismatch)
    - [x] **Fixed Workspace deletion "Cancel" button** using `DialogClose`
    - [x] **Improved contrast** for Timeline zoom toggle and active states

- [ ] **Next Steps**
    - [ ] Global Search (Quick navigation across workspace)
    - [ ] Notifications system
    - [ ] Manual Task Sorting (Drag & Drop reordering in List and Kanban)
    - [ ] User Roles & Permissions (Strict cross-workspace enforcement)
    - [ ] Multi-Assignees (Assign multiple members to a task)
    - [ ] Task Tags/Labels (Colored categories for tasks)
    - [ ] Activity Export (Export project data to CSV/PDF, JPG timeline)

## How to Test
1. Access the app at [http://localhost:3000](http://localhost:3000)
2. Register a new account / Login.
3. Create a workspace or select an existing one.
4. Use **Workspace Settings** (sidebar) to manage members or invite links.
5. Create a project using a template or from scratch.
6. Open a task to test **Comments**, **Activity**, **Attachments**, and **Subtasks**.
7. Explore the **Timeline** and toggle between **Days** and **Weeks** zoom levels.
