/**
 * Normalise a Nigerian phone number to E.164 format (+234XXXXXXXXXX).
 * Accepts: 08XXXXXXXXX, 07XXXXXXXXX, 09XXXXXXXXX, +234XXXXXXXXXX, 234XXXXXXXXXX
 */
export function normaliseToE164(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+234') && cleaned.length === 14) return cleaned;
  if (cleaned.startsWith('234') && cleaned.length === 13) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 11) return `+234${cleaned.slice(1)}`;
  throw new Error(`Invalid Nigerian phone number: ${phone}`);
}

/**
 * Validate a Nigerian phone number (any accepted format).
 */
export function isValidNigerianPhone(phone: string): boolean {
  try {
    normaliseToE164(phone);
    return true;
  } catch {
    return false;
  }
}
