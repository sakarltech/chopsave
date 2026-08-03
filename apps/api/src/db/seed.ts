import { closePool, getPool } from './pool';

type PilotBusiness = {
  ownerName: string;
  ownerPhone: string;
  name: string;
  type: 'bakery' | 'buka' | 'restaurant' | 'canteen';
  address: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  quantity: number;
  foodCategories: string[];
  dietaryTags: string[];
  weightKg: number;
};

const pilotBusinesses: PilotBusiness[] = [
  {
    ownerName: 'ChopSave Seed - Amaka Foods',
    ownerPhone: '+2348000001001',
    name: 'Amaka Kitchen, Yaba',
    type: 'buka',
    address: 'Herbert Macaulay Way, Yaba, Lagos',
    lat: 6.5095,
    lng: 3.3711,
    title: 'Evening Naija Surprise Bag',
    description: 'A filling mix of freshly prepared Nigerian favourites rescued from the evening service.',
    originalPrice: 3500,
    discountPrice: 1500,
    quantity: 12,
    foodCategories: ['local_dishes'],
    dietaryTags: ['buka_style'],
    weightKg: 0.8,
  },
  {
    ownerName: 'ChopSave Seed - Crumb & Co',
    ownerPhone: '+2348000001002',
    name: 'Crumb & Co, Victoria Island',
    type: 'bakery',
    address: 'Akin Adesola Street, Victoria Island, Lagos',
    lat: 6.4281,
    lng: 3.4219,
    title: 'Bakery Rescue Bag',
    description: 'A surprise selection of breads, pastries, and sweet treats from today’s bake.',
    originalPrice: 5000,
    discountPrice: 2000,
    quantity: 8,
    foodCategories: ['pastries', 'snacks'],
    dietaryTags: ['contains_nuts'],
    weightKg: 0.6,
  },
  {
    ownerName: 'ChopSave Seed - Lekki Grill',
    ownerPhone: '+2348000001003',
    name: 'Lekki Grill House',
    type: 'restaurant',
    address: 'Admiralty Way, Lekki Phase 1, Lagos',
    lat: 6.4474,
    lng: 3.4736,
    title: 'Grill House Surprise Bag',
    description: 'A hearty surprise bag with grilled mains and sides from the dinner rush.',
    originalPrice: 6500,
    discountPrice: 2800,
    quantity: 6,
    foodCategories: ['fast_food', 'local_dishes'],
    dietaryTags: ['halal'],
    weightKg: 1,
  },
  {
    ownerName: 'ChopSave Seed - Mainland Canteen',
    ownerPhone: '+2348000001004',
    name: 'Mainland Lunch Canteen',
    type: 'canteen',
    address: 'Adeniran Ogunsanya Street, Surulere, Lagos',
    lat: 6.4989,
    lng: 3.3484,
    title: 'Fresh Lunch Rescue Bag',
    description: 'A budget-friendly surprise lunch from today’s freshly prepared canteen menu.',
    originalPrice: 3000,
    discountPrice: 1200,
    quantity: 10,
    foodCategories: ['local_dishes'],
    dietaryTags: [],
    weightKg: 0.75,
  },
];

async function seedPilotData(): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pickupWindow = await client.query<{ pickup_start: Date; pickup_end: Date }>(`
      SELECT
        (
          (
            CASE
              WHEN (NOW() AT TIME ZONE 'Africa/Lagos')::time < TIME '16:00'
                THEN (NOW() AT TIME ZONE 'Africa/Lagos')::date
              ELSE (NOW() AT TIME ZONE 'Africa/Lagos')::date + 1
            END + TIME '16:00'
          ) AT TIME ZONE 'Africa/Lagos'
        ) AS pickup_start,
        (
          (
            CASE
              WHEN (NOW() AT TIME ZONE 'Africa/Lagos')::time < TIME '16:00'
                THEN (NOW() AT TIME ZONE 'Africa/Lagos')::date
              ELSE (NOW() AT TIME ZONE 'Africa/Lagos')::date + 1
            END + TIME '20:00'
          ) AT TIME ZONE 'Africa/Lagos'
        ) AS pickup_end
    `);
    const { pickup_start: pickupStart, pickup_end: pickupEnd } = pickupWindow.rows[0];

    for (const business of pilotBusinesses) {
      const owner = await client.query<{ id: string }>(
        `INSERT INTO users (phone, full_name, role, status)
         VALUES ($1, $2, 'business_owner', 'active')
         ON CONFLICT (phone) DO UPDATE
         SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, status = EXCLUDED.status, updated_at = NOW()
         RETURNING id`,
        [business.ownerPhone, business.ownerName],
      );
      const ownerId = owner.rows[0].id;

      await client.query('DELETE FROM businesses WHERE user_id = $1', [ownerId]);

      const seededBusiness = await client.query<{ id: string }>(
        `INSERT INTO businesses (
           user_id, name, type, address, city, lat, lng, verification_tier, description
         ) VALUES ($1, $2, $3, $4, 'lagos', $5, $6, 'verified_informal', $7)
         RETURNING id`,
        [
          ownerId,
          business.name,
          business.type,
          business.address,
          business.lat,
          business.lng,
          `Pilot fixture for ${business.name}.`,
        ],
      );

      await client.query(
        `INSERT INTO listings (
           business_id, type, title, description, status, original_price, discount_price,
           quantity_total, quantity_remaining, pickup_start, pickup_end,
           food_categories, dietary_tags, weight_kg
         ) VALUES ($1, 'surprise_bag', $2, $3, 'active', $4, $5, $6, $6, $7, $8, $9, $10, $11)`,
        [
          seededBusiness.rows[0].id,
          business.title,
          business.description,
          business.originalPrice,
          business.discountPrice,
          business.quantity,
          pickupStart,
          pickupEnd,
          business.foodCategories,
          business.dietaryTags,
          business.weightKg,
        ],
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${pilotBusinesses.length} verified Lagos businesses and surprise-bag listings.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

seedPilotData().catch((error) => {
  console.error('Pilot seed failed:', error);
  process.exit(1);
});
