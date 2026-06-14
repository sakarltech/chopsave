/**
 * Calculate commission and payout amounts for a transaction.
 * Enforces the invariant: |payoutAmt + commissionAmt - amountPaid| < 0.01
 */
export function calculateCommission(
  amountPaid: number,
  commissionRatePercent: number,
): { commissionAmt: number; payoutAmt: number } {
  if (commissionRatePercent < 15 || commissionRatePercent > 20) {
    throw new Error(`Commission rate must be between 15 and 20, got ${commissionRatePercent}`);
  }
  const commissionAmt = Math.round(amountPaid * commissionRatePercent) / 100;
  const payoutAmt = amountPaid - commissionAmt;
  if (Math.abs(payoutAmt + commissionAmt - amountPaid) >= 0.01) {
    throw new Error('Commission invariant violated: payoutAmt + commissionAmt !== amountPaid');
  }
  return { commissionAmt, payoutAmt };
}
