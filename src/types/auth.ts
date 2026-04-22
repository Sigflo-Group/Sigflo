export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
};

export type StepUpStatus = {
  required: boolean;
  verifiedAt: string | null;
  validUntil: string | null;
};

export type SecurityState = {
  userId: string;
  stepUp: StepUpStatus;
  oneTapEnabled: boolean;
  mfaEnabled: boolean;
  sessions: Array<{
    id: string;
    createdAt: string;
    revokedAt: string | null;
    ipAddress: string | null;
    userAgent: string | null;
  }>;
};
