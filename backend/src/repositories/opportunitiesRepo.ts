import { db } from '../db/index.js';

export type UpsertOpportunityInput = {
  id: string;
  pair: string;
  direction: 'long' | 'short';
  setupType: string;
  strategyType: string;
  sourceEngine: string;
  status:
    | 'watching'
    | 'building'
    | 'ready'
    | 'triggered'
    | 'managing'
    | 'completed'
    | 'invalidated'
    | 'cooling_off';
  score: number;
  thesis: string;
  rationale: string;
  entryZone?: string | null;
  invalidation?: string | null;
  targets?: string[];
  timeframeAlignment?: string[];
  freshnessSec?: number;
  riskLabel: 'low' | 'medium' | 'high';
  isDemo?: boolean;
};

export async function upsertOpportunities(rows: UpsertOpportunityInput[]): Promise<void> {
  if (rows.length === 0) return;
  for (const row of rows) {
    await db.query(
      `insert into opportunities (
        id, pair, direction, setup_type, strategy_type, source_engine, status, score,
        thesis, rationale, entry_zone, invalidation, targets, timeframe_alignment,
        freshness_sec, risk_label, is_demo, updated_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,
        $15,$16,$17,now()
      )
      on conflict (id) do update set
        pair = excluded.pair,
        direction = excluded.direction,
        setup_type = excluded.setup_type,
        strategy_type = excluded.strategy_type,
        source_engine = excluded.source_engine,
        status = excluded.status,
        score = excluded.score,
        thesis = excluded.thesis,
        rationale = excluded.rationale,
        entry_zone = excluded.entry_zone,
        invalidation = excluded.invalidation,
        targets = excluded.targets,
        timeframe_alignment = excluded.timeframe_alignment,
        freshness_sec = excluded.freshness_sec,
        risk_label = excluded.risk_label,
        is_demo = excluded.is_demo,
        updated_at = now()`,
      [
        row.id,
        row.pair,
        row.direction,
        row.setupType,
        row.strategyType,
        row.sourceEngine,
        row.status,
        row.score,
        row.thesis,
        row.rationale,
        row.entryZone ?? null,
        row.invalidation ?? null,
        row.targets ?? [],
        row.timeframeAlignment ?? [],
        row.freshnessSec ?? 0,
        row.riskLabel,
        row.isDemo ?? false,
      ],
    );
  }
}
