import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

function serializeBusiness(business: Record<string, unknown>) {
  return {
    id: business.id,
    name: business.name,
    type: business.type,
    description: business.description,
    address: business.address,
    city: business.city,
    lat: parseFloat(String(business.lat)),
    lng: parseFloat(String(business.lng)),
    verificationTier: business.verification_tier,
    photoUrls: business.photo_urls,
    avgRating: parseFloat(String(business.avg_rating ?? '0')),
    totalRatings: business.total_ratings,
    foodSavedKg: parseFloat(String(business.food_saved_kg ?? '0')),
    co2SavedKg: parseFloat(String(business.co2_saved_kg ?? '0')),
    activeListingCount: Number(business.active_listing_count ?? 0),
    rejectionReason: business.rejection_reason,
    createdAt: business.created_at,
  };
}

const BUSINESS_WITH_LISTING_COUNT = `SELECT b.id, b.name, b.type, b.description, b.address, b.city, b.lat, b.lng,
            b.verification_tier, b.photo_urls, b.avg_rating, b.total_ratings,
            b.food_saved_kg, b.co2_saved_kg, b.rejection_reason, b.created_at,
            COUNT(l.id) FILTER (WHERE l.status = 'active') AS active_listing_count
     FROM businesses b
     LEFT JOIN listings l ON l.business_id = b.id`;

// GET /businesses/me — Authenticated business owner profile, including pending/rejected businesses.
export async function getMyBusinessHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    `${BUSINESS_WITH_LISTING_COUNT}
     WHERE b.user_id = $1
     GROUP BY b.id`,
    [request.user!.id],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Business not found' });
    return;
  }

  reply.status(200).send(serializeBusiness(result.rows[0]));
}

// GET /businesses/:id — Public business profile
export async function getBusinessHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const { id } = request.params;

  const result = await pool.query(
    `${BUSINESS_WITH_LISTING_COUNT}
     WHERE b.id = $1 AND b.verification_tier IN ('verified_informal', 'verified_cac')
     GROUP BY b.id`,
    [id],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Business not found' });
    return;
  }

  reply.status(200).send(serializeBusiness(result.rows[0]));
}

// PATCH /businesses/:id — Update business profile (owner or admin)
interface UpdateBusinessBody {
  description?: string;
  photoUrls?: string[];
  address?: string;
  contactPhone?: string;
}

export async function updateBusinessHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateBusinessBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const { id } = request.params;
  const userId = request.user!.id;
  const userRole = request.user!.role;
  const { description, photoUrls, address } = request.body;

  // Verify ownership (unless admin)
  if (userRole !== 'admin') {
    const ownership = await pool.query(
      `SELECT id FROM businesses WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (ownership.rows.length === 0) {
      reply.status(403).send({ error: 'You can only update your own business' });
      return;
    }
  }

  const updates: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(description);
  }
  if (photoUrls !== undefined) {
    updates.push(`photo_urls = $${paramIndex++}`);
    params.push(photoUrls);
  }
  if (address !== undefined) {
    updates.push(`address = $${paramIndex++}`);
    params.push(address);
  }

  if (updates.length === 0) {
    reply.status(422).send({ error: 'No fields to update' });
    return;
  }

  updates.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, description, photo_urls, address, updated_at`;
  const result = await pool.query(sql, params);

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Business not found' });
    return;
  }

  const biz = result.rows[0];
  reply.status(200).send({
    id: biz.id,
    name: biz.name,
    description: biz.description,
    photoUrls: biz.photo_urls,
    address: biz.address,
    updatedAt: biz.updated_at,
  });
}
