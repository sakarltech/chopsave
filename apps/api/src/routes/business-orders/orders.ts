import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { notificationDispatchQueue } from '../../plugins/queue';
import { NotificationType } from '@chopsave/shared';

// GET /business/orders — Today's reservations for the business
export async function getBusinessOrdersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;

  // Get the business for this user
  const bizResult = await pool.query(
    `SELECT id FROM businesses WHERE user_id = $1`,
    [userId],
  );
  if (bizResult.rows.length === 0) {
    reply.status(404).send({ error: 'No business found for this user' });
    return;
  }
  const businessId = bizResult.rows[0].id;

  // Get today's reservations (WAT timezone)
  const result = await pool.query(
    `SELECT r.id, r.quantity, r.amount_paid, r.status, r.pickup_code, r.created_at,
            l.title AS listing_title, l.type AS listing_type, l.pickup_start, l.pickup_end,
            u.display_name AS consumer_name, u.no_show_count
     FROM reservations r
     JOIN listings l ON l.id = r.listing_id
     JOIN users u ON u.id = r.consumer_id
     WHERE r.business_id = $1
       AND r.status IN ('confirmed', 'ready', 'completed', 'no_show')
       AND DATE(l.pickup_start AT TIME ZONE 'Africa/Lagos') = DATE(NOW() AT TIME ZONE 'Africa/Lagos')
     ORDER BY l.pickup_start ASC`,
    [businessId],
  );

  reply.status(200).send({
    orders: result.rows.map((row) => ({
      id: row.id,
      quantity: row.quantity,
      amountPaid: parseFloat(row.amount_paid),
      status: row.status,
      pickupCodeLast4: row.pickup_code.slice(-4),
      consumerName: row.consumer_name ?? 'Customer',
      consumerNoShowCount: row.no_show_count,
      listingTitle: row.listing_title,
      listingType: row.listing_type,
      pickupStart: row.pickup_start,
      pickupEnd: row.pickup_end,
      createdAt: row.created_at,
    })),
    total: result.rows.length,
  });
}

// PATCH /business/orders/:id/ready — Mark order as ready for pickup
export async function markOrderReadyHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id } = request.params;

  // Verify ownership and status
  const result = await pool.query(
    `SELECT r.id, r.status, r.consumer_id, b.user_id AS business_owner_id, b.name AS business_name
     FROM reservations r
     JOIN businesses b ON b.id = r.business_id
     WHERE r.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Reservation not found' });
    return;
  }

  const reservation = result.rows[0];

  if (reservation.business_owner_id !== userId) {
    reply.status(403).send({ error: 'Not your reservation' });
    return;
  }

  if (reservation.status !== 'confirmed') {
    reply.status(409).send({ error: `Can only mark confirmed orders as ready. Current status: ${reservation.status}` });
    return;
  }

  await pool.query(
    `UPDATE reservations SET status = 'ready', updated_at = NOW() WHERE id = $1`,
    [id],
  );

  // Notify consumer
  await notificationDispatchQueue.add('order-ready', {
    userId: reservation.consumer_id,
    type: NotificationType.ORDER_READY,
    title: 'Your Order is Ready!',
    body: `${reservation.business_name} has your food ready for pickup.`,
    channels: ['push', 'sms'],
    payload: { reservationId: id },
  });

  reply.status(200).send({ id, status: 'ready', message: 'Order marked as ready for pickup' });
}
