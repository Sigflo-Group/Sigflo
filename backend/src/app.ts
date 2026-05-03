import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { auditContext } from './middleware/auditContext.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { authRouteLimiter } from './middleware/rateLimit.js';
import { integrationsRouter } from './routes/integrations.js';
import { portfolioRouter } from './routes/portfolio.js';
import { tradeRouter } from './routes/trade.js';
import { exitWatchRouter } from './routes/exitWatch.js';
import { sessionRouter } from './routes/session.routes.js';
import { exchangeRouter } from './routes/exchange.routes.js';
import { secureTradeRouter } from './routes/trade.routes.js';
import { signalRouter } from './routes/signal.routes.js';
import { listTrades } from './controllers/trade.controller.js';
import { authRouter } from './routes/auth.routes.js';

export function createApp() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = express();
  const allowedOrigins = env.FRONTEND_ORIGIN.split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  app.set('trust proxy', 1);
  app.use(
    helmet({
      strictTransportSecurity: isProd ? true : false,
      contentSecurityPolicy: isProd
        ? true
        : {
            directives: {
              upgradeInsecureRequests: null,
            },
          },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
    }),
  );
  app.use(requestId);
  app.use(auditContext);
  app.use(express.json({ limit: '200kb' }));
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouteLimiter, authRouter);
  app.use('/api/integrations', requireAuth, integrationsRouter);
  app.use('/api/portfolio', requireAuth, portfolioRouter);
  app.use('/api/trade', requireAuth, tradeRouter);
  app.use('/api/exit-watch', requireAuth, exitWatchRouter);

  app.use('/api/session', requireAuth, sessionRouter);
  app.use('/api/exchange', requireAuth, exchangeRouter);
  app.use('/api/trade', requireAuth, secureTradeRouter);
  app.get('/api/trades', requireAuth, (req, res, next) => {
    listTrades(req as Parameters<typeof listTrades>[0], res).catch(next);
  });
  app.use('/api/signals', requireAuth, signalRouter);

  app.use(errorHandler);
  return app;
}
