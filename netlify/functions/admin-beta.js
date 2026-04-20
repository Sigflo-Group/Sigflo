import { ensureRootEnvLoaded } from './lib/load-root-env.mjs';
import { runAdminBeta } from './lib/admin-beta-core.mjs';

export const handler = async (event) => {
  ensureRootEnvLoaded();

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204 };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const auth = event.headers.authorization ?? event.headers.Authorization;
  const result = await runAdminBeta(event.body, auth, process.env);

  return {
    statusCode: result.statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.body),
  };
};
