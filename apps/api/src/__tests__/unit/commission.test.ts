import { describe, it, expect } from 'vitest';
import { calculateCommission } from '@chopsave/shared';
import * as fc from 'fast-check';

describe('Commission Calculation', () => {
  describe('calculateCommission', () => {
    it('should calculate 18% commission correctly', () => {
      const result = calculateCommission(1000, 18);
      expect(result.commissionAmt).toBe(180);
      expect(result.payoutAmt).toBe(820);
    });

    it('should calculate 15% commission correctly', () => {
      const result = calculateCommission(2500, 15);
      expect(result.commissionAmt).toBe(375);
      expect(result.payoutAmt).toBe(2125);
    });

    it('should calculate 20% commission correctly', () => {
      const result = calculateCommission(5000, 20);
      expect(result.commissionAmt).toBe(1000);
      expect(result.payoutAmt).toBe(4000);
    });

    it('should throw for commission rate below 15', () => {
      expect(() => calculateCommission(1000, 14)).toThrow();
    });

    it('should throw for commission rate above 20', () => {
      expect(() => calculateCommission(1000, 21)).toThrow();
    });

    it('should handle small amounts', () => {
      const result = calculateCommission(100, 18);
      expect(result.commissionAmt + result.payoutAmt).toBeCloseTo(100, 1);
    });
  });

  describe('Property: commission invariant (fast-check)', () => {
    it('payoutAmt + commissionAmt === amountPaid for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000000 }), // amount in NGN (₦1 to ₦1M)
          fc.integer({ min: 15, max: 20 }),        // commission rate
          (amount, rate) => {
            const { commissionAmt, payoutAmt } = calculateCommission(amount, rate);
            return Math.abs(payoutAmt + commissionAmt - amount) < 0.01;
          },
        ),
        { numRuns: 10000 },
      );
    });

    it('commission is always positive and less than amount', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          fc.integer({ min: 15, max: 20 }),
          (amount, rate) => {
            const { commissionAmt, payoutAmt } = calculateCommission(amount, rate);
            return commissionAmt > 0 && commissionAmt < amount && payoutAmt > 0;
          },
        ),
        { numRuns: 5000 },
      );
    });
  });
});
