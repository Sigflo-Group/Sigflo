import { describe, expect, it } from 'vitest';
import { computeStepUpRequired } from '../sessionSecurityUi';

describe('computeStepUpRequired', () => {
  it('requires step-up when security state is unknown', () => {
    expect(computeStepUpRequired(null, true)).toBe(true);
  });

  it('requires step-up when server says so', () => {
    expect(
      computeStepUpRequired(
        {
          userId: 'u1',
          stepUp: { required: true, verifiedAt: null, validUntil: null },
          oneTapEnabled: false,
          mfaEnabled: false,
          sessions: [],
        },
        false,
      ),
    ).toBe(true);
  });

  it('allows access when verified and state known', () => {
    expect(
      computeStepUpRequired(
        {
          userId: 'u1',
          stepUp: { required: false, verifiedAt: new Date().toISOString(), validUntil: null },
          oneTapEnabled: false,
          mfaEnabled: true,
          sessions: [],
        },
        false,
      ),
    ).toBe(false);
  });
});
