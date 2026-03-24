import nodemailer from "nodemailer";
import { logEmail } from "@/lib/logger";

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || "587");
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM;

const secure = port === 465;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure, 
  auth: { user, pass },
  tls: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // Reduced to 10 seconds
  greetingTimeout: 10000,   // Reduced to 10 seconds
  socketTimeout: 10000,     // Reduced to 10 seconds
  debug: true, 
  logger: {
    debug: (msg: any) => logEmail(`[SMTP_DEBUG]`, msg),
    info: (msg: any) => logEmail(`[SMTP_INFO]`, msg),
    warn: (msg: any) => logEmail(`[SMTP_WARN]`, msg),
    error: (msg: any) => logEmail(`[SMTP_ERROR]`, msg),
  }
} as any);

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  logEmail(`[MAIL_START] Request to send email to: ${to} | Subject: ${subject}`);

  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    logEmail(`[MAIL_DEBUG] Server Public IP: ${ipData.ip}`);
  } catch (ipErr) {
    logEmail(`[MAIL_WARN] Could not fetch server IP: ${ipErr}`);
  }

  if (!host || !user || !pass) {
    logEmail("[MAIL_ERROR] Skipping email send: Missing environment variables.", { host, port, user, hasPass: !!pass });
    return;
  }

  logEmail(`[MAIL_CONFIG] Host: ${host} | Port: ${port} | User: ${user} | Secure: ${port === 465}`);

  try {
    // Verify connection configuration
    logEmail(`[MAIL_DEBUG] Verifying SMTP connection to ${host}:${port}...`);
    await transporter.verify();
    logEmail("[MAIL_DEBUG] SMTP connection established.");

    const info = await transporter.sendMail({
      from: from || user,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    logEmail(`[MAIL_SUCCESS] Message sent! MessageID: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logEmail(`[MAIL_SMTP_FAILED] SMTP failed, attempting Brevo API fallback...`, { 
      message: error.message,
      code: error.code 
    });

    // FALLBACK: Brevo API (Port 443 - Never blocked)
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": pass || "",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { email: from || "noreply@efes.md", name: "Alfred" },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html || text.replace(/\n/g, "<br>"),
          textContent: text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      logEmail(`[MAIL_API_SUCCESS] Email sent via Brevo API! MessageID: ${data.messageId}`);
      return data;
    } catch (apiError: any) {
      logEmail(`[MAIL_FATAL] Both SMTP and API failed: ${apiError.message}`);
      throw apiError;
    }
  }
}
