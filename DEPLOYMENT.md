# Oxana - Strategie de Deployment și Infrastructură

Acest document descrie planul de lansare și evoluție a infrastructurii pentru platforma Oxana.

## Faza 1: Testare Real-World (Railway)
**Scop:** Lansarea rapidă pentru feedback de la colegi.

- **Platformă:** [Railway.app](https://railway.app)
- **Bază de Date:** SQLite (`dev.db`) în volum persistent.
- **Stocare Fișiere:** Unificată în volum persistent (via `STORAGE_PATH`).
- **Configurație Critică:**
    - Utilizarea unui **singur Railway Volume** montat la `/app/storage`.
    - **Start Command**: `npx prisma db push && npm run start`
- **Securitate Date:** Fișierul `prisma/dev.db` este inclus în `.gitignore`.

### ⚠️ IMPORTANT: Pas post-deploy (Migrare Roluri)
După implementarea sistemului de **Private Projects**, este obligatoriu să executați migrarea datelor pe serverul live:
1. Accesați panoul de **System Admin** (vizibil doar pentru `ADMIN_EMAIL`).
2. Apăsați butonul **"Run Project Roles Migration"**.
3. Acest pas va popula tabela de permisiuni și va restabili accesul utilizatorilor la proiectele lor.

## Variabile de Mediu Necesare (Railway)
- `DATABASE_URL`: `file:/app/storage/dev.db`
- `STORAGE_PATH`: `/app/storage`
- `ADMIN_EMAIL`: Email-ul pentru acces Super Admin (Master Dashboard)
- `NEXTAUTH_SECRET`: Cheia de securitate pentru sesiuni
- `NEXTAUTH_URL`: URL-ul public al aplicației
- `PUSHER_*`: Credențiale pentru sincronizarea în timp real.
- `MAIL_*`: Integrare cu serverul de mail corporativ.

## Configurare Volum Persistent (Railway)
- **Mount Path:** `/app/storage`
- **Conținut:** Acest folder va conține automat `dev.db` și subfolderul `uploads/`.
- **Servire Fișiere:** Fișierele sunt servite din volum prin ruta `/src/app/uploads/[...path]/route.ts`.
