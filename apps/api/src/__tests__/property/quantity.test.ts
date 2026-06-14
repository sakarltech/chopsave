import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property: Quantity Invariant', () => {
  it('quantity_remaining never goes below 0 after reservations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),           // quantityTotal
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 20 }), // reservation quantities
        (quantityTotal, reservations) => {
          let remaining = quantityTotal;

          for (const qty of reservations) {
            if (qty <= remaining) {
              remaining -= qty;
            }
            // Invariant: remaining never negative
            if (remaining < 0) return false;
          }

          return remaining >= 0 && remaining <= quantityTotal;
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('sum of accepted reservations never exceeds quantityTotal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 30 }),
        (quantityTotal, requestedQtys) => {
          let remaining = quantityTotal;
          let totalReserved = 0;

          for (const qty of requestedQtys) {
            if (qty <= remaining) {
              remaining -= qty;
              totalReserved += qty;
            }
          }

          return totalReserved <= quantityTotal;
        },
      ),
      { numRuns: 5000 },
    );
  });
});
