export type VerifySupabaseAuthResult =
  | { ok: true; userId: string; email?: string }
  | { ok: false; statusCode: number; error: string };

export function verifySupabaseBearer(
  authorizationHeader: string | null | undefined,
  env: NodeJS.ProcessEnv,
): Promise<VerifySupabaseAuthResult>;

export function getClientIp(event: {
  headers?: Record<string, string | undefined>;
  requestContext?: { identity?: { sourceIp?: string } };
}): string;
