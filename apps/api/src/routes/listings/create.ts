import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { getRedis } from '../../plugins/redis';
import { ListingType, FoodCategory, DietaryTag } from '@chopsave/shared';

interface ListingItem {
  name: string;
  description?: string;
  originalPrice?: number;
  discountPrice: number;
  quantity: number;
  dietaryTags?: string[];
  photoUrl?: string;
}

interface CreateListingBody {
  type: string;
  title?: string;
  description?: string;
  originalPrice?: number;
  discountPrice: number;
  quantityTotal: number;
  pickupStart: string;
  pickupEnd: string;
  foodCategories: string[];
  dietaryTags?: string[];
  photoUrl?: string;
  weightKg?: number;
  items?: ListingItem[];
}

const VALID_TYPES = Object.values(ListingType);
const VALID_CATEGORIES = Object.values(FoodCategory);
const VALID_DIETARY_TAGS = Object.values(DietaryTag);

export async function createListingHandler(
  request: FastifyRequest<{ Body: CreateListingBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const body = request.body;

  // Validate type
  if (!VALID_TYPES.includes(body.type as ListingType)) {
    reply.status(422).send({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    return;
  }

  // Validate price
  if (!body.discountPrice || body.discountPrice <= 0) {
    reply.status(422).send({ error: 'discountPrice must be greater than 0' });
    return;
  }

  // Validate discount is ≤50% of original
  if (body.originalPrice && body.discountPrice > body.originalPrice * 0.5) {
    reply.status(422).send({ error: 'discountPrice must be at most 50% of originalPrice' });
    return;
  }

  // Validate quantity
  if (!body.quantityTotal || body.quantityTotal < 1) {
    reply.status(422).send({ error: 'quantityTotal must be at least 1' });
    return;
  }

  // Validate pickup window
  const pickupStart = new Date(body.pickupStart);
  const pickupEnd = new Date(body.pickupEnd);
  if (isNaN(pickupStart.getTime()) || isNaN(pickupEnd.getTime())) {
    reply.status(422).send({ error: 'pickupStart and pickupEnd must be valid ISO date strings' });
    return;
  }
  if (pickupEnd <= pickupStart) {
    reply.status(422).send({ error: 'pickupEnd must be after pickupStart' });
    return;
  }
  // Minimum 30 min window
  if (pickupEnd.getTime() - pickupStart.getTime() < 30 * 60 * 1000) {
    reply.status(422).send({ error: 'Pickup window must be at least 30 minutes' });
    return;
  }

  // Validate food categories
  if (!body.foodCategories || body.foodCategories.length < 1) {
    reply.status(422).send({ error: 'At least one food category is required' });
    return;
  }
  if (body.foodCategories.length > 3) {
    reply.status(422).send({ error: 'Maximum 3 food categories allowed' });
    return;
  }

  // Validate dietary tags
  if (body.dietaryTags) {
    const invalid = body.dietaryTags.filter((t) => !VALID_DIETARY_TAGS.includes(t as DietaryTag));
    if (invalid.length > 0) {
      reply.status(422).send({ error: `Invalid dietary tags: ${invalid.join(', ')}` });
      return;
    }
  }

  // Check business is verified
  const bizResult = await pool.query(
    `SELECT id, city, verification_tier FROM businesses WHERE user_id = $1`,
    [userId],
  );
  if (bizResult.rows.length === 0) {
    reply.status(403).send({ error: 'You must register a business first' });
    return;
  }
  const business = bizResult.rows[0];
  if (!['verified_informal', 'verified_cac'].includes(business.verification_tier)) {
    reply.status(403).send({ error: 'Your business must be verified before creating listings' });
    return;
  }

  // Create listing
  const result = await pool.query(
    `INSERT INTO listings (
       business_id, type, title, description, original_price, discount_price,
       quantity_total, quantity_remaining, pickup_start, pickup_end,
       food_categories, dietary_tags, photo_url, weight_kg
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      business.id, body.type, body.title ?? null, body.description ?? null,
      body.originalPrice ?? null, body.discountPrice,
      body.quantityTotal,
      pickupStart, pickupEnd,
      body.foodCategories, body.dietaryTags ?? [],
      body.photoUrl ?? null, body.weightKg ?? 0.5,
    ],
  );

  const listing = result.rows[0];

  // If itemised, create items
  if (body.type === 'itemised' && body.items && body.items.length > 0) {
    if (body.items.length > 20) {
      reply.status(422).send({ error: 'Maximum 20 items per itemised listing' });
      return;
    }

    for (const item of body.items) {
      await pool.query(
        `INSERT INTO listing_items (
           listing_id, name, description, original_price, discount_price,
           quantity_total, quantity_remaining, dietary_tags, photo_url
         ) VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8)`,
        [
          listing.id, item.name, item.description ?? null,
          item.originalPrice ?? null, item.discountPrice,
          item.quantity, item.dietaryTags ?? [], item.photoUrl ?? null,
        ],
      );
    }
  }

  // Publish event to Redis for SSE consumers
  const redis = getRedis();
  await redis.publish(`channel:listings:${business.city}`, JSON.stringify({
    event: 'listing.created',
    data: { listingId: listing.id, businessId: business.id, type: body.type, city: business.city },
  }));

  reply.status(201).send({
    id: listing.id,
    businessId: listing.business_id,
    type: listing.type,
    title: listing.title,
    discountPrice: parseFloat(listing.discount_price),
    quantityTotal: listing.quantity_total,
    quantityRemaining: listing.quantity_remaining,
    pickupStart: listing.pickup_start,
    pickupEnd: listing.pickup_end,
    foodCategories: listing.food_categories,
    dietaryTags: listing.dietary_tags,
    status: listing.status,
    createdAt: listing.created_at,
  });
}
