import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { initiateRefund } from '../../lib/paystack';
import { notificationDispatchQueue } from '../../plugins/queue';
import { NotificationType } from '@chopsave/shared';

// GET /admin/disputes
export async function getDisputesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT d.*, r.amount_paid, r.pickup_code, u.full_name AS raised_by_name
     FROM disputes d
     JOIN reservations r ON r.id = d.reservation_id
     JOIN users u ON u.id = d.raised_by
     WHERE d.status IN ('open', 'under_review')
     ORDER BY d.raised_at ASC`,
  );
  reply.status(200).send({ disputes: result.rows, total: result.rows.length });
}

// POST /admin/disputes/:id/resolve
interface ResolveBody { resolution: 'full_refund' | 'partial_refund' | 'no_refund'; resolutionNote: string; refundAmount?: number; }

export async function resolveDisputeHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: ResolveBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const adminId = request.user!.id;
  const { id } = request.params;
  const { resolution, resolutionNote, refundAmount } = request.body;

  if (!resolutionNote || resolutionNote.length < 10) {
    reply.status(422).send({ error: 'resolutionNote is required (min 10 chars)' }); return;
  }

  const dispute = await pool.query(`SELECT * FROM disputes WHERE id = $1`, [id]);
  if (dispute.rows.length === 0) { reply.status(404).send({ error: 'Dispute not found' }); return; }

  const status = resolution === 'no_refund' ? 'resolved_no_refund' : 'resolved_refund';
  await pool.query(
    `UPDATE disputes SET status = $1, resolution_note = $2, resolved_by = $3, resolved_at = NOW() WHERE id = $4`,
    [status, resolutionNote, adminId, id],
  );

  // Process refund if applicable
  if (resolution !== 'no_refund') {
    const resId = dispute.rows[0].reservation_id;
    const payment = await pool.query(
      `SELECT gateway_ref, amount FROM payments WHERE reservation_id = $1 AND status = 'successful' LIMIT 1`,
      [resId],
    );
    if (payment.rows.length > 0 && payment.rows[0].gateway_ref) {
      const refAmt = refundAmount ? Math.round(refundAmount * 100) : undefined;
      try { await initiateRefund({ transactionReference: payment.rows[0].gateway_ref, amount: refAmt }); } catch (e) { /* log */ }
    }
  }

  // Notify both parties
  await notificationDispatchQueue.add('dispute-resolved', {
    userId: dispute.rows[0].raised_by,
    type: NotificationType.DISPUTE_RESOLVED,
    title: 'Dispute Resolved',
    body: `Your dispute has been resolved: ${resolution.replace('_', ' ')}`,
    channels: ['push'],
  });

  // Log admin action
  await pool.query(
    `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason, metadata)
     VALUES ($1, 'resolve_dispute', 'dispute', $2, $3, $4)`,
    [adminId, id, resolutionNote, JSON.stringify({ resolution, refundAmount })],
  );

  reply.status(200).send({ id, status, resolution, message: 'Dispute resolved' });
}
