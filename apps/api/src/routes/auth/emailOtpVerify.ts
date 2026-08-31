import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { UserRole } from '@chopsave/shared';
import { getPool } from '../../db/pool';
import { TokenService } from '../../services/TokenService';
import { EmailOtpExpiredError, EmailOtpInvalidError, EmailOtpLockedError, EmailOtpService } from '../../services/EmailOtpService';

const bodySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code.'),
  fullName: z.string().trim().min(2).max(255).optional(),
});

const otpService = new EmailOtpService();
const tokenService = new TokenService();

export async function emailOtpVerifyHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    reply.status(422).send({ error: parsed.error.issues[0]?.message ?? 'Invalid verification details.' });
    return;
  }

  const { otp, fullName } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const pool = getPool();
  const existingUser = await pool.query(
    'SELECT id, role, status FROM users WHERE email = $1',
    [email],
  );

  if (existingUser.rows.length === 0 && !fullName) {
    reply.status(422).send({ error: 'Full name is required for new accounts (minimum 2 characters).' });
    return;
  }

  try {
    await otpService.verifyOtp(email, otp);
  } catch (error) {
    if (error instanceof EmailOtpLockedError) {
      reply.status(423).send({ error: error.message });
      return;
    }
    if (error instanceof EmailOtpExpiredError) {
      reply.status(410).send({ error: error.message });
      return;
    }
    if (error instanceof EmailOtpInvalidError) {
      reply.status(401).send({ error: error.message });
      return;
    }
    request.log.error(error, 'Email OTP verification failed');
    reply.status(500).send({ error: 'Verification failed. Please try again.' });
    return;
  }

  let userId: string;
  let userRole: string;
  let isNewUser = false;

  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];
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
    const newUser = await pool.query(
      `INSERT INTO users (email, full_name, role, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, role`,
      [email, fullName, UserRole.CONSUMER],
    );

    userId = newUser.rows[0].id;
    userRole = newUser.rows[0].role;
    isNewUser = true;
  }

  const accessToken = tokenService.generateAccessToken(userId, userRole);
  const refreshToken = await tokenService.generateRefreshToken(userId);
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
