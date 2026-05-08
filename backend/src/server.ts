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
  void runStartupSchemaCheck();
  startExitAutomationWorker();
  startOpportunitySyncWorker();
});
