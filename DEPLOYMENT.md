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

## 2. Flux de Lucru CI/CD (GitHub -> Railway)

Pentru a asigura stabilitatea producției, urmăm acest proces:

1.  **Dezvoltare Locală**: Creați un branch nou pentru fiecare funcționalitate (`feature/nume-functie`).
2.  **Testare Dev**: Faceți Merge/Pull Request în branch-ul `develop`.
    - Railway va face deploy automat pe link-ul de Dev.
    - Verificați funcționalitatea și baza de date.
3.  **Lansare Prod**: Faceți Merge din `develop` în `main`.
    - Railway va face deploy automat pe link-ul de Producție.

---

## 3. Configurație Railway (Pas cu Pas)

Pentru ambele proiecte (`Alfred-Dev` și `Alfred-Prod`):

1.  **Repo**: Conectați repository-ul GitHub.
2.  **Branch**: Setați branch-ul corespunzător (`develop` sau `main`).
3.  **Volume**: Creați un Volume în Railway și montați-l la `/app/storage`.
4.  **Start Command**: `npx prisma db push && npm run start`
5.  **Variabile de Mediu**: (Vezi secțiunea 4)

---

## 4. Variabile de Mediu Necesare

Configurați următoarele variabile în panoul Railway:

- `DATABASE_URL`: `file:/app/storage/[dev|prod].db`
- `STORAGE_PATH`: `/app/storage`
- `ADMIN_EMAIL`: Email-urile administratorilor (separate prin virgulă).
- `NEXTAUTH_SECRET`: Cheie secretă (generată unic pentru fiecare mediu).
- `NEXTAUTH_URL`: URL-ul public (ex: `https://alfred-dev.up.railway.app`).
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`: Credențiale Pusher (recomandat instanțe separate pentru Dev/Prod).
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`: Integrare cu serverul de mail corporativ.

---

## 5. Mentenanță și Backup

- **SQLite**: Baza de date se află în volumul persistent. Railway oferă opțiuni de backup pentru volume.
- **Prisma**: `npx prisma db push` este folosit în comanda de start pentru a menține schema sincronizată fără a bloca deployment-ul cu migrări manuale complexe, dar pentru schimbări majore se recomandă testarea prealabilă pe Dev.
- **Cleanup**: Sistemul Alfred șterge automat fișierele fizice la ștergerea task-urilor sau proiectelor pentru a optimiza spațiul în volum.
