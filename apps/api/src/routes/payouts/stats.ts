import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

// GET /businesses/:id/stats
export async function getBusinessStatsHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;

  // Verify ownership
  const bizResult = await pool.query(
    `SELECT * FROM businesses WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  if (bizResult.rows.length === 0) { reply.status(403).send({ error: 'Not your business' }); return; }
  const business = bizResult.rows[0];

  // Revenue stats
  const revenueResult = await pool.query(
    `SELECT
       COALESCE(SUM(amount_paid), 0) AS gross_total,
       COALESCE(SUM(commission_amt), 0) AS commission_total,
       COALESCE(SUM(payout_amt), 0) AS net_total,
       COUNT(*) AS total_completed
     FROM reservations
     WHERE business_id = $1 AND status = 'completed'`,
    [id],
  );
  const revenue = revenueResult.rows[0];

  // Today's stats
  const todayResult = await pool.query(
    `SELECT COUNT(*) AS today_reservations,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN payout_amt ELSE 0 END), 0) AS today_revenue
     FROM reservations
     WHERE business_id = $1 AND DATE(created_at AT TIME ZONE 'Africa/Lagos') = DATE(NOW() AT TIME ZONE 'Africa/Lagos')`,
    [id],
  );

  // Active listings count
  const listingsResult = await pool.query(
    `SELECT COUNT(*) AS active_count FROM listings WHERE business_id = $1 AND status = 'active'`,
    [id],
  );

  // 30-day daily breakdown
  const dailyResult = await pool.query(
    `SELECT DATE(collected_at AT TIME ZONE 'Africa/Lagos') AS day,
       COUNT(*) AS completed, COALESCE(SUM(payout_amt), 0) AS revenue
     FROM reservations
     WHERE business_id = $1 AND status = 'completed' AND collected_at > NOW() - INTERVAL '30 days'
     GROUP BY day ORDER BY day ASC`,
    [id],
  );

  reply.status(200).send({
    activeListings: parseInt(listingsResult.rows[0].active_count, 10),
    todayReservations: parseInt(todayResult.rows[0].today_reservations, 10),
    todayRevenue: parseFloat(todayResult.rows[0].today_revenue),
    totalCompleted: parseInt(revenue.total_completed, 10),
    grossRevenue: parseFloat(revenue.gross_total),
    commissionTotal: parseFloat(revenue.commission_total),
    netRevenue: parseFloat(revenue.net_total),
    payoutBalance: parseFloat(business.payout_balance),
    foodSavedKg: parseFloat(business.food_saved_kg),
    co2SavedKg: parseFloat(business.co2_saved_kg),
    dailyBreakdown: dailyResult.rows.map((r) => ({
      day: r.day,
      completed: parseInt(r.completed, 10),
      revenue: parseFloat(r.revenue),
    })),
  });
}
