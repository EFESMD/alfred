import fs from 'fs';
import path from 'path';

// Helper to ensure logs directory exists
const LOG_DIR = path.join(process.cwd(), 'logs');
const EMAIL_LOG_FILE = path.join(LOG_DIR, 'email.log');

if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR);
  } catch (e) {
    console.error("Failed to create logs directory", e);
  }
}

export function logEmail(message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;

  if (meta) {
    try {
      logMessage += ` ${JSON.stringify(meta)}`;
    } catch (e) {
      logMessage += ` [Meta Error: ${e}]`;
    }
  }

  logMessage += '\n';

  // Console log for immediate feedback in dev/build logs
  console.log(`[EMAIL_LOG] ${message}`, meta || '');

  try {
    fs.appendFileSync(EMAIL_LOG_FILE, logMessage);
  } catch (e) {
    console.error("Failed to write to email log file", e);
  }
}

export function getEmailLogs(lines = 100): string {
  try {
    if (!fs.existsSync(EMAIL_LOG_FILE)) {
      return "No email logs found.";
    }
    const content = fs.readFileSync(EMAIL_LOG_FILE, 'utf-8');
    const allLines = content.split('\n');
    return allLines.slice(-lines).join('\n');
  } catch (e) {
    return `Error reading logs: ${e}`;
  }
}
