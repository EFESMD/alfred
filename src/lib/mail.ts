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

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Alfred - Resetare Parolă",
    text: `Ai solicitat resetarea parolei pentru contul tău Alfred. 
Dacă nu ai solicitat acest lucru, poți ignora acest email.

Accesează următorul link pentru a seta o nouă parolă (link-ul expiră în o oră):
${resetUrl}

Echipa Alfred`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Resetare Parolă Alfred</h2>
        <p>Ai solicitat resetarea parolei pentru contul tău Alfred.</p>
        <p>Dacă nu ai solicitat acest lucru, poți ignora acest email în siguranță.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Resetează Parola</a>
        </div>
        <p style="font-size: 12px; color: #666;">Dacă butonul nu funcționează, copiază și lipește acest link în browser: <br>${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Acest link expiră în 60 de minute.</p>
      </div>
    `
  });
}

export async function sendPasswordChangeOTP(to: string, code: string) {
  return sendEmail({
    to,
    subject: "Alfred - Cod Verificare Modificare Parolă",
    text: `Codul tău de verificare pentru modificarea parolei este: ${code}. 
Acest cod expiră în 10 minute. 

Dacă nu ai inițiat această modificare, contactează administratorul imediat.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Verificare Modificare Parolă</h2>
        <p>Folosește codul de mai jos pentru a confirma modificarea parolei în platforma Alfred:</p>
        <div style="background-color: #f5f6f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 14px; color: #666;">Codul este valabil timp de 10 minute.</p>
        <p style="font-size: 12px; color: #e11d48; font-weight: bold;">Dacă nu ai cerut tu acest cod, te rugăm să contactezi administratorul imediat.</p>
      </div>
    `
  });
}

export async function sendPasswordChangedNotification(to: string) {
  return sendEmail({
    to,
    subject: "Alfred - Parola a fost modificată",
    text: `Salut,\n\nParola contului tău Alfred a fost modificată cu succes.\n\nDacă nu tu ai făcut această modificare, te rugăm să contactezi administratorul sistemului imediat.\n\nEchipa Alfred`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Parolă Modificată cu Succes</h2>
        <p>Salut,</p>
        <p>Te informăm că parola pentru contul tău <strong>Alfred</strong> a fost schimbată recent.</p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534;">Dacă tu ai efectuat această schimbare, poți ignora acest email.</p>
        </div>
        <p style="font-size: 12px; color: #e11d48; font-weight: bold;">IMPORTANT: Dacă NU tu ai făcut această modificare, contactează administratorul platformei imediat!</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Acesta este un email automat, te rugăm să nu răspunzi.</p>
      </div>
    `
  });
}
