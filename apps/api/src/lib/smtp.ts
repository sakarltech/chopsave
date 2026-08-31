import nodemailer from 'nodemailer';
import { env } from '../config/env';

export class EmailDeliveryConfigurationError extends Error {
  constructor() {
    super('Email delivery is not configured. Set the SMTP credentials to enable email sign-in.');
    this.name = 'EmailDeliveryConfigurationError';
  }
}

function getTransporter() {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw new EmailDeliveryConfigurationError();
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });
}

export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: `ChopSave <${env.SMTP_FROM}>`,
      to: email,
      subject: `${otp} is your ChopSave verification code`,
      text: `Your ChopSave verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
      html: `<p>Your ChopSave verification code is <strong style="font-size: 24px; letter-spacing: 0.15em;">${otp}</strong>.</p><p>It expires in 5 minutes. Do not share this code.</p>`,
    });
  } catch (error) {
    if (error instanceof EmailDeliveryConfigurationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Email delivery failed: ${message}`);
  }
}
