import { describe, it, expect } from 'vitest';
import { generatePickupCode, isValidPickupCode } from '@chopsave/shared';
import * as fc from 'fast-check';

describe('PickupCodeService', () => {
  describe('generatePickupCode', () => {
    it('should generate a 6-character code', () => {
      const code = generatePickupCode();
      expect(code).toHaveLength(6);
    });

    it('should only contain unambiguous characters (no I, O, 0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const code = generatePickupCode();
        expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      }
    });

    it('should generate unique codes (probabilistic — 10,000 codes)', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 10000; i++) {
        codes.add(generatePickupCode());
      }
      // With 30^6 = 729 million possible codes, 10K should have zero collisions
      expect(codes.size).toBe(10000);
    });
  });

  describe('isValidPickupCode', () => {
    it('should validate correct codes', () => {
      expect(isValidPickupCode('X7K4MR')).toBe(true);
      expect(isValidPickupCode('AB23CD')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidPickupCode('ABCDE')).toBe(false); // too short
      expect(isValidPickupCode('ABCDEFG')).toBe(false); // too long
      expect(isValidPickupCode('ABCDE0')).toBe(false); // contains 0
      expect(isValidPickupCode('ABCDE1')).toBe(false); // contains 1
      expect(isValidPickupCode('ABCDEI')).toBe(false); // contains I
      expect(isValidPickupCode('ABCDEO')).toBe(false); // contains O
      expect(isValidPickupCode('abcdef')).toBe(false); // lowercase
    });
  });

  describe('Property: pickup code uniqueness (fast-check)', () => {
    it('all generated codes match the unambiguous charset regex', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (_n) => {
          const code = generatePickupCode();
          return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
        }),
        { numRuns: 1000 },
      );
    });

    it('1000 generated codes are all distinct', () => {
      const codes: string[] = [];
      fc.assert(
        fc.property(fc.constant(null), () => {
          codes.push(generatePickupCode());
          return true;
        }),
        { numRuns: 1000 },
      );
      expect(new Set(codes).size).toBe(codes.length);
    });
  });
});
