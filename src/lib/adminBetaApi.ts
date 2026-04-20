import { resolveAppApiPath } from '@/lib/appBasePath';

const endpoint = () => resolveAppApiPath(undefined, '/api/admin/beta');

export type AdminBetaListResponse = {
  ok?: boolean;
  profiles?: Array<{ id: string; email: string; approved: boolean; created_at: string }>;
  error?: string;
};

export type AdminBetaApproveResponse = {
  ok?: boolean;
  profile?: { id: string; email: string; approved: boolean };
  error?: string;
};

export async function postAdminBeta(accessToken: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}

/** Server verifies JWT + SIGFLO_BETA_ADMIN_* env; used to bypass waitlist for team. */
export async function checkIsBetaAdmin(accessToken: string): Promise<boolean> {
  try {
    const res = await postAdminBeta(accessToken, { action: 'me' });
    if (!res.ok) return false;
    const j = (await res.json()) as { ok?: boolean; isAdmin?: boolean };
    return j.ok === true && j.isAdmin === true;
  } catch {
    return false;
  }
}
