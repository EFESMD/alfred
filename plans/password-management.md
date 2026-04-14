# Hardened Password Management & Identity Lifecycle Plan

## Objective
Implement a robust, enterprise-grade password security system for Alfred, covering the entire lifecycle from registration and proactive changes to reactive recovery, while enforcing strict complexity rules and multi-step verification.

## 1. Security Standards & Rules
- **Complexity Threshold (The Alfred Standard):**
    - Minimum **10 characters**.
    - At least **one uppercase** (A-Z).
    - At least **one lowercase** (a-z).
    - At least **one digit** (0-9).
    - At least **one special character** (e.g., !@#$%^&*).
- **Cryptographic Security:**
    - Hashing reset tokens before storage (SHA-256).
    - Using `bcrypt` with a cost factor of 12 for password hashing.
    - High-entropy random tokens for reset links.
- **Enumeration Protection:**
    - Unified API responses for identity-related requests (e.g., "If an account exists, an email has been sent").

---

## 2. Phased Implementation Roadmap

### Phase 1: Database & Utilities (The Foundation)
1. **Schema Update:** Modify `prisma/schema.prisma` to add:
    - `resetPasswordToken` (String?, hashed).
    - `resetPasswordExp` (DateTime?).
    - `changePasswordOTP` (String?, hashed).
    - `changePasswordOTPExp` (DateTime?).
    - `lastPasswordChange` (DateTime?).
2. **Validation Logic:** Create `src/lib/password-validator.ts`:
    - Detailed `validatePassword` function returning specific rule failures.
    - Strength meter calculation logic.
3. **Email Templates:** Update/Create templates in `src/lib/mail.ts` or a new templates directory:
    - **Password Reset Link** (For "Forgot Password").
    - **Change Password OTP** (For "Change Password").
    - **Change Success Notification** (Final confirmation).

### Phase 2: Registration Enforcement
1. **Frontend:** Update `src/components/auth/AuthForm.tsx` with:
    - Real-time password requirement checklist.
    - Blocking registration if complexity is not met.
2. **Backend:** Update `src/app/api/register/route.ts` with server-side complexity validation.

### Phase 3: Forgot & Reset Password (Unauthenticated Flow)
1. **Step 1: Forgot Password API (`POST /api/auth/forgot-password`):**
    - Check user exists.
    - Generate token, hash it, save to DB with 1h expiry.
    - Send signed link: `/reset-password?token=...&email=...`.
2. **Step 2: Reset Password Page (`/reset-password`):**
    - UI to enter new password.
    - Logic to verify token/email/expiry against hashed DB version.
    - Update password and clear reset fields.

### Phase 4: Authenticated Change Password (The "Double-Lock" Flow)
1. **UI Update:** Add "Security" section to `src/app/profile/page.tsx`.
2. **Step 1: Request Change API (`POST /api/profile/password/request`):**
    - Verify `Current Password`.
    - Validate `New Password` complexity.
    - Generate/Hash 6-digit OTP and send via email.
3. **Step 2: Confirm Change API (`POST /api/profile/password/confirm`):**
    - Verify OTP and expiry.
    - Securely update password and set `lastPasswordChange`.
    - Send final "Password Changed" notification email.

### Phase 5: Housekeeping & Audit
1. **Cleanup:** Ensure all temporary tokens are wiped after use.
2. **UX Polish:** Add loading states, toast notifications for each step, and clear error messages (while maintaining security).

---

## 3. Verification & Testing Checklist
- [x] **Complexity:** Test passwords failing each requirement (10 chars, upper, lower, digit, special).
- [x] **Enumeration:** Verify forgot-password doesn't leak whether an email is registered.
- [x] **Token Expiry:** Verify reset links fail after 1 hour.
- [x] **Session Hijack:** Verify change-password fails without the email OTP.
- [x] **Database Integrity:** Verify only hashed tokens/OTPs are stored in the database.
- [x] **Mail Delivery:** Verify all 3 email types are delivered with correct content.
