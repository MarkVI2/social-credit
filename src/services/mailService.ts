import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const fromEmail = process.env.MAIL_FROM || smtpUser;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendVerificationEmail(to: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(
    token
  )}`;
  await transporter.sendMail({
    to,
    from: fromEmail,
    subject: "Verify your email",
    html: `
      <p>Welcome to Social Credit.</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/auth/reset?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    to,
    from: fromEmail,
    subject: "Reset your password",
    html: `
      <p>We received a request to reset your password.</p>
      <p>Use the link below to set a new password. This link expires soon.</p>
      <p><a href="${url}">Reset Password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}

export async function sendPasswordChangeNotification(to: string) {
  await transporter.sendMail({
    to,
    from: fromEmail,
    subject: "Your password was changed",
    html: `<p>Your password was successfully changed. If this wasn’t you, contact support immediately.</p>`,
  });
}
