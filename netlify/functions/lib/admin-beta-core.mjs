import { createClient } from '@supabase/supabase-js';

function parseAdminEmails(env) {
  const raw = env.SIGFLO_BETA_ADMIN_EMAILS ?? '';
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseAdminUserIds(env) {
  const raw = env.SIGFLO_BETA_ADMIN_USER_IDS ?? '';
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function supabaseUrl(env) {
  return (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').trim();
}

function supabaseAnonKey(env) {
  return (env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? '').trim();
}

/**
 * @param {string | null | undefined} rawBody
 * @param {string | null | undefined} authorizationHeader
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<{ statusCode: number, body: Record<string, unknown> }>}
 */
export async function runAdminBeta(rawBody, authorizationHeader, env) {
  const url = supabaseUrl(env);
  const anonKey = supabaseAnonKey(env);
  const serviceRole = (env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

  if (!url || !anonKey) {
    return {
      statusCode: 503,
      body: { error: 'Supabase URL/anon key not configured on server (SUPABASE_URL + SUPABASE_ANON_KEY or VITE_*).' },
    };
  }
  if (!serviceRole) {
    return {
      statusCode: 503,
      body: { error: 'SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Netlify env (server only, never VITE_*).' },
    };
  }

  const token = String(authorizationHeader ?? '')
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) {
    return { statusCode: 401, body: { error: 'Missing Authorization: Bearer <access_token>.' } };
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) {
    return { statusCode: 401, body: { error: 'Invalid or expired session.' } };
  }

  const email = (user.email ?? '').trim().toLowerCase();
  const adminEmails = parseAdminEmails(env);
  const adminIds = parseAdminUserIds(env);
  const isAdmin =
    (email && adminEmails.includes(email)) || (user.id && adminIds.includes(user.id));

  if (!isAdmin) {
    return { statusCode: 403, body: { error: 'Not a beta admin.' } };
  }

  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return { statusCode: 400, body: { error: 'Invalid JSON body.' } };
  }

  const action = typeof body.action === 'string' ? body.action.trim() : '';

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === 'me') {
    return { statusCode: 200, body: { ok: true, isAdmin: true } };
  }

  if (action === 'list') {
    const limit = Math.min(Math.max(Number(body.limit) || 80, 1), 200);
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, approved, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      return { statusCode: 400, body: { error: error.message, code: error.code } };
    }
    return { statusCode: 200, body: { ok: true, profiles: data ?? [] } };
  }

  if (action === 'approve') {
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    let targetEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!userId && !targetEmail) {
      return { statusCode: 400, body: { error: 'Provide userId (uuid) or email.' } };
    }

    let filterId = userId;
    if (!filterId && targetEmail) {
      const { data: rows, error: qErr } = await admin
        .from('profiles')
        .select('id, email')
        .ilike('email', targetEmail)
        .limit(5);
      if (qErr) {
        return { statusCode: 400, body: { error: qErr.message, code: qErr.code } };
      }
      const matches = rows ?? [];
      if (matches.length === 0) {
        return {
          statusCode: 404,
          body: { error: 'No profile row for that email. They must open the app once (waitlist) first.' },
        };
      }
      if (matches.length > 1) {
        return {
          statusCode: 409,
          body: { error: 'Multiple profiles match this email; use userId (UUID) from Authentication → Users.' },
        };
      }
      filterId = matches[0].id;
    }

    const { data: updated, error: uErr } = await admin
      .from('profiles')
      .update({ approved: true })
      .eq('id', filterId)
      .select('id, email, approved')
      .maybeSingle();

    if (uErr) {
      return { statusCode: 400, body: { error: uErr.message, code: uErr.code } };
    }
    if (!updated) {
      return { statusCode: 404, body: { error: 'No profile with that user id.' } };
    }
    return { statusCode: 200, body: { ok: true, profile: updated } };
  }

  if (action === 'revoke') {
    const revokeId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!revokeId) {
      return { statusCode: 400, body: { error: 'Provide userId for revoke.' } };
    }
    const { data: updated, error: uErr } = await admin
      .from('profiles')
      .update({ approved: false })
      .eq('id', revokeId)
      .select('id, email, approved')
      .maybeSingle();
    if (uErr) {
      return { statusCode: 400, body: { error: uErr.message, code: uErr.code } };
    }
    if (!updated) {
      return { statusCode: 404, body: { error: 'No profile with that user id.' } };
    }
    return { statusCode: 200, body: { ok: true, profile: updated } };
  }

  return {
    statusCode: 400,
    body: { error: 'Unknown action. Use: me | list | approve | revoke.' },
  };
}
