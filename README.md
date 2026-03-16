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
- **Advanced Task Filtering**: Toggle between incomplete, completed, and all tasks across all views, including "My Tasks".
- **Collaboration**: Real-time comments, activity logs, and file attachments.
- **System Maintenance**: Automated physical storage cleanup when resources (Tasks, Projects, Workspaces) or avatars are deleted.
- **Super Admin Panel**: Master control panel for system statistics, user management, and automated data migration.
- **Corporate Security**: Restricted registration to specific email domains and integrated mail server support.
- **Custom UI Theme**: Clean, standard grey interface (#f5f6f8 and #efefef) for maximum readability.

## 🛠️ Technical Stack

- **Framework**: Next.js 15+ (App Router, Turbopack)
- **Database**: SQLite + Prisma ORM
- **Authentication**: NextAuth.js (Credentials Provider)
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Pusher
- **State Management**: TanStack Query (React Query)

## ⚙️ Configuration & Deployment

Proiectul Alfred utilizează un flux de lucru profesional cu două medii izolate pe **Railway**:

- **Mediu de Dezvoltare (Dev)**: Conectat la branch-ul `develop`. Utilizat pentru testarea funcționalităților noi.
- **Mediu de Producție (Prod)**: Conectat la branch-ul `main`. Versiunea stabilă utilizată de echipa corporativă.

### Start Command (Railway)
Pentru ambele medii, utilizați următoarea comandă de pornire în setările Railway:
```bash
npm run start:railway
```
Această comandă rulează automat `prisma generate` și `prisma db push` înainte de a porni aplicația, asigurând sincronizarea bazei de date.

### Environment Variables
Consultați fișierul `.env.example` pentru lista completă a variabilelor necesare (Pusher, Mail Server, NextAuth, etc.).

## 🏢 Corporate Infrastructure

- **Source Code**: [GitHub EFESMD/alfred](https://github.com/EFESMD/alfred)
- **Deployment**: Railway (Corporate Account)
- **Status**: Production Ready (Branch: `main`) / Development (Branch: `develop`)

---

Ultima actualizare a infrastructurii: 16 Martie 2026.

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
