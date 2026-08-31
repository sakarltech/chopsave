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

function verificationEmailHtml(otp: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your ChopSave verification code</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8F7F0; color: #243028; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">Your ChopSave verification code is ${otp}. It expires in 5 minutes.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F7F0;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 30px 36px; background-color: #165C34; border-radius: 20px 20px 0 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td width="38" height="38" align="center" style="width: 38px; height: 38px; background-color: #FFFFFF; border-radius: 10px; color: #165C34; font-size: 22px; font-weight: 700; line-height: 38px;">&#10047;</td>
                    <td style="padding-left: 10px; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ChopSave</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 36px 34px; background-color: #FFFFFF; border-radius: 0 0 20px 20px;">
                <p style="margin: 0 0 12px; color: #165C34; font-size: 13px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">Secure sign-in</p>
                <h1 style="margin: 0; color: #18241D; font-size: 30px; line-height: 38px; letter-spacing: -0.8px;">Your ChopSave verification code</h1>
                <p style="margin: 18px 0 0; color: #56635A; font-size: 16px; line-height: 25px;">Use the code below to securely sign in to ChopSave. It expires in 5 minutes.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 30px;">
                  <tr>
                    <td align="center" style="padding: 24px 16px; background-color: #F0FAF4; border: 1px solid #D9ECDD; border-radius: 14px; color: #165C34; font-size: 34px; font-weight: 700; letter-spacing: 10px; line-height: 40px;">${otp}</td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px;">
                  <tr>
                    <td style="padding: 18px 20px; background-color: #E8F5D4; border-radius: 12px; color: #315426; font-size: 14px; line-height: 21px;"><strong style="color: #165C34;">Keep it private.</strong> ChopSave will never ask you to share this code.</td>
                  </tr>
                </table>
                <p style="margin: 28px 0 0; color: #79857C; font-size: 13px; line-height: 20px;">If you did not request this code, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 22px 16px 0; color: #79857C; font-size: 12px; line-height: 18px;">Good food deserves a second chance.<br>ChopSave Lagos pilot</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  try {
    await getTransporter().sendMail({
      from: `ChopSave <${env.SMTP_FROM}>`,
      to: email,
      subject: 'Your ChopSave verification code',
      text: `Your ChopSave verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
      html: verificationEmailHtml(otp),
    });
  } catch (error) {
    if (error instanceof EmailDeliveryConfigurationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Email delivery failed: ${message}`);
  }
}
