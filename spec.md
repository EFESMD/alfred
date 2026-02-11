# Oxana - Specification

## 1. Project Overview
A robust, real-time project management application designed for teams to organize, track, and manage their work.

## 2. Core Features (MVP)
### Authentication & User Management
- Secure Sign-up/Login/Logout (using NextAuth.js).
- User profiles with avatars.
- Workspace creation and member invitations.

### Workspace & Project Management
- **Workspaces:** Isolated environments for different teams/organizations.
- **Projects:** Groupings of tasks within a workspace.
- **Project Dashboard:** Overview of progress and team members.

### Task Management
- **Task CRUD:** Create, Read, Update, Delete tasks.
- **Task Attributes:**
  - Title & Description (Markdown support).
  - Assignee(s).
  - Due Dates.
  - Priority (Low, Medium, High).
  - Status (Backlog, To Do, In Progress, Done).
- **Comments:** Threaded discussions on tasks.
- **Activity Log:** Audit trail for task changes.

### Core Views
- **List View:** Table-like interface for quick editing.
- **Kanban Board:** Drag-and-drop board for workflow visualization.

## 3. Advanced Features (Phase 2+)
- **Timeline/Gantt View:** Visualizing task dependencies and schedules.
- **Calendar View:** Monthly/Weekly view of deadlines.
- **Subtasks:** Breaking down complex tasks.
- **File Attachments:** Support for uploading documents and images.
- **Real-time Updates:** instant UI updates via WebSockets (Pusher/Socket.io).
- **Notifications:** In-app and email notifications for assignments and mentions.

## 4. Technical Stack (Proposed)
- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS + Shadcn UI.
- **Database:** PostgreSQL (hosted on Vercel Postgres or Supabase).
- **ORM:** Prisma.
- **Authentication:** NextAuth.js.
- **State Management:** React Query (TanStack Query).
- **Drag-and-drop:** @hello-pangea/dnd or dnd-kit.

## 5. Database Schema (Draft)
- `User`: id, name, email, image, password.
- `Workspace`: id, name, ownerId.
- `Project`: id, name, description, workspaceId.
- `Task`: id, title, description, status, priority, dueDate, projectId, assigneeId.
- `Comment`: id, content, taskId, userId, createdAt.
- `Activity`: id, type, description, taskId, userId, createdAt.
