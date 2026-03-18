# Alfred - Specification

## 1. Project Overview
A robust, real-time project management application designed for teams to organize, track, and manage their work.

## 2. Core Features
### Authentication & User Management
- Secure Sign-up/Login/Logout (using NextAuth.js).
- User profiles with avatars and name splitting.
- **Corporate Restriction**: Access restricted to specific corporate email domains.

### Workspace & Members
- **Workspaces**: Isolated team environments.
- **Member Management**: Role-based access (Owner, Admin, Member) and invite links.
- **Automatic Join Flow**: New users are automatically enrolled in workspaces via invite links after registration.

### Project & Task Management
- **Private Projects**: Projects are private by default. Members only see projects they are explicitly invited to.
- **Granular Project Roles**:
    - **Project Owner**: Full control over settings, sections, and members. (Note: Workspace Owners and Admins automatically inherit this role for all projects within their workspace).
    - **Project Member**: Can create, edit, and delete tasks.
    - **Project Viewer**: Read-only access to all views.
- **Projects**: Groupings of tasks, with support for Archiving and Templates.
- **Sections**: Grouping tasks into milestones or categories.
- **Task Attributes**: Title, Description (Markdown), Assignee, Due Dates, Priority, Status.
- **Subtasks**: Hierarchical task management.
- **Task Filtering**: Advanced visibility filters (Incomplete, Completed, All tasks) available across all views and My Tasks.
- **Task Sorting**: Automatic and manual task ordering.

### Administrative Control (Super Admin)
- **Global Control Panel**: Master dashboard for the entire platform.
- **System Statistics**: Real-time overview of users, workspaces, projects, and tasks.
- **User Directory**: Full list of registered members with management options.
- **Manual Verification**: Ability to manually verify user accounts.
- **Data Migration**: Built-in tools for structural database updates.

### Collaboration & Features
- **Comments**: Threaded discussions on tasks.
- **Activity Log**: Real-time audit trail for all task-related changes.
- **File Attachments**: Local storage system for task documents.
- **Automated Storage Cleanup**: Physical deletion of uploaded files and avatars when records are removed from the database to save space.
- **Real-time Updates**: Instant UI synchronization via Pusher.
- **Custom UI Theme**: Minimalist, grey-based interface design for optimal readability.

## 3. Core Views
- **List View**: Grouped by sections with collapsible headers and inline editing.
- **Kanban Board**: Optimized drag-and-drop workflow.
- **Calendar View**: Visual overview of deadlines.
- **Interactive Timeline**: Gantt Chart with swimlanes, task dependencies, and zoom levels.

## 4. Technical Stack
- **Framework**: Next.js 15+ (App Router).
- **Language**: TypeScript.
- **Styling**: Tailwind CSS + Shadcn UI.
- **Database**: SQLite (managed via Prisma).
- **ORM**: Prisma.
- **Authentication**: NextAuth.js.
- **Real-time**: Pusher.
- **State Management**: TanStack Query (React Query).

## 5. Configuration Requirements
- `ADMIN_EMAIL`: Comma-separated email addresses for Super Admin access.
- `DATABASE_URL`: Path to the SQLite database.
- `STORAGE_PATH`: Persistent volume path for file uploads.
- `NEXTAUTH_SECRET`: Security key for session encryption.
- `PUSHER_*`: Credentials for real-time synchronization.
- `MAIL_*`: Integration with corporate mail server.
