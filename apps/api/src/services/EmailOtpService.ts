import { createHmac, randomInt } from 'crypto';
import { getRedis } from '../plugins/redis';
import { sendEmailOtp } from '../lib/smtp';

const OTP_TTL_SECONDS = 300;
const OTP_RATE_LIMIT_MAX = 5;
const OTP_RATE_LIMIT_WINDOW = 3600;
const OTP_MAX_ATTEMPTS = 3;
const OTP_LOCK_SECONDS = 600;
const OTP_HMAC_SECRET = process.env['JWT_PRIVATE_KEY'] ?? 'dev-secret';

export class EmailOtpService {
  private redis = getRedis();

  async sendOtp(email: string): Promise<{ message: string; email: string }> {
    const rateLimitKey = `email_otp_rate:${email}`;
    const currentCount = await this.redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await this.redis.expire(rateLimitKey, OTP_RATE_LIMIT_WINDOW);
    }
    if (currentCount > OTP_RATE_LIMIT_MAX) {
      throw new EmailOtpRateLimitError('Too many verification requests. Try again later.');
    }

    const lockKey = `email_otp_lock:${email}`;
    if (await this.redis.exists(lockKey)) {
      throw new EmailOtpLockedError('Verification is locked due to too many failed attempts. Try again in 10 minutes.');
    }

    const otp = randomInt(100000, 999999).toString();
    const otpKey = `email_otp:${email}`;
    await this.redis.setex(otpKey, OTP_TTL_SECONDS, this.hashOtp(otp));
    await this.redis.del(`email_otp_attempts:${email}`);
    await sendEmailOtp(email, otp);

    return { message: 'Verification code sent', email };
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const lockKey = `email_otp_lock:${email}`;
    if (await this.redis.exists(lockKey)) {
      throw new EmailOtpLockedError('Verification is locked. Try again in 10 minutes.');
    }

    const otpKey = `email_otp:${email}`;
    const storedHash = await this.redis.get(otpKey);
    if (!storedHash) {
      throw new EmailOtpExpiredError('Verification code has expired. Please request a new one.');
    }

    if (this.hashOtp(otp) !== storedHash) {
      const attemptKey = `email_otp_attempts:${email}`;
      const attempts = await this.redis.incr(attemptKey);
      await this.redis.expire(attemptKey, OTP_TTL_SECONDS);

      if (attempts >= OTP_MAX_ATTEMPTS) {
        await this.redis.setex(lockKey, OTP_LOCK_SECONDS, '1');
        await this.redis.del(otpKey);
        await this.redis.del(attemptKey);
        throw new EmailOtpLockedError('Too many failed attempts. Verification is locked for 10 minutes.');
      }

      throw new EmailOtpInvalidError(`Invalid verification code. ${OTP_MAX_ATTEMPTS - attempts} attempt(s) remaining.`);
    }

    await this.redis.del(otpKey);
    await this.redis.del(`email_otp_attempts:${email}`);
    return true;
  }

  private hashOtp(otp: string): string {
    return createHmac('sha256', OTP_HMAC_SECRET).update(otp).digest('hex');
  }
}

export class EmailOtpRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailOtpRateLimitError';
  }
}

export class EmailOtpLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailOtpLockedError';
  }
}

export class EmailOtpExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailOtpExpiredError';
  }
}

export class EmailOtpInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailOtpInvalidError';
  }
}
