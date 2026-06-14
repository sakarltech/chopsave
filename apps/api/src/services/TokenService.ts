import { createSign, createVerify, randomBytes } from 'crypto';
import { env } from '../config/env';
import { getPool } from '../db/pool';

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

interface AccessTokenPayload {
  sub: string; // user ID
  role: string;
  iat: number;
  exp: number;
}

export class TokenService {
  private pool = getPool();

  /**
   * Generate a JWT access token (RS256).
   */
  generateAccessToken(userId: string, role: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: AccessTokenPayload = {
      sub: userId,
      role,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRY,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${header}.${body}`;

    const privateKey = env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(privateKey, 'base64url');

    return `${signingInput}.${signature}`;
  }

  /**
   * Verify and decode a JWT access token.
   */
  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, body, signature] = parts;
      const signingInput = `${header}.${body}`;

      const publicKey = env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
      const verify = createVerify('RSA-SHA256');
      verify.update(signingInput);
      const isValid = verify.verify(publicKey, signature!, 'base64url');

      if (!isValid) return null;

      const payload = JSON.parse(Buffer.from(body!, 'base64url').toString()) as AccessTokenPayload;

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generate an opaque refresh token and store it in the database.
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(48).toString('hex'); // 96-char opaque token
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);

    await this.pool.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)`,
      [token, userId, expiresAt],
    );

    return token;
  }

  /**
   * Validate a refresh token and return the associated user ID.
   */
  async validateRefreshToken(token: string): Promise<string | null> {
    const result = await this.pool.query<{ user_id: string; expires_at: Date }>(
      `SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1`,
      [token],
    );

    const row = result.rows[0];
    if (!row) return null;
    if (new Date(row.expires_at) < new Date()) {
      // Expired — clean up
      await this.pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
      return null;
    }

    return row.user_id;
  }

  /**
   * Revoke a refresh token (logout).
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
  }

  /**
   * Revoke all refresh tokens for a user.
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  }
}
