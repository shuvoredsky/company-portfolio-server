import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import seedAdmin from './app/utils/seedAdmin';
import config, { isPlaceholderMongoUri } from './config';

let server: Server | undefined;

process.on('uncaughtException', (err: Error) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  if (isPlaceholderMongoUri(config.mongodbUri)) {
    if (config.nodeEnv === 'production') {
      console.error(
        '[FATAL] MONGODB_URI must be configured with a valid MongoDB connection string in production.',
      );
      process.exit(1);
    }

    console.warn(
      '[WARN] MONGODB_URI is empty or a placeholder. Skipping MongoDB connection in development mode.',
    );
  } else {
    await mongoose.connect(config.mongodbUri);
    console.log('[INFO] Connected to MongoDB');
  }

  await seedAdmin();

  server = app.listen(config.port, () => {
    console.log(
      `[INFO] Server listening on http://localhost:${config.port} (${config.nodeEnv})`,
    );
  });
}

const shutdown = (signal: string, exitCode: number): void => {
  console.log(`[INFO] ${signal} received. Starting graceful shutdown...`);

  const closeDatabaseAndExit = async (): Promise<void> => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('[INFO] MongoDB connection closed.');
      }
    } catch (dbErr) {
      console.error('[ERROR] Error while closing MongoDB connection:', dbErr);
    } finally {
      process.exit(exitCode);
    }
  };

  if (server) {
    server.close(() => {
      console.log('[INFO] HTTP server closed.');
      void closeDatabaseAndExit();
    });
  } else {
    void closeDatabaseAndExit();
  }
};

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  shutdown('unhandledRejection', 1);
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM', 0);
});

process.on('SIGINT', () => {
  shutdown('SIGINT', 0);
});

bootstrap().catch((err: unknown) => {
  console.error('[FATAL] Failed to start server:', err);
  process.exit(1);
});

