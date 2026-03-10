# Plan de Implementare: Proiecte Private și Roluri Granulare

Acest document descrie pașii tehnici pentru transformarea arhitecturii Oxana dintr-un sistem deschis într-unul securizat, bazat pe acces granular la nivel de proiect.

## 1. Obiective
- **Confidențialitate**: Membrii workspace-ului nu văd proiectele în care nu sunt invitați.
- **Control**: Definirea clară a ce poate face un utilizator (Vizualizare, Editare Task-uri, Management Proiect).
- **Integritate**: Migrarea datelor existente fără întreruperea activității.

## 2. Definirea Rolurilor

### A. Nivel Workspace
| Rol | Permisiuni |
| :--- | :--- |
| **Workspace Owner** | Acces total "Master" la toate proiectele, membrii și setările workspace-ului. |
| **Workspace Member** | Acces la dashboard-ul general și "My Tasks", dar vede doar proiectele unde este invitat. |

### B. Nivel Proiect (Nou)
| Rol | Permisiuni |
| :--- | :--- |
| **Project Owner** | Poate edita structura (nume, secțiuni), șterge proiectul și gestiona membrii proiectului. |
| **Project Member** | Poate crea/edita/șterge task-uri, adăuga comentarii și fișiere. Nu poate schimba structura proiectului. |
| **Project Viewer** | Acces "Read-Only". Vede tot (List, Board, Timeline), dar nu poate face nicio modificare. |

---

## 3. Implementare Tehnică (Pas cu Pas)

### Pasul 1: Modificarea Schemei Bazei de Date (`prisma/schema.prisma`)
1.  Introducerea modelului `ProjectMember`.
2.  Relarea `ProjectMember` cu `User` și `Project`.
3.  Adăugarea constrângerii de unicitate: un utilizator are un singur rol per proiect.

### Pasul 2: Migrarea Datelor Existente (CRITIC)
Vom crea un script de migrare (`scripts/migrate-project-roles.ts`) care va rula o singură dată:
- Pentru fiecare `Project`:
    - Găsește `ownerId` al workspace-ului părinte și îl adaugă ca `ProjectMember` cu rol `OWNER`.
    - Dacă proiectul are un `projectLeaderId`, îl adaugă ca `ProjectMember` cu rol `OWNER`.
    - *Decizie necesară*: Adăugăm toți membrii workspace-ului ca `Project Members` în proiectele vechi pentru a evita "dispariția" lor bruscă? (Recomandat pentru continuitate).

### Pasul 3: Actualizarea API-ului (Backend)
1.  **Filtrarea Listei de Proiecte**: Modificarea rutei `GET /api/workspaces/[id]/projects` pentru a returna proiectele unde utilizatorul este membru SAU este owner-ul workspace-ului.
2.  **Middleware de Securitate**: Crearea unei funcții helper `checkProjectAccess(userId, projectId, requiredRole)` pentru a valida fiecare cerere (PATCH, DELETE, etc.).
3.  **Rute noi**:
    - `GET /api/projects/[id]/members`: Listarea membrilor proiectului.
    - `POST /api/projects/[id]/members`: Invitarea unui membru nou.
    - `PATCH /api/projects/[id]/members/[memberId]`: Schimbarea rolului.
    - `DELETE /api/projects/[id]/members/[memberId]`: Eliminarea din proiect.

### Pasul 4: Actualizarea Interfeței (Frontend)
1.  **Sidebar**: Va afișa doar proiectele permise.
2.  **Project Settings**: Adăugarea unui tab nou "Membri & Acces".
3.  **Protecție UI**:
    - Ascunderea butoanelor de "Add Task" sau "Edit Project" pentru rolul de `Viewer`.
    - Dezactivarea Drag & Drop-ului în Kanban pentru `Viewer`.

---

## 4. Riscuri și Atenuare
- **Risc**: Un utilizator pierde accesul la un proiect important.
- **Atenuare**: Workspace Owner-ul va avea întotdeauna acces la toate proiectele prin logica de "Master Access" (verificăm dacă `user.id === workspace.ownerId`).
- **Risc**: Performanță scăzută la interogări complexe.
- **Atenuare**: Folosirea indexului pe `projectId` și `userId` în modelul `ProjectMember`.

## 5. Timeline Estimat
1.  **Schema & Migrare**: 1 oră.
2.  **Logica Backend & Filtrare**: 2 ore.
3.  **Interfață Management Membri**: 2 ore.
4.  **Testare și Validare**: 1 oră.
