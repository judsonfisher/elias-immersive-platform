import { Resend } from "resend";
import { APP_NAME, APP_URL } from "@/lib/constants";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
const from = process.env.EMAIL_FROM || `${APP_NAME} <noreply@eliasimmersive.com>`;

export async function sendInviteEmail(
  to: string,
  organizationName: string,
  token: string
) {
  const inviteUrl = `${APP_URL}/invite/${token}`;

  await getResend().emails.send({
    from,
    to,
    subject: `You're invited to ${APP_NAME}`,
    html: `
      <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin: 0;">Welcome to ${APP_NAME}</h1>
        </div>
        <p style="font-size: 16px; color: #1a1a1a; line-height: 1.6;">
          You've been invited to view the digital twins for <strong>${organizationName}</strong>.
        </p>
        <p style="font-size: 16px; color: #666666; line-height: 1.6;">
          Click the button below to set up your account and access your property's Matterport 3D tours and drone scans.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background-color: #4a5440; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 500;">
            Set Up Your Account
          </a>
        </div>
        <p style="font-size: 13px; color: #999999; line-height: 1.6;">
          This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0dc; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999999; text-align: center;">
          ${APP_NAME} — Precision Capture. Interactive Results.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const dashboardUrl = `${APP_URL}/dashboard`;

  await getResend().emails.send({
    from,
    to,
    subject: `Welcome to ${APP_NAME}`,
    html: `
      <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin: 0;">Welcome, ${firstName}!</h1>
        </div>
        <p style="font-size: 16px; color: #1a1a1a; line-height: 1.6;">
          Your account on ${APP_NAME} is ready. You can now view your property's digital twins.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #4a5440; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 500;">
            Go to Dashboard
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0dc; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999999; text-align: center;">
          ${APP_NAME} — Precision Capture. Interactive Results.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password/${token}`;

  await getResend().emails.send({
    from,
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: `
      <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin: 0;">Reset Your Password</h1>
        </div>
        <p style="font-size: 16px; color: #1a1a1a; line-height: 1.6;">
          We received a request to reset your password. Click the button below to choose a new one.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #4a5440; color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 500;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #999999; line-height: 1.6;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e0e0dc; margin: 32px 0;" />
        <p style="font-size: 12px; color: #999999; text-align: center;">
          ${APP_NAME} — Precision Capture. Interactive Results.
        </p>
      </div>
    `,
  });
}
