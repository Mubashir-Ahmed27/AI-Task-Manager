import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

/**
 * Connects to MongoDB using the configured MONGODB_URI.
 * In development (when MONGODB_URI is not set or if local MongoDB is unreachable and USE_MEMORY_DB_FALLBACK !== 'false'),
 * supports seamless fallback to an embedded in-memory MongoDB server so local evaluation works out-of-the-box.
 */
export async function connectDatabase(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);

  if (uri) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('[Database] Connected to MongoDB successfully.');
      return { mode: 'remote', uri };
    } catch (error) {
      if (env.NODE_ENV === 'production' || process.env.ALLOW_MEMORY_DB_FALLBACK === 'false') {
        throw new Error(`[Database] Failed to connect to MongoDB: ${error.message}`);
      }
      console.warn(
        `[Database] Could not reach configured MONGODB_URI (${error.message}). ` +
        'Falling back to in-memory MongoDB for local development...'
      );
    }
  } else if (env.NODE_ENV === 'production') {
    throw new Error('[Database] MONGODB_URI is required in production environment.');
  }

  // Fallback to embedded MongoMemoryServer for zero-config local development / testing
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memoryUri = memoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log('[Database] Connected to local in-memory MongoDB instance.');
  return { mode: 'memory', uri: memoryUri };
}

/**
 * Gracefully disconnects from MongoDB and stops any in-memory server instance.
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

/**
 * Returns a safe summary of the current database connection status without exposing credentials.
 */
export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    isConnected: mongoose.connection.readyState === 1,
  };
}
