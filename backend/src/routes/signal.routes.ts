import { Router } from 'express';

export const signalRouter = Router();

signalRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});
