import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { generatePickupCode, calculateCommission } from '@chopsave/shared';
import { getRedis } from '../../plugins/redis';
import { pendingPaymentExpiryQueue } from '../../plugins/queue';

export interface CreateReservationBody {
  listingId: string;
  quantity: number;
}

export async function createReservationHandler(
  request: FastifyRequest<{ Body: CreateReservationBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const consumerId = request.user!.id;
  const { listingId, quantity } = request.body;

  if (!listingId) {
    reply.status(422).send({ error: 'listingId is required' });
    return;
  }
  if (!quantity || quantity < 1) {
    reply.status(422).send({ error: 'quantity must be at least 1' });
    return;
  }

  // Use transaction with FOR UPDATE to prevent race conditions
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the listing row
    const listingResult = await client.query(
      `SELECT l.id, l.business_id, l.discount_price, l.quantity_remaining, l.status, l.pickup_end,
              b.commission_rate, b.city
       FROM listings l
       JOIN businesses b ON b.id = l.business_id
       WHERE l.id = $1
       FOR UPDATE OF l`,
      [listingId],
    );

    if (listingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      reply.status(404).send({ error: 'Listing not found' });
      return;
    }

    const listing = listingResult.rows[0];

    // Validate listing is active
    if (listing.status !== 'active') {
      await client.query('ROLLBACK');
      reply.status(409).send({ error: 'Listing is no longer active' });
      return;
    }

    // Validate pickup window hasn't passed
    if (new Date(listing.pickup_end) < new Date()) {
      await client.query('ROLLBACK');
      reply.status(409).send({ error: 'Pickup window has ended' });
      return;
    }

    // Validate quantity available
    if (listing.quantity_remaining < quantity) {
      await client.query('ROLLBACK');
      reply.status(409).send({ error: `Only ${listing.quantity_remaining} remaining` });
      return;
    }

    // Calculate amounts
    const amountPaid = parseFloat(listing.discount_price) * quantity;
    const commissionRate = parseFloat(listing.commission_rate);
    const { commissionAmt, payoutAmt } = calculateCommission(amountPaid, commissionRate);

    // Generate unique pickup code
    const pickupCode = generatePickupCode();

    // Create reservation
    const reservation = await client.query(
      `INSERT INTO reservations (
         consumer_id, listing_id, business_id, quantity, amount_paid,
         commission_rate, commission_amt, payout_amt, status, pickup_code
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_payment', $9)
       RETURNING *`,
      [consumerId, listingId, listing.business_id, quantity, amountPaid,
       commissionRate, commissionAmt, payoutAmt, pickupCode],
    );

    // Decrement listing quantity
    await client.query(
      `UPDATE listings SET quantity_remaining = quantity_remaining - $1, updated_at = NOW() WHERE id = $2`,
      [quantity, listingId],
    );

    // Check if sold out
    const updatedListing = await client.query(
      `SELECT quantity_remaining FROM listings WHERE id = $1`,
      [listingId],
    );
    if (updatedListing.rows[0].quantity_remaining === 0) {
      await client.query(
        `UPDATE listings SET status = 'sold_out', updated_at = NOW() WHERE id = $1`,
        [listingId],
      );
      // Publish sold_out event
      const redis = getRedis();
      await redis.publish(`channel:listings:${listing.city}`, JSON.stringify({
        event: 'listing.sold_out',
        data: { listingId, city: listing.city },
      }));
    }

    const res = reservation.rows[0];
    await pendingPaymentExpiryQueue.add(
      'expire-reservation',
      { reservationId: res.id },
      {
        delay: 10 * 60 * 1000,
        jobId: `pending-payment:${res.id}`,
      },
    );

    await client.query('COMMIT');

    reply.status(201).send({
      id: res.id,
      listingId: res.listing_id,
      businessId: res.business_id,
      quantity: res.quantity,
      amountPaid: parseFloat(res.amount_paid),
      status: res.status,
      pickupCode: res.pickup_code,
      createdAt: res.created_at,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
