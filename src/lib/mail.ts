import nodemailer from "nodemailer";
import { logEmail } from "@/lib/logger";

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || "465");
const user = process.env.EMAIL_SERVER_USER;
const pass = process.env.EMAIL_SERVER_PASSWORD;
const from = process.env.EMAIL_FROM;

const secure = port === 465;

const transporter = nodemailer.createTransport({
  host: "mail.efes.md",
  port: 465,
  secure: true, // Implicit SSL
  name: "mail.efes.md", 
  auth: { 
    user: "noreply@efes.md", 
    pass: "16ditSW2xO45" 
  },
  tls: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: false,
  },
  connectionTimeout: 30000, 
  greetingTimeout: 30000,   
  socketTimeout: 30000,     
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

  try {
    // Verify connection configuration
    logEmail("[MAIL_DEBUG] Verifying SMTP connection to mail.efes.md...");
    await transporter.verify();
    logEmail("[MAIL_DEBUG] SMTP connection established.");

    const info = await transporter.sendMail({
      from: "noreply@efes.md",
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    logEmail(`[MAIL_SUCCESS] Message sent! MessageID: ${info.messageId}`);
    return info;
  } catch (error: any) {
    logEmail(`[MAIL_FATAL] Error sending email: ${error.message}`, {
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    throw error;
  }
}
