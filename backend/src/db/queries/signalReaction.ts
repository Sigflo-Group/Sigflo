import { db } from '../index.js';

export type SignalReactionRow = {
  id: string;
  userId: string;
  signalId: string;
  pair: string;
  side: string;
  setupType: string;
  setupScore: number;
  riskTag: string | null;
  reaction: string;
  createdAt: string;
};

export async function upsertSignalReaction(input: {
  userId: string;
  signalId: string;
  pair: string;
  side: string;
  setupType: string;
  setupScore: number;
  riskTag: string | null;
  reaction: string;
}): Promise<void> {
  await db.query(
    `insert into signal_reactions
       (user_id, signal_id, pair, side, setup_type, setup_score, risk_tag, reaction)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (user_id, signal_id)
     do update set reaction = $8, created_at = now()`,
    [
      input.userId,
      input.signalId,
      input.pair,
      input.side,
      input.setupType,
      input.setupScore,
      input.riskTag,
      input.reaction,
    ],
  );
}
