import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidNigerianPhone } from '@chopsave/shared';
import { OtpService, OtpRateLimitError, OtpLockedError } from '../../services/OtpService';

interface OtpSendBody {
  phone: string;
}

const otpService = new OtpService();

export async function otpSendHandler(
  request: FastifyRequest<{ Body: OtpSendBody }>,
  reply: FastifyReply,
): Promise<void> {
  const { phone } = request.body;

  if (!phone || !isValidNigerianPhone(phone)) {
    reply.status(422).send({
      error: 'Invalid phone number. Use Nigerian format: 08XXXXXXXXX or +234XXXXXXXXX',
    });
    return;
  }

  try {
    const { message, phone: normalisedPhone } = await otpService.sendOtp(phone);
    reply.status(200).send({ message, phone: normalisedPhone });
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      reply.status(429).send({ error: error.message });
      return;
    }
    if (error instanceof OtpLockedError) {
      reply.status(423).send({ error: error.message });
      return;
    }
    request.log.error(error, 'OTP send failed');
    reply.status(500).send({ error: 'Failed to send OTP. Please try again.' });
  }
}
