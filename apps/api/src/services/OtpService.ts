import { createHmac, randomInt } from 'crypto';
import { getRedis } from '../plugins/redis';
import { normaliseToE164 } from '@chopsave/shared';
import { sendSms } from '../lib/termii';

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_RATE_LIMIT_MAX = 5;
const OTP_RATE_LIMIT_WINDOW = 3600; // 1 hour
const OTP_MAX_ATTEMPTS = 3;
const OTP_LOCK_SECONDS = 600; // 10 minutes
const OTP_HMAC_SECRET = process.env['JWT_PRIVATE_KEY'] ?? 'dev-secret';

export class OtpService {
  private redis = getRedis();

  /**
   * Generate and send an OTP to a Nigerian phone number.
   * Enforces rate limiting: max 5 OTP requests per phone per hour.
   */
  async sendOtp(phone: string): Promise<{ message: string; phone: string }> {
    const normalisedPhone = normaliseToE164(phone);

    // Rate limiting check (atomic INCR + conditional EXPIRE)
    const rateLimitKey = `otp_rate:${normalisedPhone}`;
    const currentCount = await this.redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await this.redis.expire(rateLimitKey, OTP_RATE_LIMIT_WINDOW);
    }
    if (currentCount > OTP_RATE_LIMIT_MAX) {
      throw new OtpRateLimitError('Too many OTP requests. Try again later.');
    }

    // Check if phone is locked (too many failed attempts)
    const lockKey = `otp_lock:${normalisedPhone}`;
    const isLocked = await this.redis.exists(lockKey);
    if (isLocked) {
      throw new OtpLockedError('OTP is locked due to too many failed attempts. Try again in 10 minutes.');
    }

    // Generate 6-digit OTP
    const otp = randomInt(100000, 999999).toString();

    // Store OTP hash in Redis (not plaintext for security)
    const hash = this.hashOtp(otp);
    const otpKey = `otp:${normalisedPhone}`;
    await this.redis.setex(otpKey, OTP_TTL_SECONDS, hash);

    // Reset attempt counter for this OTP session
    const attemptKey = `otp_attempts:${normalisedPhone}`;
    await this.redis.del(attemptKey);

    // Send SMS via Termii
    const smsMessage = `Your ChopSave verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    await sendSms(normalisedPhone, smsMessage);

    return { message: 'OTP sent', phone: normalisedPhone };
  }

  /**
   * Verify an OTP for a phone number.
   * Returns true if valid, throws on failure.
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const normalisedPhone = normaliseToE164(phone);

    // Check lock
    const lockKey = `otp_lock:${normalisedPhone}`;
    const isLocked = await this.redis.exists(lockKey);
    if (isLocked) {
      throw new OtpLockedError('OTP is locked. Try again in 10 minutes.');
    }

    // Get stored hash
    const otpKey = `otp:${normalisedPhone}`;
    const storedHash = await this.redis.get(otpKey);
    if (!storedHash) {
      throw new OtpExpiredError('OTP has expired. Please request a new one.');
    }

    // Compare hashes
    const inputHash = this.hashOtp(otp);
    if (inputHash !== storedHash) {
      // Increment attempt counter
      const attemptKey = `otp_attempts:${normalisedPhone}`;
      const attempts = await this.redis.incr(attemptKey);
      await this.redis.expire(attemptKey, OTP_TTL_SECONDS);

      if (attempts >= OTP_MAX_ATTEMPTS) {
        // Lock the OTP for this phone
        await this.redis.setex(lockKey, OTP_LOCK_SECONDS, '1');
        await this.redis.del(otpKey);
        await this.redis.del(attemptKey);
        throw new OtpLockedError('Too many failed attempts. OTP locked for 10 minutes.');
      }

      throw new OtpInvalidError(`Invalid OTP. ${OTP_MAX_ATTEMPTS - attempts} attempt(s) remaining.`);
    }

    // OTP is valid — clean up
    await this.redis.del(otpKey);
    await this.redis.del(`otp_attempts:${normalisedPhone}`);

    return true;
  }

  private hashOtp(otp: string): string {
    return createHmac('sha256', OTP_HMAC_SECRET).update(otp).digest('hex');
  }
}

// Custom error classes
export class OtpRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpRateLimitError';
  }
}

export class OtpLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpLockedError';
  }
}

export class OtpExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpExpiredError';
  }
}

export class OtpInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpInvalidError';
  }
}
