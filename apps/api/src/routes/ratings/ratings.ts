import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

interface SubmitRatingBody {
  reservationId: string;
  stars: number;
  review?: string;
  flagTag?: string;
}

// POST /ratings
export async function submitRatingHandler(
  request: FastifyRequest<{ Body: SubmitRatingBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const raterId = request.user!.id;
  const { reservationId, stars, review, flagTag } = request.body;

  if (!reservationId) { reply.status(422).send({ error: 'reservationId is required' }); return; }
  if (!stars || stars < 1 || stars > 5) { reply.status(422).send({ error: 'stars must be 1-5' }); return; }
  if (review && review.length > 300) { reply.status(422).send({ error: 'review must be max 300 characters' }); return; }

  // Fetch reservation
  const resResult = await pool.query(
    `SELECT r.id, r.consumer_id, r.business_id, r.status, b.user_id AS business_owner_id
     FROM reservations r JOIN businesses b ON b.id = r.business_id WHERE r.id = $1`,
    [reservationId],
  );
  if (resResult.rows.length === 0) { reply.status(404).send({ error: 'Reservation not found' }); return; }
  const reservation = resResult.rows[0];

  if (!['completed', 'no_show'].includes(reservation.status)) {
    reply.status(409).send({ error: 'Can only rate completed or no_show reservations' }); return;
  }

  // Determine ratee
  let rateeId: string;
  let rateeType: string;
  if (raterId === reservation.consumer_id) {
    rateeId = reservation.business_owner_id;
    rateeType = 'business';
  } else if (raterId === reservation.business_owner_id) {
    rateeId = reservation.consumer_id;
    rateeType = 'consumer';
  } else {
    reply.status(403).send({ error: 'You are not a party to this reservation' }); return;
  }

  // Check duplicate (UNIQUE constraint will also catch this)
  const existing = await pool.query(
    `SELECT id FROM ratings WHERE reservation_id = $1 AND rater_id = $2`,
    [reservationId, raterId],
  );
  if (existing.rows.length > 0) {
    reply.status(409).send({ error: 'You have already rated this reservation' }); return;
  }

  // Insert rating
  const result = await pool.query(
    `INSERT INTO ratings (reservation_id, rater_id, ratee_id, ratee_type, stars, review, flag_tag)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [reservationId, raterId, rateeId, rateeType, stars, review ?? null, flagTag ?? null],
  );

  // If rating a business, recalculate aggregate
  if (rateeType === 'business') {
    await pool.query(
      `UPDATE businesses SET
         avg_rating = (SELECT COALESCE(AVG(stars), 0) FROM ratings WHERE ratee_id = $1 AND ratee_type = 'business'),
         total_ratings = (SELECT COUNT(*) FROM ratings WHERE ratee_id = $1 AND ratee_type = 'business'),
         updated_at = NOW()
       WHERE user_id = $1`,
      [rateeId],
    );
  }

  // If no_show flag, increment consumer no_show_count
  if (flagTag === 'No Show' && rateeType === 'consumer') {
    await pool.query(`UPDATE users SET no_show_count = no_show_count + 1, updated_at = NOW() WHERE id = $1`, [rateeId]);
  }

  reply.status(201).send({ rating: result.rows[0] });
}

// GET /businesses/:id/ratings
export async function getBusinessRatingsHandler(
  request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const { id } = request.params;
  const page = parseInt(request.query.page ?? '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Get business user_id
  const bizResult = await pool.query(`SELECT user_id FROM businesses WHERE id = $1`, [id]);
  if (bizResult.rows.length === 0) { reply.status(404).send({ error: 'Business not found' }); return; }
  const businessUserId = bizResult.rows[0].user_id;

  const result = await pool.query(
    `SELECT r.*, u.display_name AS rater_name
     FROM ratings r JOIN users u ON u.id = r.rater_id
     WHERE r.ratee_id = $1 AND r.ratee_type = 'business'
     ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
    [businessUserId, limit, offset],
  );

  reply.status(200).send({
    ratings: result.rows.map((row) => ({
      id: row.id,
      stars: row.stars,
      review: row.review,
      raterName: row.rater_name ?? 'Anonymous',
      createdAt: row.created_at,
    })),
    page,
    limit,
  });
}
