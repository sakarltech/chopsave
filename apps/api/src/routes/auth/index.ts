import { FastifyInstance } from 'fastify';
import { otpSendHandler } from './otpSend';
import { otpVerifyHandler } from './otpVerify';
import { emailOtpSendHandler } from './emailOtpSend';
import { emailOtpVerifyHandler } from './emailOtpVerify';
import { refreshHandler } from './refresh';
import { logoutHandler } from './logout';
import { socialLoginHandler } from './social';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Public routes (no auth required)
  app.post('/auth/otp/send', otpSendHandler);
  app.post('/auth/otp/verify', otpVerifyHandler);
  app.post('/auth/email-otp/send', emailOtpSendHandler);
  app.post('/auth/email-otp/verify', emailOtpVerifyHandler);
  app.post('/auth/social', socialLoginHandler);
  app.post('/auth/refresh', refreshHandler);

  // Authenticated route
  app.post('/auth/logout', {
    preHandler: [app.authenticate],
  }, logoutHandler);
}
