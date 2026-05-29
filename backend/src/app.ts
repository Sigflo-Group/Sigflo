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
import { portfolioRouter } from './routes/portfolio.js';
import { tradeRouter } from './routes/trade.js';
import { exitWatchRouter } from './routes/exitWatch.js';
import { sessionRouter } from './routes/session.routes.js';
import { exchangeRouter } from './routes/exchange.routes.js';
import { secureTradeRouter } from './routes/trade.routes.js';
import { signalRouter } from './routes/signal.routes.js';
import { aiRouter } from './routes/ai.js';
import { feedbackRouter } from './routes/feedback.routes.js';
import { securityRouter } from './routes/security.routes.js';
import { listTrades } from './controllers/trade.controller.js';
import { mexcPublicRouter } from './routes/mexcPublic.js';
import { authRouter } from './routes/auth.routes.js';
import { db } from './db/index.js';

export function createApp() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = express();
  app.disable('etag');

  // Build the allowed-origins list from the env var, then add the Vite dev
  // server origins automatically in non-production so local development works
  // without touching .env each time.
  const allowedOrigins = env.FRONTEND_ORIGIN.split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!isProd) {
    for (const o of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
      if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
    }
  }

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
      credentials: true,
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === 'null') return callback(new Error('CORS blocked'));
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS blocked'));
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

  app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch {
    res.status(503).json({ ok: false, db: 'disconnected' });
  }
});

  app.use('/api/mexc-public', mexcPublicRouter);
  app.use('/api/auth', authRouteLimiter, authRouter);
  app.use('/api/portfolio', requireAuth, portfolioRouter);
  app.use('/api/trade', requireAuth, tradeRouter);
  app.use('/api/exit-watch', requireAuth, exitWatchRouter);

  app.use('/api/session', requireAuth, sessionRouter);
  app.use('/api/exchange', requireAuth, exchangeRouter);
  // secureTradeRouter handles intent/execute flows — mounted on /api/trade/managed
  // to avoid sharing a prefix with tradeRouter (/api/trade/bybit/*) which would
  // make route conflicts invisible until a path clash actually occurs.
  app.use('/api/trade/managed', requireAuth, secureTradeRouter);
  app.get('/api/trades', requireAuth, (req, res, next) => {
    listTrades(req as Parameters<typeof listTrades>[0], res).catch(next);
  });
  app.use('/api/signals', requireAuth, signalRouter);
  app.use('/api/ai', requireAuth, aiRouter);
  app.use('/api/feedback', requireAuth, feedbackRouter);
  app.use('/api/security', requireAuth, securityRouter);

  app.use(errorHandler);
  return app;
}
