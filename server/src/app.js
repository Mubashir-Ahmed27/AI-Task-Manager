import express from 'express';
import cors from 'cors';
import { getEnv } from './config/env.js';
import { getDatabaseStatus } from './config/database.js';
import taskRoutes from './modules/tasks/task.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();
  const currentEnv = getEnv();

  // Disable Express X-Powered-By header for security
  app.disable('x-powered-by');

  // Configure CORS for local development and configured production origins
  const allowedOrigins = currentEnv.CLIENT_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests with no origin (like curl, Postman, or server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (currentEnv.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Limit JSON request payload size to prevent abuse
  app.use(express.json({ limit: '100kb' }));

  // Health & Status endpoint (does not expose secrets or sensitive config)
  app.get('/api/health', (_req, res) => {
    const dbStatus = getDatabaseStatus();
    const latestEnv = getEnv();
    const aiConfigured = Boolean(
      latestEnv.GROQ_API_KEY && latestEnv.GROQ_API_KEY !== 'your_groq_api_key_here'
    );

    res.status(200).json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus.state,
        aiPlanner: aiConfigured ? 'configured' : 'unconfigured',
      },
    });
  });

  // Business module routes
  app.use('/api/tasks', taskRoutes);
  app.use('/api/ai', aiRoutes);

  // Centralized 404 and Error Handling
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

const app = createApp();
export default app;
