import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { getRedis } from '../../plugins/redis';

export async function getMyListingsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT l.*
     FROM listings l
     JOIN businesses b ON b.id = l.business_id
     WHERE b.user_id = $1
     ORDER BY l.pickup_start DESC, l.created_at DESC`,
    [request.user!.id],
  );

  reply.status(200).send({
    listings: result.rows.map((listing) => ({
      id: listing.id,
      businessId: listing.business_id,
      type: listing.type,
      title: listing.title,
      description: listing.description,
      originalPrice: listing.original_price ? parseFloat(listing.original_price) : null,
      discountPrice: parseFloat(listing.discount_price),
      quantityTotal: listing.quantity_total,
      quantityRemaining: listing.quantity_remaining,
      pickupStart: listing.pickup_start,
      pickupEnd: listing.pickup_end,
      foodCategories: listing.food_categories,
      dietaryTags: listing.dietary_tags,
      photoUrl: listing.photo_url,
      weightKg: parseFloat(listing.weight_kg),
      status: listing.status,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
    })),
  });
}

interface UpdateListingBody {
  title?: string;
  description?: string;
  quantityTotal?: number;
  pickupStart?: string;
  pickupEnd?: string;
  dietaryTags?: string[];
}

// PATCH /listings/:id
export async function updateListingHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateListingBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;
  const body = request.body;

  // Verify ownership
  const listing = await pool.query(
    `SELECT l.id, l.business_id, b.user_id, b.city FROM listings l
     JOIN businesses b ON b.id = l.business_id
     WHERE l.id = $1`,
    [id],
  );
  if (listing.rows.length === 0 || listing.rows[0].user_id !== userId) {
    reply.status(403).send({ error: 'Listing not found or not owned by you' });
    return;
  }

  // Check no active reservations
  const reservations = await pool.query(
    `SELECT COUNT(*) as count FROM reservations WHERE listing_id = $1 AND status IN ('confirmed', 'ready')`,
    [id],
  );
  if (parseInt(reservations.rows[0].count, 10) > 0) {
    reply.status(409).send({ error: 'Cannot edit a listing with active reservations' });
    return;
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (body.title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(body.title); }
  if (body.description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(body.description); }
  if (body.quantityTotal !== undefined) {
    updates.push(`quantity_total = $${paramIndex}`);
    updates.push(`quantity_remaining = $${paramIndex++}`);
    params.push(body.quantityTotal);
  }
  if (body.pickupStart !== undefined) { updates.push(`pickup_start = $${paramIndex++}`); params.push(new Date(body.pickupStart)); }
  if (body.pickupEnd !== undefined) { updates.push(`pickup_end = $${paramIndex++}`); params.push(new Date(body.pickupEnd)); }
  if (body.dietaryTags !== undefined) { updates.push(`dietary_tags = $${paramIndex++}`); params.push(body.dietaryTags); }

  if (updates.length === 0) {
    reply.status(422).send({ error: 'No fields to update' });
    return;
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE listings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await pool.query(sql, params);

  reply.status(200).send({ listing: result.rows[0] });
}

// PATCH /listings/:id/status
interface StatusBody {
  status: 'paused' | 'active' | 'sold_out' | 'closed';
}

export async function updateListingStatusHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: StatusBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;
  const { status } = request.body;

  if (!['paused', 'active', 'sold_out', 'closed'].includes(status)) {
    reply.status(422).send({ error: 'status must be paused, active, sold_out, or closed' });
    return;
  }

  // Verify ownership
  const listing = await pool.query(
    `SELECT l.id, l.status, b.user_id, b.city FROM listings l
     JOIN businesses b ON b.id = l.business_id
     WHERE l.id = $1`,
    [id],
  );
  if (listing.rows.length === 0 || listing.rows[0].user_id !== userId) {
    reply.status(403).send({ error: 'Listing not found or not owned by you' });
    return;
  }

  const currentStatus = listing.rows[0].status;
  if (status === 'active' && currentStatus !== 'paused') {
    reply.status(409).send({ error: 'Only paused listings can be resumed' });
    return;
  }
  if (status === 'paused' && currentStatus !== 'active') {
    reply.status(409).send({ error: 'Only active listings can be paused' });
    return;
  }
  if (status === 'sold_out' && !['active', 'paused'].includes(currentStatus)) {
    reply.status(409).send({ error: 'Only active or paused listings can be marked sold out' });
    return;
  }
  if (status === 'closed' && currentStatus === 'closed') {
    reply.status(409).send({ error: 'Listing is already closed' });
    return;
  }

  await pool.query(
    `UPDATE listings
     SET status = $1,
         quantity_remaining = CASE WHEN $1 = 'sold_out' THEN 0 ELSE quantity_remaining END,
         updated_at = NOW()
     WHERE id = $2`,
    [status, id],
  );

  // Publish event for SSE
  const redis = getRedis();
  const city = listing.rows[0].city;
  if (status === 'closed' || status === 'paused' || status === 'sold_out') {
    await redis.publish(`channel:listings:${city}`, JSON.stringify({
      event: status === 'sold_out' ? 'listing.sold_out' : 'listing.expired',
      data: { listingId: id, city },
    }));
  }

  reply.status(200).send({ id, status, message: `Listing ${status}` });
}

// DELETE /listings/:id
export async function deleteListingHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;

  // Verify ownership
  const listing = await pool.query(
    `SELECT l.id, b.user_id FROM listings l
     JOIN businesses b ON b.id = l.business_id
     WHERE l.id = $1`,
    [id],
  );
  if (listing.rows.length === 0 || listing.rows[0].user_id !== userId) {
    reply.status(403).send({ error: 'Listing not found or not owned by you' });
    return;
  }

  // Check no active reservations
  const reservations = await pool.query(
    `SELECT COUNT(*) as count FROM reservations WHERE listing_id = $1 AND status IN ('confirmed', 'ready', 'pending_payment')`,
    [id],
  );
  if (parseInt(reservations.rows[0].count, 10) > 0) {
    reply.status(409).send({ error: 'Cannot delete a listing with active reservations. Cancel them first.' });
    return;
  }

  await pool.query(`DELETE FROM listings WHERE id = $1`, [id]);
  reply.status(200).send({ message: 'Listing deleted' });
}
