import { env } from './config/env.js';
import { startExitAutomationWorker } from './jobs/exitAutomationWorker.js';
import { startOpportunitySyncWorker } from './jobs/opportunitySyncWorker.js';
import { log } from './lib/logger.js';
import { runStartupSchemaCheck } from './lib/startupSchemaCheck.js';
import { createApp } from './app.js';

const app = createApp();

const host = process.env.HOST ?? '0.0.0.0';
app.listen(env.PORT, host, () => {
  log('info', `Backend listening on ${host}:${env.PORT}`);

  // Run schema check first and only start background workers when the DB is
  // confirmed ready. Workers may crash the tick loop if required tables are
  // absent, so skipping them until migrations are applied keeps startup clean.
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
