# Ghid de Deployment Alfred: Dev vs Prod

Acest document este ghidul tău pas cu pas pentru gestionarea proiectului Alfred folosind branch-uri (ramuri) în Git și deployment pe Railway.

## 1. Conceptul de "Branching" (Ramificarea)

Imaginează-ți proiectul tău ca pe o linie a timpului. În mod normal, ai o singură linie: **`main`**. Tot ce pui acolo apare pe site-ul oficial.

Pentru a fi în siguranță, vom crea o a doua linie numită **`develop`**.

### Cum funcționează fluxul de lucru:
1.  **Dezvoltare (`develop`)**: Aici lucrezi în fiecare zi. Adaugi butoane, repari bug-uri și faci teste.
2.  **Testare (Railway Dev)**: Când urci codul pe `develop`, Railway va actualiza automat site-ul de test (ex: `dev.alfred.md`). Aici poți vedea dacă totul e OK fără să strici site-ul principal.
3.  **Lansare (`main`)**: Doar când ești 100% sigur că totul funcționează pe Dev, "mutăm" codul de pe `develop` pe `main`. Atunci Railway va actualiza site-ul oficial (ex: `alfred.md`).

---

## 2. Cum folosești VS Code pentru Git (Fără terminal)

În loc să scrii comenzi, poți folosi butoanele din VS Code:

### Schimbarea între ramuri (Branch-uri):
- În colțul din **stânga-jos** al ferestrei VS Code, vei vedea numele branch-ului curent (ex: `main` sau `develop`).
- Click pe el -> Se deschide o listă sus -> Selectează branch-ul pe care vrei să lucrezi.

### Salvarea modificărilor (Commit):
- Mergi la iconița de **Source Control** (cea care arată ca un grafic cu 3 puncte în stânga).
- Scrie mesajul în căsuța "Message".
- Apasă butonul albastru **Commit**.

### Trimiterea pe GitHub (Push):
- După ce ai făcut Commit, va apărea un buton **Sync Changes** sau un cerculeț cu o săgeată lângă numele branch-ului jos. Apasă pe el.

---

## 3. Fluxul tău zilnic în VS Code

Vei crea **două proiecte separate** în Railway:

### Proiectul 1: Alfred-Dev
- **Link GitHub**: Același repository.
- **Branch**: Setezi `develop`.
- **Baza de date**: SQLite (`dev.db`).
- **Scop**: Testare.

### Proiectul 2: Alfred-Prod
- **Link GitHub**: Același repository.
- **Branch**: Setezi `main`.
- **Baza de date**: SQLite (`prod.db`).
- **Scop**: Utilizare oficială.

---

## 4. Checklist: Variabile de Mediu (ENV)

Fiecare proiect (Dev și Prod) va avea propriile sale variabile. Asigură-te că le setezi pe ambele:

| Variabilă | Valoare pentru Dev | Valoare pentru Prod |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:/app/storage/dev.db` | `file:/app/storage/prod.db` |
| `STORAGE_PATH` | `/app/storage` | `/app/storage` |
| `NEXTAUTH_URL` | URL de test (Dev) | URL final (Prod) |
| `EMAIL_SERVER_HOST` | `mail.efes.md` | `mail.efes.md` |
| `EMAIL_SERVER_USER` | `noreply@efes.md` | `noreply@efes.md` |

---

## 5. Cum faci un update în viitor? (Procesul tău zilnic)

1.  Te asiguri că ești pe `develop`: `git checkout develop`.
2.  Faci modificările în cod.
3.  Le urci pe GitHub: `git add .`, `git commit -m "Mesaj"`, `git push origin develop`.
4.  Verifici pe Railway Dev (site-ul de test).
5.  Dacă e totul bine, unești cu main:
    - `git checkout main` (te muți pe ramura principală).
    - `git merge develop` (aduci codul nou).
    - `git push origin main` (trimite pe site-ul oficial).
