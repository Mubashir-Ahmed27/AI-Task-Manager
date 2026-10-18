import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env first, then fallback to root /.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DEFAULT_PORT = 3000;
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173';

/**
 * Validates and normalizes environment configuration.
 * Can be called at startup to fail fast with a clear, safe message if required configuration is missing.
 */
export function getEnv(overrides = {}) {
  const raw = { ...process.env, ...overrides };
  const nodeEnv = raw.NODE_ENV || 'development';
  const port = Number.parseInt(raw.PORT || String(DEFAULT_PORT), 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: "${raw.PORT}". Expected an integer between 1 and 65535.`);
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    MONGODB_URI: (raw.MONGODB_URI || '').trim(),
    GROQ_API_KEY: (raw.GROQ_API_KEY || '').trim(),
    GROQ_MODEL: (raw.GROQ_MODEL || DEFAULT_GROQ_MODEL).trim() || DEFAULT_GROQ_MODEL,
    CLIENT_ORIGIN: (raw.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN).trim() || DEFAULT_CLIENT_ORIGIN,
    AI_TIMEOUT_MS: Number.parseInt(raw.AI_TIMEOUT_MS || '15000', 10) || 15000,
  };
}

/**
 * Validates required startup variables for running the server process.
 * Fails with a clear, safe message without exposing sensitive secrets.
 */
export function validateStartupEnv(envConfig = getEnv()) {
  const missing = [];

  if (!envConfig.MONGODB_URI && envConfig.NODE_ENV === 'production') {
    missing.push('MONGODB_URI');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Please check your .env file against .env.example before starting the server.'
    );
  }

  return envConfig;
}

export const env = getEnv();
