import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { EmailDeliveryConfigurationError } from '../../lib/resend';
import { EmailOtpLockedError, EmailOtpRateLimitError, EmailOtpService } from '../../services/EmailOtpService';

const bodySchema = z.object({
  email: z.string().trim().email(),
});

const otpService = new EmailOtpService();

export async function emailOtpSendHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    reply.status(422).send({ error: 'Enter a valid email address.' });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const response = await otpService.sendOtp(email);
    reply.status(200).send(response);
  } catch (error) {
    if (error instanceof EmailOtpRateLimitError) {
      reply.status(429).send({ error: error.message });
      return;
    }
    if (error instanceof EmailOtpLockedError) {
      reply.status(423).send({ error: error.message });
      return;
    }
    if (error instanceof EmailDeliveryConfigurationError) {
      request.log.error(error, 'Email OTP is not configured');
      reply.status(503).send({ error: 'Email sign-in is temporarily unavailable. Please try again later.' });
      return;
    }
    request.log.error(error, 'Email OTP send failed');
    reply.status(500).send({ error: 'Failed to send verification code. Please try again.' });
  }
}
