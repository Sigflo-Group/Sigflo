import { env } from './config/env.js';
import { startExitAutomationWorker } from './jobs/exitAutomationWorker.js';
import { log } from './lib/logger.js';
import { createApp } from './app.js';

const app = createApp();

const host = process.env.HOST ?? '0.0.0.0';
app.listen(env.PORT, host, () => {
  log('info', `Backend listening on ${host}:${env.PORT}`);
  startExitAutomationWorker();
});
