import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { getRedis } from '../../plugins/redis';

// GET /admin/analytics
export async function getAnalyticsHandler(
  request: FastifyRequest<{ Querystring: { city?: string; days?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const redis = getRedis();
  const { city, days } = request.query;
  const dateRange = parseInt(days ?? '30', 10);

  // Check cache (15-min TTL)
  const cacheKey = `admin:analytics:${city ?? 'all'}:${dateRange}`;
  const cached = await redis.get(cacheKey);
  if (cached) { reply.status(200).send(JSON.parse(cached)); return; }

  // Total counts
  const cityFilter = city ? `AND b.city = '${city}'` : '';
  const consumers = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'consumer' AND status = 'active'`);
  const businesses = await pool.query(`SELECT COUNT(*) FROM businesses WHERE verification_tier IN ('verified_informal','verified_cac') ${cityFilter}`);
  const reservations = await pool.query(`SELECT COUNT(*) FROM reservations`);
  const completed = await pool.query(`SELECT COUNT(*) FROM reservations WHERE status = 'completed'`);
  const commission = await pool.query(`SELECT COALESCE(SUM(commission_amt), 0) AS total FROM reservations WHERE status = 'completed'`);
  const foodSaved = await pool.query(`SELECT COALESCE(SUM(food_saved_kg), 0) AS total FROM businesses ${city ? `WHERE city = '${city}'` : ''}`);

  // Daily time-series
  const daily = await pool.query(
    `SELECT DATE(r.created_at AT TIME ZONE 'Africa/Lagos') AS day,
       COUNT(*) AS reservations, COALESCE(SUM(r.commission_amt), 0) AS commission
     FROM reservations r
     ${city ? `JOIN businesses b ON b.id = r.business_id WHERE b.city = '${city}' AND` : 'WHERE'}
     r.created_at > NOW() - INTERVAL '${dateRange} days'
     GROUP BY day ORDER BY day ASC`,
  );

  const result = {
    totalConsumers: parseInt(consumers.rows[0].count, 10),
    totalBusinesses: parseInt(businesses.rows[0].count, 10),
    totalReservations: parseInt(reservations.rows[0].count, 10),
    totalCompleted: parseInt(completed.rows[0].count, 10),
    totalCommission: parseFloat(commission.rows[0].total),
    totalFoodSavedKg: parseFloat(foodSaved.rows[0].total),
    dailyBreakdown: daily.rows.map((r) => ({
      day: r.day, reservations: parseInt(r.reservations, 10), commission: parseFloat(r.commission),
    })),
  };

  await redis.setex(cacheKey, 900, JSON.stringify(result)); // 15-min cache
  reply.status(200).send(result);
}
