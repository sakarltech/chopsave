import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidNigerianPhone, normaliseToE164, UserRole } from '@chopsave/shared';
import { OtpService, OtpLockedError, OtpExpiredError, OtpInvalidError } from '../../services/OtpService';
import { TokenService } from '../../services/TokenService';
import { getPool } from '../../db/pool';

interface OtpVerifyBody {
  phone: string;
  otp: string;
  fullName?: string;
}

const otpService = new OtpService();
const tokenService = new TokenService();

export async function otpVerifyHandler(
  request: FastifyRequest<{ Body: OtpVerifyBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { phone, otp, fullName } = request.body;

  // Validate phone
  if (!phone || !isValidNigerianPhone(phone)) {
    reply.status(422).send({ error: 'Invalid phone number format.' });
    return;
  }

  // Validate OTP format
  if (!otp || otp.length !== 6) {
    reply.status(422).send({ error: 'OTP must be a 6-digit code.' });
    return;
  }

  // Verify OTP against Redis
  try {
    await otpService.verifyOtp(phone, otp);
  } catch (error) {
    if (error instanceof OtpLockedError) {
      reply.status(423).send({ error: error.message });
      return;
    }
    if (error instanceof OtpExpiredError) {
      reply.status(410).send({ error: error.message });
      return;
    }
    if (error instanceof OtpInvalidError) {
      reply.status(401).send({ error: error.message });
      return;
    }
    request.log.error(error, 'OTP verification failed');
    reply.status(500).send({ error: 'Verification failed. Please try again.' });
    return;
  }

  // OTP is valid — upsert user
  const pool = getPool();
  const normalisedPhone = normaliseToE164(phone);

  // Check if user already exists
  const existingUser = await pool.query(
    `SELECT id, full_name, role, status FROM users WHERE phone = $1`,
    [normalisedPhone],
  );

  let userId: string;
  let userRole: string;
  let isNewUser = false;

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];

    // Check if account is suspended
    if (user.status === 'suspended') {
      reply.status(403).send({ error: 'Account is suspended. Contact support.' });
      return;
    }
    if (user.status === 'deleted') {
      reply.status(403).send({ error: 'Account has been deleted.' });
      return;
    }

    userId = user.id;
    userRole = user.role;
  } else {
    // New user — fullName is required
    if (!fullName || fullName.trim().length < 2) {
      reply.status(422).send({ error: 'Full name is required for new accounts (minimum 2 characters).' });
      return;
    }

    const newUser = await pool.query(
      `INSERT INTO users (phone, full_name, role, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, role`,
      [normalisedPhone, fullName.trim(), UserRole.CONSUMER],
    );

    userId = newUser.rows[0].id;
    userRole = newUser.rows[0].role;
    isNewUser = true;
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(userId, userRole);
  const refreshToken = await tokenService.generateRefreshToken(userId);

  // Fetch full user record for response
  const userResult = await pool.query(
    `SELECT id, phone, email, full_name, display_name, avatar_url, role, status,
            dietary_prefs, no_show_count, created_at
     FROM users WHERE id = $1`,
    [userId],
  );

  const user = userResult.rows[0];

  reply.status(200).send({
    accessToken,
    refreshToken,
    isNewUser,
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.full_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      status: user.status,
      dietaryPrefs: user.dietary_prefs,
      noShowCount: user.no_show_count,
      createdAt: user.created_at,
    },
  });
}
