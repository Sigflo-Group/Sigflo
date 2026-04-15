import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddBotFlowModal, type AddBotCompletePayload } from '@/components/bots/AddBotFlowModal';
import { BotCard } from '@/components/bots/BotCard';
import { BotConsensusStrip } from '@/components/bots/BotConsensusStrip';
import { BotOverviewCard } from '@/components/bots/BotOverviewCard';
import { TradingControlModeSheet } from '@/components/bots/TradingControlModeSheet';
import { useTradingControlMode } from '@/context/TradingControlModeContext';
import { useAccountSnapshot } from '@/hooks/useAccountSnapshot';
import { useBotStatuses } from '@/hooks/useBotStatuses';
import { useBotUserConfig } from '@/hooks/useBotUserConfig';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import {
  BOTS_RECENT_ACTIVITY_MAX,
  baseBots,
  resolveBotCardStatus,
} from '@/lib/bots';
import { deriveMarketStatus } from '@/lib/marketScannerRows';
import {
  buildBotCardExchangeStats,
  portfolioHasConnectedExchange,
  portfolioNetEquityUsd,
} from '@/lib/portfolioBotAttribution';
import { uiSignalStateClasses, uiSignalStateFromMarketStatus, uiSignalStateLabel } from '@/lib/signalState';
import type { CryptoSignal } from '@/types/signal';

export default function BotsScreen() {
  const navigate = useNavigate();
  const { signals } = useSignalEngine();
  const { items: portfolioSnapshots, closedTrades } = useAccountSnapshot({ pollMs: 12_000 });
  const { mode, meta, setMode } = useTradingControlMode();
  const [modeSheetOpen, setModeSheetOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const { statusMap, setBotStatus, togglePause } = useBotStatuses();
  const { mergeBot, upsertConfig } = useBotUserConfig();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addBotOpen, setAddBotOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1800);
    return () => window.clearInterval(id);
  }, []);

  const signalById = useMemo(() => {
    const map = new Map<string, CryptoSignal>();
    for (const s of signals) map.set(s.id, s);
    return map;
  }, [signals]);

  const portfolioConnected = useMemo(
    () => portfolioHasConnectedExchange(portfolioSnapshots),
    [portfolioSnapshots],
  );
  const portfolioEquityUsd = useMemo(() => portfolioNetEquityUsd(portfolioSnapshots), [portfolioSnapshots]);

  const exchangeFooterByBotId = useMemo(() => {
    if (!portfolioConnected) return undefined;
    const out: Record<string, ReturnType<typeof buildBotCardExchangeStats>> = {};
    for (const b of baseBots) {
      const merged = mergeBot(b);
      out[b.id] = buildBotCardExchangeStats(merged, closedTrades, portfolioEquityUsd);
    }
    return out;
  }, [portfolioConnected, closedTrades, portfolioEquityUsd, mergeBot]);

  const botsWithSignal = useMemo(
    () =>
      baseBots.map((b) => {
        const merged = mergeBot(b);
        return {
          ...merged,
          status: statusMap[b.id] ?? merged.status,
          signal: signalById.get(b.signalId) ?? signals[0],
        };
      }),
    [mergeBot, statusMap, signalById, signals],
  );

  const handleAddBotComplete = useCallback(
    (payload: AddBotCompletePayload) => {
      upsertConfig(payload.botId, { watchedPairs: payload.watchedPairs, riskLevel: payload.riskLevel });
      setBotStatus(payload.botId, 'scanning');
      setMode(payload.setupMode === 'assisted' ? 'assisted' : 'suggestion');
      setExpandedId(payload.botId);
    },
    [upsertConfig, setBotStatus, setMode],
  );

  const activeCount = botsWithSignal.filter((b) => b.status === 'active').length;
  const scanningCount = botsWithSignal.filter((b) => b.status === 'scanning').length;
  const pausedCount = botsWithSignal.filter((b) => b.status === 'paused').length;
  const watchingCount = new Set(botsWithSignal.flatMap((b) => b.watchedPairs)).size;
  const signalsTodayTotal = useMemo(() => {
    if (exchangeFooterByBotId) {
      return Object.values(exchangeFooterByBotId).reduce((s, x) => s + x.tradesToday, 0);
    }
    return botsWithSignal.reduce((s, b) => s + b.stats.signalsToday, 0);
  }, [exchangeFooterByBotId, botsWithSignal]);

  const inTradeCount = useMemo(() => {
    let n = 0;
    for (const b of botsWithSignal) {
      if (b.status === 'paused' || !b.signal) continue;
      const ui = uiSignalStateFromMarketStatus(deriveMarketStatus(b.signal));
      if (ui === 'triggered') n += 1;
    }
    return n;
  }, [botsWithSignal]);

  const overviewSubline = useMemo(() => {
    if (pausedCount === botsWithSignal.length) return 'All agents paused — resume when you want scanning to continue.';
    if (inTradeCount > 0)
      return inTradeCount === 1
        ? '1 agent is in a live position — others are scanning.'
        : `${inTradeCount} agents in live positions — supervise exits on Trade.`;
    if (scanningCount > 0 && activeCount > 0)
      return `${scanningCount} bot${scanningCount > 1 ? 's' : ''} monitoring high-priority conditions.`;
    if (activeCount > 0 && pausedCount === 0) return 'All systems running — agents are scanning and evaluating setups.';
    return 'Agents idle or scanning — open a bot for full detail.';
  }, [activeCount, botsWithSignal.length, inTradeCount, pausedCount, scanningCount]);

  const recentActivity = useMemo(() => {
    if (signals.length === 0) return [];
    const ordered = [...signals].sort((a, b) => b.setupScore - a.setupScore);
    const n = Math.min(BOTS_RECENT_ACTIVITY_MAX, ordered.length);
    return Array.from({ length: n }, (_, offset) => ordered[(tick + offset) % ordered.length]);
  }, [signals, tick]);

  const openBotWorkspace = useCallback(
    (botId: string) => {
      navigate(`/bots/${botId}/focus`);
    },
    [navigate],
  );

  const openBotSettings = useCallback(
    (botId: string) => {
      navigate(`/bots/${botId}/settings`);
    },
    [navigate],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  /** One focal card: first non-paused “setup forming”, else first available in Nova → Kai → Rio (skipped if paused / in trade). */
  const spotlightBotId = useMemo(() => {
    const cardStatusFor = (b: (typeof botsWithSignal)[0]) => {
      const hasSignal = b.signal != null;
      const marketStatus = hasSignal ? deriveMarketStatus(b.signal) : null;
      const uiState = marketStatus != null ? uiSignalStateFromMarketStatus(marketStatus) : null;
      return resolveBotCardStatus(b.status, uiState);
    };

    for (const b of botsWithSignal) {
      if (b.status === 'paused') continue;
      if (cardStatusFor(b) === 'setup_forming') return b.id;
    }

    for (const id of ['bot-nova', 'bot-kai', 'bot-rio'] as const) {
      const b = botsWithSignal.find((x) => x.id === id);
      if (!b || b.status === 'paused') continue;
      if (cardStatusFor(b) === 'in_trade') continue;
      return b.id;
    }
    return null;
  }, [botsWithSignal]);

  return (
    <div className="min-h-[100dvh] bg-sigflo-bg pb-24 pt-4">
      <div className="mx-auto w-full max-w-lg space-y-4 px-4">
        <BotOverviewCard
          metrics={{
            activeBots: activeCount,
            scanningBots: scanningCount,
            marketsWatched: watchingCount,
            signalsToday: signalsTodayTotal,
            todayActivityLabel: exchangeFooterByBotId ? 'Trades today' : undefined,
          }}
          subline={overviewSubline}
          modeLabel={`Mode: ${meta.label}`}
          onOpenModeSheet={() => setModeSheetOpen(true)}
          modeSheetOpen={modeSheetOpen}
          onAddBot={() => setAddBotOpen(true)}
        />

        <AddBotFlowModal
          open={addBotOpen}
          onClose={() => setAddBotOpen(false)}
          onComplete={handleAddBotComplete}
        />

        <TradingControlModeSheet
          open={modeSheetOpen}
          onClose={() => setModeSheetOpen(false)}
          currentMode={mode}
          onSelectMode={(m) => {
            setMode(m);
            setModeSheetOpen(false);
          }}
        />

        <section className="space-y-3">
          {botsWithSignal.map((bot) => {
            const signal = bot.signal;
            const hasSignal = signal != null;
            const marketStatus = hasSignal ? deriveMarketStatus(signal) : null;
            const uiState = marketStatus != null ? uiSignalStateFromMarketStatus(marketStatus) : null;
            const cardStatus = resolveBotCardStatus(bot.status, uiState);
            const isSpotlight = spotlightBotId != null && bot.id === spotlightBotId;

            return (
              <BotCard
                key={bot.id}
                bot={bot}
                signal={hasSignal ? signal : null}
                cardStatus={cardStatus}
                exchangeFooter={exchangeFooterByBotId?.[bot.id]}
                isSpotlight={isSpotlight}
                expanded={expandedId === bot.id}
                onToggleExpand={() => toggleExpand(bot.id)}
                onOpenBot={() => openBotWorkspace(bot.id)}
                onPause={() => togglePause(bot.id)}
                onSettings={() => openBotSettings(bot.id)}
                onViewChart={() => navigate(`/bots/${bot.id}/focus?focusSetup=1`)}
                onAdjustRisk={() => openBotWorkspace(bot.id)}
              />
            );
          })}
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sigflo-muted">Recent market activity</p>
          <div className="mt-2 space-y-1.5">
            {recentActivity.map((s) => {
              const state = uiSignalStateFromMarketStatus(deriveMarketStatus(s));
              const stateStyle = uiSignalStateClasses(state);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-sigflo-elevated px-2.5 py-2 text-xs"
                >
                  <p className="font-medium text-sigflo-text">{s.pair}</p>
                  <p className={`inline-flex items-center gap-1 font-semibold ${stateStyle.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stateStyle.dot}`} />
                    {uiSignalStateLabel(state)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <BotConsensusStrip />
      </div>
    </div>
  );
}
