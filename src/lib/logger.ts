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

export function logEmail(message: any, meta?: any) {
  const timestamp = new Date().toISOString();
  
  let formattedMessage = typeof message === 'string' 
    ? message 
    : JSON.stringify(message, null, 2);

  let logLine = `[${timestamp}] ${formattedMessage}`;

  if (meta) {
    try {
      logLine += ` ${JSON.stringify(meta, null, 2)}`;
    } catch (e) {
      logLine += ` [Meta Error: ${e}]`;
    }
  }

  logLine += '\n';

  // Console log for immediate feedback in dev/build logs
  console.log(`[EMAIL_LOG] ${formattedMessage}`, meta || '');

  try {
    fs.appendFileSync(EMAIL_LOG_FILE, logLine);
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
