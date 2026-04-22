import { Router } from 'express';

export const authRouter = Router();

authRouter.get('/health', (_req, res) => {
  res.json({ ok: true });
});
