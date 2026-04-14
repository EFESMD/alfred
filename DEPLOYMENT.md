# Alfred - Strategie de Deployment Corporativ (Railway)

Acest document descrie configurația finală pentru platforma Alfred, utilizând două medii izolate pe Railway (Dev și Prod) sub contul corporativ.

## 1. Arhitectura Mediilor

| Caracteristică | Mediu de Dezvoltare (Dev) | Mediu de Producție (Prod) |
| :--- | :--- | :--- |
| **Railway Project** | `Alfred-Dev` | `Alfred-Prod` |
| **Git Branch** | `develop` | `main` |
| **Bază de Date** | SQLite (`dev.db`) în `/app/storage` | SQLite (`prod.db`) în `/app/storage` |
| **Uploads** | `/app/storage/uploads` (Test) | `/app/storage/uploads` (Real) |
| **Deployment** | Automat la push pe `develop` | Automat la push pe `main` |

---

## 2. Cum folosești VS Code pentru Git (Fără terminal)

În loc să scrii comenzi, poți folosi butoanele din VS Code pentru a gestiona codul:

### Schimbarea între ramuri (Branch-uri):
- În colțul din **stânga-jos** al ferestrei VS Code, vei vedea numele branch-ului curent (ex: `main` sau `develop`).
- Click pe el -> Se deschide o listă sus -> Selectează branch-ul pe care vrei să lucrezi.

### Salvarea modificărilor (Commit):
- Mergi la iconița de **Source Control** din bara laterală stângă (pictograma cu 3 puncte unite).
- Scrie un mesaj descriptiv în căsuța "Message".
- Apasă butonul albastru **Commit**.

### Trimiterea pe GitHub (Push):
- După Commit, apasă butonul **Sync Changes** sau cerculețul cu o săgeată de lângă numele branch-ului (jos) pentru a trimite codul pe server.

---

## 3. Flux de Lucru CI/CD (GitHub -> Railway)

Pentru a asigura stabilitatea producției, urmăm acest proces:

1.  **Dezvoltare Locală**: Lucrează pe branch-ul `develop`.
2.  **Testare Dev**: Fă push pe `develop`.
    - Railway va face deploy automat pe mediul de Dev.
    - Verificați funcționalitatea și baza de date.
3.  **Lansare Prod**: Când totul e OK, unește `develop` cu `main` în VS Code și fă push pe `main`.
    - Railway va face deploy automat pe mediul de Producție.

---

## 4. Configurație Railway (Pas cu Pas)

Pentru ambele proiecte (`Alfred-Dev` și `Alfred-Prod`):

1.  **Repo**: Conectați repository-ul GitHub.
2.  **Branch**: Setați branch-ul corespunzător (`develop` sau `main`).
3.  **Volume**: Creați un Volume în Railway și montați-l la `/app/storage`.
4.  **Start Command**: `npm run start:railway`
5.  **Variabile de Mediu**: (Vezi secțiunea 5)

---

## 5. Checklist: Variabile de Mediu (ENV)

Configurați următoarele variabile în panoul Railway pentru fiecare proiect:

| Variabilă | Valoare pentru Dev | Valoare pentru Prod |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:/app/storage/dev.db` | `file:/app/storage/prod.db` |
| `STORAGE_PATH` | `/app/storage` | `/app/storage` |
| `NEXTAUTH_URL` | URL-ul public de test (Dev) | URL-ul public final (Prod) |
| `EMAIL_SERVER_HOST` | `mail.efes.md` | `mail.efes.md` |
| `EMAIL_SERVER_USER` | `noreply@efes.md` | `noreply@efes.md` |
| `ADMIN_EMAIL` | Email-urile adminilor | Email-urile adminilor |
| `NEXTAUTH_SECRET` | Cheie unică | Cheie unică |
| `PUSHER_*` | Credențiale Pusher | Credențiale Pusher |

---

## 6. Mentenanță și Backup

- **SQLite**: Baza de date se află în volumul persistent. Railway oferă opțiuni de backup pentru volume.
- **Prisma**: `npx prisma db push` este folosit în comanda de start pentru a menține schema sincronizată fără a bloca deployment-ul cu migrări manuale complexe.
- **Cleanup**: Sistemul Alfred șterge automat fișierele fizice la ștergerea task-urilor sau proiectelor pentru a optimiza spațiul în volum.
