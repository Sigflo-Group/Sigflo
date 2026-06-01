import { Router } from 'express';
import { env } from '../config/env.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateRequest.js';
import { aiSuggestSchema, aiNewsScanSchema } from '../schemas/ai.schema.js';

export const aiRouter = Router();

const NEWS_SCAN_SYSTEM = `You are a crypto news analyst. Analyze recent news for the given asset or market regime. Return a JSON object with "summary" (string), "sentiment" (bullish|bearish|neutral), and "articles" (array of {id, title, link, source, published, excerpt}).`;

aiRouter.post('/news-scan', aiLimiter, validateBody(aiNewsScanSchema), async (req, res) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  const { mode, focusAsset, marketRegime } = req.body as {
    mode: 'short' | 'deep';
    focusAsset?: string | null;
    marketRegime?: string;
  };

  const assetPrompt = focusAsset ? `Focus on news related to ${focusAsset}.` : '';
  const regimePrompt = marketRegime ? `Current market regime: ${marketRegime}.` : '';
  const depth = mode === 'deep' ? 'Provide a detailed analysis.' : 'Provide a concise summary.';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: NEWS_SCAN_SYSTEM },
          { role: 'user', content: `${assetPrompt} ${regimePrompt} ${depth} Return the result as JSON.` },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(response.status).json({ error: `OpenAI API error: ${error}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (e instanceof DOMException && e.name === 'AbortError') {
      res.status(504).json({ error: 'News scan timed out' });
      return;
    }
    res.status(500).json({ error: `News scan failed: ${message}` });
  } finally {
    clearTimeout(timeout);
  }
});

aiRouter.post('/suggest', aiLimiter, validateBody(aiSuggestSchema), async (req, res) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  const { model, messages, temperature, response_format } = req.body;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(response_format ? { response_format } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      res.status(response.status).json({ error: `OpenAI API error: ${error}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (e instanceof DOMException && e.name === 'AbortError') {
      res.status(504).json({ error: 'AI request timed out' });
      return;
    }
    res.status(500).json({ error: `AI request failed: ${message}` });
  } finally {
    clearTimeout(timeout);
  }
});