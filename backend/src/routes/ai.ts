import { Router } from 'express';
import { env } from '../config/env.js';

export const aiRouter = Router();

aiRouter.post('/suggest', async (req, res) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  const { model = 'gpt-4o-mini', messages, temperature = 0.15, response_format } = req.body;

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
    res.status(500).json({ error: `AI request failed: ${message}` });
  }
});