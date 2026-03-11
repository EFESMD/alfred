# Alfred - Project Management Tool

A robust, real-time project management application inspired by Asana, designed for teams to organize, track, and manage their work efficiently with enterprise-grade security.

## 🚀 Key Features

- **Multi-Workspace Support**: Isolated environments for different teams.
- **Secure Collaboration**: 
  - **Private Projects**: Projects are private by default. Members only see what they are invited to.
  - **Granular Roles**: Define specific access levels per project (Owner, Member, Viewer).
- **Project Management**: Create projects from scratch or use pre-defined templates.
- **Task Views**:
  - **List View**: Grouped by sections with inline editing.
  - **Kanban Board**: Optimized drag-and-drop workflow.
  - **Calendar View**: Visual overview of deadlines.
  - **Interactive Timeline**: Gantt Chart with task dependencies and zoom levels.
- **Collaboration**: Real-time comments, activity logs, and file attachments.
- **Super Admin Panel**: Master control panel for system statistics, user management, and automated data migration.
- **Corporate Security**: Restricted registration to specific email domains and integrated mail server support.

## 🛠️ Technical Stack

- **Framework**: Next.js 15+ (App Router, Turbopack)
- **Database**: SQLite + Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider)
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Pusher
- **State Management**: TanStack Query (React Query)

## ⚙️ Configuration

To enable the **Super Admin** features, you must configure the following environment variable in your `.env` file. You can add multiple emails separated by commas:

```env
ADMIN_EMAIL="email1@md.anadoluefes.com, email2@md.anadoluefes.com"
```

## 🏃 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Setup Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to access the application.
