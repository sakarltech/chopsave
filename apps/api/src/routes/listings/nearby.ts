import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';

interface NearbyQuery {
  lat: string;
  lng: string;
  radius?: string;
  city?: string;
  category?: string;
  dietary?: string;
  type?: string;
  priceMin?: string;
  priceMax?: string;
  minRating?: string;
  q?: string;
}

// GET /listings/nearby
export async function getNearbyListingsHandler(
  request: FastifyRequest<{ Querystring: NearbyQuery }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const { lat, lng, radius, city, category, dietary, type, priceMin, priceMax, minRating, q } = request.query;

  if (!lat || !lng) {
    reply.status(422).send({ error: 'lat and lng query parameters are required' });
    return;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const radiusMetres = parseInt(radius ?? '5000', 10);

  // Build dynamic WHERE clauses
  const conditions: string[] = [
    `l.status = 'active'`,
    `l.pickup_end > NOW()`,
    `l.quantity_remaining > 0`,
    `ST_DWithin(b.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`,
  ];
  const params: unknown[] = [lngNum, latNum, radiusMetres];
  let paramIndex = 4;

  // City geofence filter
  if (city) {
    conditions.push(`b.city = $${paramIndex++}`);
    params.push(city);
  }

  // Category filter
  if (category) {
    conditions.push(`$${paramIndex++} = ANY(l.food_categories)`);
    params.push(category);
  }

  // Dietary filter
  if (dietary) {
    conditions.push(`$${paramIndex++} = ANY(l.dietary_tags)`);
    params.push(dietary);
  }

  // Type filter
  if (type) {
    conditions.push(`l.type = $${paramIndex++}`);
    params.push(type);
  }

  // Price range
  if (priceMin) {
    conditions.push(`l.discount_price >= $${paramIndex++}`);
    params.push(parseFloat(priceMin));
  }
  if (priceMax) {
    conditions.push(`l.discount_price <= $${paramIndex++}`);
    params.push(parseFloat(priceMax));
  }

  // Min rating
  if (minRating) {
    conditions.push(`b.avg_rating >= $${paramIndex++}`);
    params.push(parseFloat(minRating));
  }

  // Text search
  if (q) {
    conditions.push(`(l.title ILIKE $${paramIndex} OR b.name ILIKE $${paramIndex})`);
    params.push(`%${q}%`);
    paramIndex++;
  }

  const sql = `
    SELECT
      l.id, l.type, l.title, l.description, l.discount_price, l.original_price,
      l.quantity_remaining, l.pickup_start, l.pickup_end, l.food_categories,
      l.dietary_tags, l.photo_url, l.status,
      b.id AS business_id, b.name AS business_name, b.avg_rating, b.verification_tier,
      b.address AS business_address, b.city,
      ST_Distance(b.geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_metres
    FROM listings l
    JOIN businesses b ON b.id = l.business_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY distance_metres ASC
    LIMIT 50
  `;

  const result = await pool.query(sql, params);

  reply.status(200).send({
    listings: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      discountPrice: parseFloat(row.discount_price),
      originalPrice: row.original_price ? parseFloat(row.original_price) : null,
      quantityRemaining: row.quantity_remaining,
      pickupStart: row.pickup_start,
      pickupEnd: row.pickup_end,
      foodCategories: row.food_categories,
      dietaryTags: row.dietary_tags,
      photoUrl: row.photo_url,
      status: row.status,
      business: {
        id: row.business_id,
        name: row.business_name,
        avgRating: parseFloat(row.avg_rating ?? '0'),
        verificationTier: row.verification_tier,
        address: row.business_address,
        city: row.city,
      },
      distanceMetres: Math.round(parseFloat(row.distance_metres)),
    })),
    total: result.rows.length,
  });
}

// GET /listings/:id
export async function getListingDetailHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const { id } = request.params;

  const result = await pool.query(
    `SELECT l.*, b.name AS business_name, b.avg_rating, b.verification_tier,
            b.address AS business_address, b.city, b.lat AS business_lat, b.lng AS business_lng
     FROM listings l
     JOIN businesses b ON b.id = l.business_id
     WHERE l.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    reply.status(404).send({ error: 'Listing not found' });
    return;
  }

  const listing = result.rows[0];

  // Fetch items if itemised
  let items: unknown[] = [];
  if (listing.type === 'itemised') {
    const itemsResult = await pool.query(
      `SELECT * FROM listing_items WHERE listing_id = $1 ORDER BY created_at ASC`,
      [id],
    );
    items = itemsResult.rows.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      originalPrice: item.original_price ? parseFloat(item.original_price) : null,
      discountPrice: parseFloat(item.discount_price),
      quantityTotal: item.quantity_total,
      quantityRemaining: item.quantity_remaining,
      dietaryTags: item.dietary_tags,
      photoUrl: item.photo_url,
    }));
  }

  reply.status(200).send({
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
    business: {
      id: listing.business_id,
      name: listing.business_name,
      avgRating: parseFloat(listing.avg_rating ?? '0'),
      verificationTier: listing.verification_tier,
      address: listing.business_address,
      city: listing.city,
      lat: parseFloat(listing.business_lat),
      lng: parseFloat(listing.business_lng),
    },
    items,
  });
}
