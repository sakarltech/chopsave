import { randomBytes } from 'crypto';

// Unambiguous charset — excludes I, O, 0, 1 to avoid confusion
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a cryptographically random 6-character pickup code.
 * Uses only unambiguous characters to avoid confusion at collection.
 */
export function generatePickupCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
}

/**
 * Validate pickup code format.
 */
export function isValidPickupCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}
