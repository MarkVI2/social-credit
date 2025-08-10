import { transporter } from "./mailService";

const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER || "";

export async function sendAdminCreditUpdateEmail(
  to: string,
  delta: number,
  newBalance: number,
  reason: string
) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Social Credit";
  const sign = delta >= 0 ? "+" : "";
  const amount = `${sign}${delta}`;
  const html = `
    <p>${appName} credit update.</p>
    <p>Amount changed: <b>${amount}</b></p>
    <p>New balance: <b>${newBalance}</b></p>
    <p>Reason: ${reason || "(none)"}</p>
    <p>Timestamp: ${new Date().toLocaleString()}</p>
  `;
  await transporter.sendMail({
    to,
    from: fromEmail,
    subject: `Credit Update from ${appName}`,
    html,
  });
}
