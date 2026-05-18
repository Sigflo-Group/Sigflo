import { env } from './config/env.js';
import { startExitAutomationWorker } from './jobs/exitAutomationWorker.js';
import { startOpportunitySyncWorker } from './jobs/opportunitySyncWorker.js';
import { log } from './lib/logger.js';
import { runStartupSchemaCheck } from './lib/startupSchemaCheck.js';
import { createApp } from './app.js';
import { db } from './db/index.js';

const app = createApp();

const host = process.env.HOST ?? '0.0.0.0';
const server = app.listen(env.PORT, host, () => {
  log('info', `Backend listening on ${host}:${env.PORT}`);

  void runStartupSchemaCheck()
    .then(({ ready }) => {
      if (!ready) {
        log('warn', 'Background workers skipped — run migrations and restart to enable them.');
        return;
      }
      startExitAutomationWorker();
      startOpportunitySyncWorker();
    })
    .catch((e: unknown) => {
      log('warn', 'Startup schema check threw unexpectedly — workers not started.', {
        error: e instanceof Error ? e.message : String(e),
      });
    });
});

async function gracefulShutdown(signal: string): Promise<void> {
  log('info', `Received ${signal}, starting graceful shutdown.`);
  server.close(async () => {
    log('info', 'HTTP server closed.');
    try {
      await db.end();
      log('info', 'Database pool closed.');
    } catch (e) {
      log('error', 'Error closing database pool.', { error: String(e) });
    }
    process.exit(0);
  });
  setTimeout(() => {
    log('error', 'Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
