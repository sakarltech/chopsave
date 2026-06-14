import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

// GET /reservations
export async function getReservationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;

  const result = await pool.query(
    `SELECT r.*, l.title AS listing_title, l.type AS listing_type, l.pickup_start, l.pickup_end,
            b.name AS business_name, b.address AS business_address
     FROM reservations r
     JOIN listings l ON l.id = r.listing_id
     JOIN businesses b ON b.id = r.business_id
     WHERE r.consumer_id = $1
     ORDER BY l.pickup_start DESC`,
    [userId],
  );

  reply.status(200).send({
    reservations: result.rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      businessId: row.business_id,
      quantity: row.quantity,
      amountPaid: parseFloat(row.amount_paid),
      status: row.status,
      pickupCode: row.pickup_code,
      listingTitle: row.listing_title,
      listingType: row.listing_type,
      pickupStart: row.pickup_start,
      pickupEnd: row.pickup_end,
      businessName: row.business_name,
      businessAddress: row.business_address,
      collectedAt: row.collected_at,
      createdAt: row.created_at,
    })),
  });
}

// GET /reservations/:id
export async function getReservationDetailHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;

  const result = await pool.query(
    `SELECT r.*, l.title AS listing_title, l.type AS listing_type, l.pickup_start, l.pickup_end,
            b.name AS business_name, b.address AS business_address, b.lat AS business_lat, b.lng AS business_lng
     FROM reservations r
     JOIN listings l ON l.id = r.listing_id
     JOIN businesses b ON b.id = r.business_id
     WHERE r.id = $1 AND (r.consumer_id = $2 OR r.business_id IN (SELECT id FROM businesses WHERE user_id = $2))`,
    [id, userId],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Reservation not found' });
    return;
  }

  const row = result.rows[0];
  reply.status(200).send({
    id: row.id,
    consumerId: row.consumer_id,
    listingId: row.listing_id,
    businessId: row.business_id,
    quantity: row.quantity,
    amountPaid: parseFloat(row.amount_paid),
    commissionAmt: parseFloat(row.commission_amt),
    payoutAmt: parseFloat(row.payout_amt),
    status: row.status,
    pickupCode: row.pickup_code,
    listingTitle: row.listing_title,
    listingType: row.listing_type,
    pickupStart: row.pickup_start,
    pickupEnd: row.pickup_end,
    businessName: row.business_name,
    businessAddress: row.business_address,
    businessLat: row.business_lat ? parseFloat(row.business_lat) : null,
    businessLng: row.business_lng ? parseFloat(row.business_lng) : null,
    collectedAt: row.collected_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
  });
}
