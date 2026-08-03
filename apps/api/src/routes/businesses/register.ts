import { FastifyRequest, FastifyReply } from 'fastify';
import { getPool } from '../../db/pool';
import { isWithinSupportedCity } from '../../services/GeofenceService';
import { BusinessType, SupportedCity } from '@chopsave/shared';
import { notificationDispatchQueue } from '../../plugins/queue';

export interface RegisterBusinessBody {
  businessName: string;
  type: string;
  cacNumber?: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  contactPhone: string;
  ownerFullName: string;
}

const VALID_BUSINESS_TYPES = Object.values(BusinessType);
const VALID_CITIES = Object.values(SupportedCity);

export async function registerBusinessHandler(
  request: FastifyRequest<{ Body: RegisterBusinessBody }>,
  reply: FastifyReply,
): Promise<void> {
  const pool = getPool();
  const userId = request.user!.id;
  const { businessName, type, cacNumber, address, city, lat, lng, contactPhone, ownerFullName } = request.body;

  // Validation
  if (!businessName || businessName.trim().length < 2) {
    reply.status(422).send({ error: 'businessName is required (minimum 2 characters)' });
    return;
  }
  if (!VALID_BUSINESS_TYPES.includes(type as BusinessType)) {
    reply.status(422).send({ error: `type must be one of: ${VALID_BUSINESS_TYPES.join(', ')}` });
    return;
  }
  if (!VALID_CITIES.includes(city as SupportedCity)) {
    reply.status(422).send({ error: `city must be one of: ${VALID_CITIES.join(', ')}` });
    return;
  }
  if (!address || address.trim().length < 5) {
    reply.status(422).send({ error: 'address is required (minimum 5 characters)' });
    return;
  }
  if (!lat || !lng) {
    reply.status(422).send({ error: 'lat and lng are required' });
    return;
  }
  if (!contactPhone) {
    reply.status(422).send({ error: 'contactPhone is required' });
    return;
  }
  if (!ownerFullName || ownerFullName.trim().length < 2) {
    reply.status(422).send({ error: 'ownerFullName is required (minimum 2 characters)' });
    return;
  }

  // CAC number validation (if provided — 7-digit numeric)
  if (cacNumber && !/^\d{7}$/.test(cacNumber)) {
    reply.status(422).send({ error: 'CAC number must be a 7-digit number' });
    return;
  }

  // Geofence validation
  const withinCity = await isWithinSupportedCity(lat, lng, city);
  if (!withinCity) {
    reply.status(422).send({
      error: `Business location is outside the ${city} geofence. ChopSave currently operates in Lagos and Abuja only.`,
    });
    return;
  }

  // Check if user already has a registered business
  const existingBiz = await pool.query(
    `SELECT id FROM businesses WHERE user_id = $1`,
    [userId],
  );
  if (existingBiz.rows.length > 0) {
    reply.status(409).send({ error: 'You already have a registered business' });
    return;
  }

  // Create business
  const result = await pool.query(
    `INSERT INTO businesses (
       user_id, name, type, address, city, lat, lng, cac_number, verification_tier
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
     RETURNING id, name, type, address, city, lat, lng, cac_number, verification_tier, created_at`,
    [userId, businessName.trim(), type, address.trim(), city, lat, lng, cacNumber ?? null],
  );

  // Update user role to business_owner
  await pool.query(
    `UPDATE users SET role = 'business_owner', full_name = $1, updated_at = NOW() WHERE id = $2`,
    [ownerFullName.trim(), userId],
  );

  // Notify admin via notification queue (new business pending review)
  await notificationDispatchQueue.add('business-pending-review', {
    type: 'business_pending_review',
    targetRole: 'admin',
    businessId: result.rows[0].id,
    businessName: businessName.trim(),
    city,
  });

  const business = result.rows[0];

  reply.status(201).send({
    id: business.id,
    name: business.name,
    type: business.type,
    address: business.address,
    city: business.city,
    lat: parseFloat(business.lat),
    lng: parseFloat(business.lng),
    cacNumber: business.cac_number,
    verificationTier: business.verification_tier,
    status: 'pending',
    message: 'Business registration submitted. You will be notified once verified by our team.',
    createdAt: business.created_at,
  });
}
