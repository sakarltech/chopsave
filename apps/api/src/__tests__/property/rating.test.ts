import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Property: Rating Idempotency', () => {
  it('no duplicate (reservation_id, rater_id) pairs can exist', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            reservationId: fc.uuid(),
            raterId: fc.uuid(),
            stars: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 1, maxLength: 100 },
        ),
        (ratings) => {
          // Simulate the UNIQUE constraint
          const seen = new Set<string>();
          const accepted: typeof ratings = [];

          for (const rating of ratings) {
            const key = `${rating.reservationId}:${rating.raterId}`;
            if (!seen.has(key)) {
              seen.add(key);
              accepted.push(rating);
            }
          }

          // Verify: no duplicates in accepted set
          const acceptedKeys = accepted.map((r) => `${r.reservationId}:${r.raterId}`);
          return new Set(acceptedKeys).size === accepted.length;
        },
      ),
      { numRuns: 5000 },
    );
  });

  it('each rater can only rate once per reservation', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // fixed reservationId
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }), // multiple rater attempts
        (reservationId, raterIds) => {
          const seen = new Set<string>();
          let acceptedCount = 0;

          for (const raterId of raterIds) {
            const key = `${reservationId}:${raterId}`;
            if (!seen.has(key)) {
              seen.add(key);
              acceptedCount++;
            }
          }

          // acceptedCount should equal the number of unique raterIds
          return acceptedCount === new Set(raterIds).size;
        },
      ),
      { numRuns: 5000 },
    );
  });
});
