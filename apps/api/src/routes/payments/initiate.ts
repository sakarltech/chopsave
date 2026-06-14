import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { initializeTransaction } from '../../lib/paystack';
import { randomBytes } from 'crypto';

interface InitiatePaymentBody {
  reservationId: string;
  method?: string; // card, bank_transfer, ussd
}

export async function initiatePaymentHandler(
  request: FastifyRequest<{ Body: InitiatePaymentBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { reservationId, method } = request.body;

  if (!reservationId) {
    reply.status(422).send({ error: 'reservationId is required' });
    return;
  }

  // Fetch reservation
  const resResult = await pool.query(
    `SELECT r.*, u.email, u.phone
     FROM reservations r
     JOIN users u ON u.id = r.consumer_id
     WHERE r.id = $1 AND r.consumer_id = $2 AND r.status = 'pending_payment'`,
    [reservationId, userId],
  );

  if (resResult.rows.length === 0) {
    reply.status(404).send({ error: 'Reservation not found or not in pending_payment status' });
    return;
  }

  const reservation = resResult.rows[0];
  const amountKobo = Math.round(parseFloat(reservation.amount_paid) * 100);
  const reference = `cs_${randomBytes(16).toString('hex')}`;
  const email = reservation.email || `${reservation.phone}@chopsave.ng`;

  // Determine Paystack channels based on method
  let channels: string[] | undefined;
  if (method === 'ussd') channels = ['ussd'];
  else if (method === 'bank_transfer') channels = ['bank_transfer'];
  else if (method === 'card') channels = ['card'];

  // Initialize Paystack transaction
  const paystackResult = await initializeTransaction({
    email,
    amount: amountKobo,
    reference,
    channels,
    metadata: {
      reservationId,
      consumerId: userId,
      listingId: reservation.listing_id,
    },
  });

  // Create payment record
  await pool.query(
    `INSERT INTO payments (reservation_id, gateway, method, amount, status, gateway_ref)
     VALUES ($1, 'paystack', $2, $3, 'initiated', $4)`,
    [reservationId, method ?? 'card', parseFloat(reservation.amount_paid), reference],
  );

  reply.status(200).send({
    paymentUrl: paystackResult.authorization_url,
    accessCode: paystackResult.access_code,
    reference: paystackResult.reference,
  });
}
