import { useCallback, useMemo, useState } from 'react';
import type { BotAgent } from '@/lib/bots';
import {
  loadBotUserConfigMap,
  mergeBotConfigPatch,
  mergeBotWithUserConfig,
  persistBotUserConfigMap,
  type BotUserConfig,
  type BotUserRiskLevel,
} from '@/lib/botUserConfig';

export function useBotUserConfig() {
  const [configById, setConfigById] = useState<Record<string, BotUserConfig>>(() => loadBotUserConfigMap());

  const updateBotConfig = useCallback((botId: string, patch: Partial<BotUserConfig>) => {
    setConfigById((prev) => {
      const nextCfg = mergeBotConfigPatch(botId, prev[botId], patch);
      const next: Record<string, BotUserConfig> = { ...prev, [botId]: nextCfg };
      persistBotUserConfigMap(next);
      return next;
    });
  }, []);

  /** @deprecated Use updateBotConfig — kept for call sites that only set markets + risk. */
  const upsertConfig = useCallback(
    (botId: string, patch: { watchedPairs: string[]; riskLevel: BotUserRiskLevel }) => {
      updateBotConfig(botId, patch);
    },
    [updateBotConfig],
  );

  const mergeBot = useCallback(
    (base: BotAgent): BotAgent => mergeBotWithUserConfig(base, configById[base.id]),
    [configById],
  );

  const hasUserConfig = useCallback((botId: string) => Boolean(configById[botId]), [configById]);

  return useMemo(
    () => ({ configById, updateBotConfig, upsertConfig, mergeBot, hasUserConfig }),
    [configById, updateBotConfig, upsertConfig, mergeBot, hasUserConfig],
  );
}
