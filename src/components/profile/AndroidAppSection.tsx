import { useState } from 'react';
import {
  ANDROID_APP_CONFIG,
  ANDROID_APP_PLACEHOLDER_COPY,
  isAndroidPlayStoreConfigured,
  isAndroidUserAgent,
  resolveAndroidPlayStoreUrl,
} from '@/config/androidApp';

function ActionRow({
  label,
  subtext,
  onClick,
  tone = 'default',
}: {
  label: string;
  subtext: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-[#1c1d26] ${
        tone === 'danger'
          ? 'border-rose-400/20 bg-rose-500/[0.06] text-rose-100 hover:border-rose-400/30'
          : 'border-white/[0.08] bg-sigflo-elevated text-sigflo-text hover:border-white/[0.14]'
      }`}
    >
      <p>{label}</p>
      <p className="mt-0.5 text-[11px] text-sigflo-muted">{subtext}</p>
    </button>
  );
}

export function AndroidAppSection() {
  const [notice, setNotice] = useState<string | null>(null);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const playStoreReady = isAndroidPlayStoreConfigured();
  const onAndroid = isAndroidUserAgent();

  function openPlayStoreUpdate() {
    if (!playStoreReady) {
      setNotice(ANDROID_APP_PLACEHOLDER_COPY.updateSoon);
      return;
    }
    const url = resolveAndroidPlayStoreUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
    setNotice('Opened Google Play — install or update Sigflo from your store listing.');
  }

  function openUninstallGuide() {
    setUninstallOpen(true);
    setNotice(null);
  }

  return (
    <>
      <section className="rounded-2xl border border-white/[0.06] bg-sigflo-surface sigflo-panel-texture p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sigflo-muted">Android app</p>
          <span className="rounded-full border border-white/10 bg-sigflo-elevated px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sigflo-muted">
            {playStoreReady ? 'Play Store' : 'Placeholder'}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sigflo-muted/70">
          {onAndroid
            ? 'Install and update Sigflo through Google Play when the listing is live.'
            : 'For the Android install from Google Play — update and uninstall options below.'}
        </p>
        <p className="mt-2 text-[11px] text-sigflo-muted">
          Installed build:{' '}
          <span className="font-mono font-semibold text-white/85">{ANDROID_APP_CONFIG.installedVersionLabel}</span>
          {!playStoreReady ? (
            <span className="text-white/40"> · package {ANDROID_APP_CONFIG.packageName}</span>
          ) : null}
        </p>
        <div className="mt-2.5 space-y-2">
          <ActionRow
            label={playStoreReady ? 'Update on Google Play' : 'Check for updates (Play Store)'}
            subtext={
              playStoreReady
                ? 'Opens your listing to install the latest release'
                : 'Placeholder — wire VITE_ANDROID_PLAY_STORE_URL when published'
            }
            onClick={openPlayStoreUpdate}
          />
          <ActionRow
            label="Uninstall app"
            subtext="Remove Sigflo from this device (Play Store / Android settings)"
            onClick={openUninstallGuide}
            tone="danger"
          />
        </div>
        {notice ? (
          <p className="mt-2 rounded-lg border border-white/[0.08] bg-sigflo-elevated px-2.5 py-2 text-[11px] leading-relaxed text-sigflo-text">
            {notice}
          </p>
        ) : null}
      </section>

      {uninstallOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setUninstallOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-rose-400/25 bg-[#0B0B0B] p-4 shadow-[0_0_40px_-18px_rgba(255,91,123,0.45)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-labelledby="android-uninstall-title"
          >
            <p id="android-uninstall-title" className="text-sm font-semibold text-rose-100">
              Uninstall Sigflo (placeholder)
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-rose-100/85">
              {ANDROID_APP_PLACEHOLDER_COPY.uninstallSoon}
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-white/75">
              <li>Open <span className="font-semibold text-white">Settings → Apps → Sigflo → Uninstall</span>, or</li>
              <li>
                Open{' '}
                {playStoreReady ? (
                  <a
                    href={resolveAndroidPlayStoreUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sigflo-accent underline underline-offset-2"
                  >
                    Google Play
                  </a>
                ) : (
                  <span className="font-semibold text-white">Google Play</span>
                )}{' '}
                → Sigflo → Uninstall.
              </li>
            </ol>
            <p className="mt-3 text-[10px] leading-relaxed text-white/45">
              Signing out above does not remove the app. Deleting your Sigflo account is separate from uninstalling the
              Android package.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              {playStoreReady ? (
                <button
                  type="button"
                  onClick={() => {
                    window.open(resolveAndroidPlayStoreUrl(), '_blank', 'noopener,noreferrer');
                  }}
                  className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-sigflo-text transition hover:bg-white/[0.07]"
                >
                  Open Play Store
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setUninstallOpen(false)}
                className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
