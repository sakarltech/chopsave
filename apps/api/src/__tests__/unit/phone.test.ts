import { describe, it, expect } from 'vitest';
import { normaliseToE164, isValidNigerianPhone } from '@chopsave/shared';

describe('Phone Number Utilities', () => {
  describe('normaliseToE164', () => {
    it('converts 08XX format to +234XX', () => {
      expect(normaliseToE164('08012345678')).toBe('+2348012345678');
    });

    it('converts 07XX format to +234XX', () => {
      expect(normaliseToE164('07012345678')).toBe('+2347012345678');
    });

    it('converts 09XX format to +234XX', () => {
      expect(normaliseToE164('09012345678')).toBe('+2349012345678');
    });

    it('handles +234 prefix correctly', () => {
      expect(normaliseToE164('+2348012345678')).toBe('+2348012345678');
    });

    it('handles 234 prefix (no +) correctly', () => {
      expect(normaliseToE164('2348012345678')).toBe('+2348012345678');
    });

    it('strips spaces and dashes', () => {
      expect(normaliseToE164('080 1234 5678')).toBe('+2348012345678');
      expect(normaliseToE164('080-1234-5678')).toBe('+2348012345678');
    });

    it('throws for invalid numbers', () => {
      expect(() => normaliseToE164('12345')).toThrow();
      expect(() => normaliseToE164('')).toThrow();
      expect(() => normaliseToE164('+1234567890')).toThrow();
    });
  });

  describe('isValidNigerianPhone', () => {
    it('returns true for valid numbers', () => {
      expect(isValidNigerianPhone('08012345678')).toBe(true);
      expect(isValidNigerianPhone('+2348012345678')).toBe(true);
      expect(isValidNigerianPhone('2348012345678')).toBe(true);
    });

    it('returns false for invalid numbers', () => {
      expect(isValidNigerianPhone('12345')).toBe(false);
      expect(isValidNigerianPhone('')).toBe(false);
      expect(isValidNigerianPhone('+1234567890')).toBe(false);
    });
  });
});
