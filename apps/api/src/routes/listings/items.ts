import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

export interface AddItemBody {
  name: string;
  description?: string;
  originalPrice?: number;
  discountPrice: number;
  quantity: number;
  dietaryTags?: string[];
  photoUrl?: string;
}

// POST /listings/:id/items
export async function addListingItemHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: AddItemBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id: listingId } = request.params;
  const body = request.body;

  // Verify ownership and type
  const listing = await pool.query(
    `SELECT l.id, l.type, b.user_id FROM listings l
     JOIN businesses b ON b.id = l.business_id
     WHERE l.id = $1`,
    [listingId],
  );
  if (listing.rows.length === 0 || listing.rows[0].user_id !== userId) {
    reply.status(403).send({ error: 'Listing not found or not owned by you' });
    return;
  }
  if (listing.rows[0].type !== 'itemised') {
    reply.status(422).send({ error: 'Items can only be added to itemised listings' });
    return;
  }

  // Check item count limit
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM listing_items WHERE listing_id = $1`,
    [listingId],
  );
  if (parseInt(countResult.rows[0].count, 10) >= 20) {
    reply.status(422).send({ error: 'Maximum 20 items per listing reached' });
    return;
  }

  if (!body.name || body.name.length < 3 || body.name.length > 100) {
    reply.status(422).send({ error: 'Item name must be 3-100 characters' });
    return;
  }
  if (!body.discountPrice || body.discountPrice <= 0) {
    reply.status(422).send({ error: 'discountPrice must be greater than 0' });
    return;
  }
  if (!body.quantity || body.quantity < 1) {
    reply.status(422).send({ error: 'quantity must be at least 1' });
    return;
  }

  const result = await pool.query(
    `INSERT INTO listing_items (listing_id, name, description, original_price, discount_price, quantity_total, quantity_remaining, dietary_tags, photo_url)
     VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8)
     RETURNING *`,
    [listingId, body.name, body.description ?? null, body.originalPrice ?? null, body.discountPrice, body.quantity, body.dietaryTags ?? [], body.photoUrl ?? null],
  );

  reply.status(201).send({ item: result.rows[0] });
}

// PATCH /listings/:id/items/:itemId
export async function updateListingItemHandler(
  request: FastifyRequest<{ Params: { id: string; itemId: string }; Body: Partial<AddItemBody> }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id: listingId, itemId } = request.params;

  // Verify ownership
  const listing = await pool.query(
    `SELECT l.id, b.user_id FROM listings l JOIN businesses b ON b.id = l.business_id WHERE l.id = $1`,
    [listingId],
  );
  if (listing.rows.length === 0 || listing.rows[0].user_id !== userId) {
    reply.status(403).send({ error: 'Not authorized' });
    return;
  }

  const body = request.body;
  const updates: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (body.name !== undefined) { updates.push(`name = $${idx++}`); params.push(body.name); }
  if (body.description !== undefined) { updates.push(`description = $${idx++}`); params.push(body.description); }
  if (body.discountPrice !== undefined) { updates.push(`discount_price = $${idx++}`); params.push(body.discountPrice); }
  if (body.quantity !== undefined) { updates.push(`quantity_total = $${idx}`); updates.push(`quantity_remaining = $${idx++}`); params.push(body.quantity); }
  if (body.dietaryTags !== undefined) { updates.push(`dietary_tags = $${idx++}`); params.push(body.dietaryTags); }
  if (body.photoUrl !== undefined) { updates.push(`photo_url = $${idx++}`); params.push(body.photoUrl); }

  if (updates.length === 0) { reply.status(422).send({ error: 'No fields to update' }); return; }

  updates.push(`updated_at = NOW()`);
  params.push(itemId);
  params.push(listingId);

  const sql = `UPDATE listing_items SET ${updates.join(', ')} WHERE id = $${idx++} AND listing_id = $${idx} RETURNING *`;
  const result = await pool.query(sql, params);

  if (result.rows.length === 0) { reply.status(404).send({ error: 'Item not found' }); return; }
  reply.status(200).send({ item: result.rows[0] });
}

// DELETE /listings/:id/items/:itemId
export async function deleteListingItemHandler(
  request: FastifyRequest<{ Params: { id: string; itemId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { id: listingId, itemId } = request.params;

  const listing = await pool.query(
    `SELECT l.id, b.user_id FROM listings l JOIN businesses b ON b.id = l.business_id WHERE l.id = $1`,
    [listingId],
  );
  if (listing.rows.length === 0 || listing.rows[0].user_id !== userId) {
    reply.status(403).send({ error: 'Not authorized' });
    return;
  }

  await pool.query(`DELETE FROM listing_items WHERE id = $1 AND listing_id = $2`, [itemId, listingId]);
  reply.status(200).send({ message: 'Item deleted' });
}
