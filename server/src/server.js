import app from './app.js';
import { getEnv, validateStartupEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let serverInstance = null;

async function startServer() {
  try {
    const currentEnv = validateStartupEnv(getEnv());
    await connectDatabase(currentEnv.MONGODB_URI);

    serverInstance = app.listen(currentEnv.PORT, () => {
      console.log(
        `[Server] AI Task Manager API running in ${currentEnv.NODE_ENV} mode on http://localhost:${currentEnv.PORT}`
      );
    });
  } catch (error) {
    console.error(`[Startup Error] ${error.message}`);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  try {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await disconnectDatabase();
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
