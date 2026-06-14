import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { notificationDispatchQueue } from '../../plugins/queue';
import { NotificationType } from '@chopsave/shared';

// GET /admin/businesses/pending
export async function getPendingBusinesses(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT b.id, b.name, b.type, b.address, b.city, b.cac_number,
            b.verification_tier, b.photo_urls, b.created_at,
            u.full_name AS owner_name, u.phone AS contact_phone
     FROM businesses b
     JOIN users u ON u.id = b.user_id
     WHERE b.verification_tier = 'pending'
     ORDER BY b.created_at ASC`,
  );

  reply.status(200).send({
    businesses: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      address: row.address,
      city: row.city,
      cacNumber: row.cac_number,
      verificationTier: row.verification_tier,
      photoUrls: row.photo_urls,
      ownerName: row.owner_name,
      contactPhone: row.contact_phone,
      createdAt: row.created_at,
    })),
    total: result.rows.length,
  });
}

// POST /admin/businesses/:id/approve
interface ApproveBody {
  tier?: 'verified_informal' | 'verified_cac';
}

export async function approveBusiness(
  request: FastifyRequest<{ Params: { id: string }; Body: ApproveBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const adminId = request.user!.id;
  const { id } = request.params;
  const { tier } = request.body;

  // Fetch business
  const bizResult = await pool.query(
    `SELECT b.id, b.user_id, b.name, b.cac_number, b.verification_tier
     FROM businesses b WHERE b.id = $1`,
    [id],
  );

  if (bizResult.rows.length === 0) {
    reply.status(404).send({ error: 'Business not found' });
    return;
  }

  const business = bizResult.rows[0];
  if (business.verification_tier !== 'pending') {
    reply.status(409).send({ error: `Business is already ${business.verification_tier}` });
    return;
  }

  // Determine verification tier (tiered verification logic — Task 4.4)
  // If admin explicitly provides a tier, use it.
  // Otherwise, auto-determine: CAC number present → verified_cac, else → verified_informal
  let verificationTier: string;
  if (tier) {
    verificationTier = tier;
  } else {
    verificationTier = business.cac_number ? 'verified_cac' : 'verified_informal';
  }

  // Update business
  await pool.query(
    `UPDATE businesses SET verification_tier = $1, updated_at = NOW() WHERE id = $2`,
    [verificationTier, id],
  );

  // Log admin action
  await pool.query(
    `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, metadata)
     VALUES ($1, 'approve_business', 'business', $2, $3)`,
    [adminId, id, JSON.stringify({ tier: verificationTier })],
  );

  // Notify business owner (push + SMS)
  await notificationDispatchQueue.add('business-approved', {
    userId: business.user_id,
    type: NotificationType.BUSINESS_APPROVED,
    title: 'Business Approved!',
    body: `Congratulations! ${business.name} has been verified on ChopSave. You can now create listings.`,
    channels: ['push', 'sms'],
  });

  reply.status(200).send({
    id: business.id,
    name: business.name,
    verificationTier,
    message: 'Business approved successfully',
  });
}

// POST /admin/businesses/:id/reject
interface RejectBody {
  reason: string;
}

export async function rejectBusiness(
  request: FastifyRequest<{ Params: { id: string }; Body: RejectBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const adminId = request.user!.id;
  const { id } = request.params;
  const { reason } = request.body;

  if (!reason || reason.trim().length < 10) {
    reply.status(422).send({ error: 'Rejection reason is required (minimum 10 characters)' });
    return;
  }

  // Fetch business
  const bizResult = await pool.query(
    `SELECT b.id, b.user_id, b.name, b.verification_tier
     FROM businesses b WHERE b.id = $1`,
    [id],
  );

  if (bizResult.rows.length === 0) {
    reply.status(404).send({ error: 'Business not found' });
    return;
  }

  const business = bizResult.rows[0];
  if (business.verification_tier !== 'pending') {
    reply.status(409).send({ error: `Business is already ${business.verification_tier}` });
    return;
  }

  // Update business
  await pool.query(
    `UPDATE businesses SET verification_tier = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
    [reason.trim(), id],
  );

  // Log admin action
  await pool.query(
    `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, reason, metadata)
     VALUES ($1, 'reject_business', 'business', $2, $3, '{}')`,
    [adminId, id, reason.trim()],
  );

  // Notify business owner
  await notificationDispatchQueue.add('business-rejected', {
    userId: business.user_id,
    type: NotificationType.BUSINESS_REJECTED,
    title: 'Business Registration Update',
    body: `Your registration for ${business.name} was not approved. Reason: ${reason.trim()}`,
    channels: ['push', 'sms'],
  });

  reply.status(200).send({
    id: business.id,
    name: business.name,
    verificationTier: 'rejected',
    reason: reason.trim(),
    message: 'Business rejected',
  });
}
