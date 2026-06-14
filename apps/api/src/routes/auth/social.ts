import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../config/env';
import { TokenService } from '../../services/TokenService';
import { getPool } from '../../db/pool';
import { UserRole } from '@chopsave/shared';

interface SocialLoginBody {
  provider: 'google' | 'apple';
  idToken: string;
}

const tokenService = new TokenService();

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

interface AppleTokenPayload {
  sub: string;
  email?: string;
}

/**
 * Verify a Google ID token using Google's tokeninfo endpoint.
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
  );
  if (!response.ok) {
    throw new Error('Invalid Google ID token');
  }
  const payload = (await response.json()) as GoogleTokenPayload & { aud: string };

  // Verify audience matches our client ID
  if (payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token audience mismatch');
  }

  return payload;
}

/**
 * Verify an Apple identity token.
 * In production, you'd verify the JWT signature against Apple's public keys.
 * For MVP, we decode the JWT payload and validate basic claims.
 */
async function verifyAppleToken(idToken: string): Promise<AppleTokenPayload> {
  // Decode JWT payload (middle part)
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid Apple ID token format');
  }

  const payload = JSON.parse(
    Buffer.from(parts[1]!, 'base64url').toString(),
  ) as AppleTokenPayload & { iss: string; aud: string; exp: number };

  // Basic validation
  if (payload.iss !== 'https://appleid.apple.com') {
    throw new Error('Invalid Apple token issuer');
  }
  if (payload.aud !== env.APPLE_CLIENT_ID) {
    throw new Error('Apple token audience mismatch');
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Apple token expired');
  }

  return { sub: payload.sub, email: payload.email };
}

export async function socialLoginHandler(
  request: FastifyRequest<{ Body: SocialLoginBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { provider, idToken } = request.body;

  if (!provider || !['google', 'apple'].includes(provider)) {
    reply.status(422).send({ error: 'provider must be "google" or "apple"' });
    return;
  }

  if (!idToken) {
    reply.status(422).send({ error: 'idToken is required' });
    return;
  }

  let email: string | null = null;
  let fullName: string | null = null;
  let avatarUrl: string | null = null;
  let providerSub: string;

  try {
    if (provider === 'google') {
      const payload = await verifyGoogleToken(idToken);
      email = payload.email;
      fullName = payload.name;
      avatarUrl = payload.picture ?? null;
      providerSub = payload.sub;
    } else {
      const payload = await verifyAppleToken(idToken);
      email = payload.email ?? null;
      providerSub = payload.sub;
    }
  } catch (error) {
    request.log.error(error, 'Social login verification failed');
    reply.status(401).send({ error: 'Invalid or expired social login token' });
    return;
  }

  const pool = getPool();
  let isNewUser = false;

  // Try to find existing user by email
  let userResult = email
    ? await pool.query(
        `SELECT id, role, status FROM users WHERE email = $1`,
        [email],
      )
    : { rows: [] as any[] };

  let userId: string;
  let userRole: string;

  if (userResult.rows.length > 0) {
    const user = userResult.rows[0];
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
    // Create new user
    if (!fullName) {
      fullName = email?.split('@')[0] ?? `User_${providerSub.slice(0, 6)}`;
    }

    const newUser = await pool.query(
      `INSERT INTO users (email, full_name, display_name, avatar_url, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, role`,
      [email, fullName, fullName, avatarUrl, UserRole.CONSUMER],
    );

    userId = newUser.rows[0].id;
    userRole = newUser.rows[0].role;
    isNewUser = true;
  }

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(userId, userRole);
  const refreshToken = await tokenService.generateRefreshToken(userId);

  // Fetch full user for response
  const fullUser = await pool.query(
    `SELECT id, phone, email, full_name, display_name, avatar_url, role, status,
            dietary_prefs, no_show_count, created_at
     FROM users WHERE id = $1`,
    [userId],
  );

  const user = fullUser.rows[0];

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
