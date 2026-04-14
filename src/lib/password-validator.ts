/**
 * Centralized password validation and strength scoring for Alfred.
 * Enforces:
 * - Minimum 10 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (!@#$%^&*)
 */

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4
  errors: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors = {
    length: password.length < 10,
    uppercase: !/[A-Z]/.test(password),
    lowercase: !/[a-z]/.test(password),
    number: !/[0-9]/.test(password),
    special: !/[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const failedRules = Object.values(errors).filter(error => error).length;
  const score = 5 - failedRules;

  return {
    isValid: failedRules === 0,
    score: Math.max(0, score - 1), // Returns 0-4
    errors,
  };
}

export const PASSWORD_REQUIREMENTS = [
  { label: "At least 10 characters", key: "length" as const },
  { label: "At least one uppercase letter", key: "uppercase" as const },
  { label: "At least one lowercase letter", key: "lowercase" as const },
  { label: "At least one number", key: "number" as const },
  { label: "At least one special character", key: "special" as const },
];
