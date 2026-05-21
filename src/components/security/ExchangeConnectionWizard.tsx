import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExchangeId } from '@/types/integrations';
import type { ExchangeConnectionStep } from '@/types/security';
import { useExchangeIntegrations } from '@/hooks/useExchangeIntegrations';

const STEP_ORDER: ExchangeConnectionStep[] = [
  'choose_exchange',
  'risk_disclosure',
  'create_key',
  'enter_credentials',
  'validating',
  'success',
];

const EXCHANGE_META: Record<ExchangeId, { name: string; logo: string; docsUrl: string; keyCreationUrl: string; description: string }> = {
  bybit: {
    name: 'Bybit',
    logo: '⬡',
    docsUrl: 'https://www.bybit.com/en/help-center/article/What-is-the-API',
    keyCreationUrl: 'https://www.bybit.com/app/user/api-management',
    description: 'Perpetual futures and spot. Recommended for most users.',
  },
  mexc: {
    name: 'MEXC',
    logo: '◈',
    docsUrl: 'https://support.mexc.com/hc/en-001/articles/360059658432',
    keyCreationUrl: 'https://www.mexc.com/user/openapi',
    description: 'Wide range of spot and futures markets.',
  },
};

type Props = {
  onComplete?: () => void;
  onCancel?: () => void;
};

export function ExchangeConnectionWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<ExchangeConnectionStep>('choose_exchange');
  const [selectedExchange, setSelectedExchange] = useState<ExchangeId | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [riskAccepted, setRiskAccepted] = useState(false);

  const { connect } = useExchangeIntegrations();

  const stepIndex = STEP_ORDER.indexOf(step);
  const visibleSteps = STEP_ORDER.filter((s) => s !== 'validating' && s !== 'success');
  const displayIndex = visibleSteps.indexOf(step);

  const advance = useCallback((next: ExchangeConnectionStep) => {
    setError(null);
    setStep(next);
  }, []);

  const handleConnect = useCallback(async () => {
    if (!selectedExchange || !apiKey.trim() || !apiSecret.trim()) return;
    setError(null);
    setStep('validating');
    try {
      await connect(selectedExchange, { apiKey: apiKey.trim(), apiSecret: apiSecret.trim() });
      setStep('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed.');
      setStep('enter_credentials');
    }
  }, [connect, selectedExchange, apiKey, apiSecret]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {step !== 'success' && step !== 'validating' && (
        <div className="flex items-center gap-1.5 mb-8">
          {visibleSteps.map((s, i) => (
            <div
              key={s}
              className={`h-[2px] flex-1 rounded-full transition-all duration-300 ${
                i <= displayIndex ? 'bg-sigflo-accent' : 'bg-white/8'
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'choose_exchange' && (
            <ChooseExchangeStep
              selected={selectedExchange}
              onSelect={setSelectedExchange}
              onNext={() => advance('risk_disclosure')}
              onCancel={onCancel}
            />
          )}
          {step === 'risk_disclosure' && selectedExchange && (
            <RiskDisclosureStep
              exchange={selectedExchange}
              accepted={riskAccepted}
              onAccept={setRiskAccepted}
              onNext={() => advance('create_key')}
              onBack={() => advance('choose_exchange')}
            />
          )}
          {step === 'create_key' && selectedExchange && (
            <CreateKeyStep
              exchange={selectedExchange}
              onNext={() => advance('enter_credentials')}
              onBack={() => advance('risk_disclosure')}
            />
          )}
          {step === 'enter_credentials' && selectedExchange && (
            <EnterCredentialsStep
              exchange={selectedExchange}
              apiKey={apiKey}
              apiSecret={apiSecret}
              label={label}
              error={error}
              onApiKeyChange={setApiKey}
              onApiSecretChange={setApiSecret}
              onLabelChange={setLabel}
              onConnect={handleConnect}
              onBack={() => advance('create_key')}
            />
          )}
          {step === 'validating' && <ValidatingStep exchange={selectedExchange!} />}
          {step === 'success' && selectedExchange && (
            <SuccessStep exchange={selectedExchange} onDone={onComplete} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChooseExchangeStep({
  selected,
  onSelect,
  onNext,
  onCancel,
}: {
  selected: ExchangeId | null;
  onSelect: (e: ExchangeId) => void;
  onNext: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-sigflo-text">Connect an exchange</h2>
        <p className="mt-1 text-sm text-sigflo-muted">
          Sigflo reads your positions and balance. It never trades on your behalf.
        </p>
      </div>
      <div className="space-y-2.5">
        {(Object.keys(EXCHANGE_META) as ExchangeId[]).map((id) => {
          const meta = EXCHANGE_META[id];
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? 'border-sigflo-accent/40 bg-sigflo-accentDim'
                  : 'border-white/6 bg-sigflo-surface hover:border-white/12 hover:bg-white/[0.03]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                  isSelected ? 'bg-sigflo-accent/15 text-sigflo-accent' : 'bg-white/5 text-sigflo-muted'
                }`}
              >
                {meta.logo}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-sigflo-text">{meta.name}</div>
                <div className="text-xs text-sigflo-muted mt-0.5">{meta.description}</div>
              </div>
              {isSelected && (
                <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-sigflo-accent flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!selected}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sigflo-accent/90 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function RiskDisclosureStep({
  exchange,
  accepted,
  onAccept,
  onNext,
  onBack,
}: {
  exchange: ExchangeId;
  accepted: boolean;
  onAccept: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const meta = EXCHANGE_META[exchange];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-sigflo-text">Before you connect</h2>
        <p className="mt-1 text-sm text-sigflo-muted">
          Read these carefully — they protect your account.
        </p>
      </div>

      <div className="space-y-3">
        <DisclosurePoint
          icon="🔒"
          title="Read-only access only"
          body={`Sigflo reads your ${meta.name} balance and positions. It cannot place orders, move funds, or access your withdrawal settings.`}
        />
        <DisclosurePoint
          icon="🚫"
          title="Never enable withdrawals"
          body="When creating your API key, withdrawal permissions must be off. Sigflo will warn you if it detects withdrawal access on any key you connect."
        />
        <DisclosurePoint
          icon="🔑"
          title="Use a dedicated key"
          body={`Create a new API key specifically for Sigflo. Do not reuse a key from another service. You can revoke it from ${meta.name} at any time.`}
        />
        <DisclosurePoint
          icon="📊"
          title="Trading risk"
          body="Sigflo provides signal analysis and market context. It does not guarantee profitable trades. All trading decisions are yours alone."
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
            accepted ? 'bg-sigflo-accent border-sigflo-accent' : 'border-white/20 group-hover:border-white/40'
          }`}
          onClick={() => onAccept(!accepted)}
        >
          {accepted && (
            <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-sm text-sigflo-muted leading-relaxed" onClick={() => onAccept(!accepted)}>
          I understand that Sigflo reads my account data and does not trade on my behalf. I accept the associated market risks.
        </span>
      </label>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!accepted}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sigflo-accent/90 transition-all"
        >
          I understand — continue
        </button>
      </div>
    </div>
  );
}

function CreateKeyStep({
  exchange,
  onNext,
  onBack,
}: {
  exchange: ExchangeId;
  onNext: () => void;
  onBack: () => void;
}) {
  const meta = EXCHANGE_META[exchange];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-sigflo-text">Create your API key</h2>
        <p className="mt-1 text-sm text-sigflo-muted">
          Follow these steps on {meta.name} before entering your credentials.
        </p>
      </div>

      <ol className="space-y-3">
        {[
          {
            n: '1',
            title: `Open ${meta.name} API management`,
            body: `Go to your ${meta.name} account → API Management → Create new key.`,
            link: { label: `Open ${meta.name} API settings`, url: meta.keyCreationUrl },
          },
          {
            n: '2',
            title: 'Name it "Sigflo"',
            body: 'Use a recognisable label so you can identify and revoke it later if needed.',
          },
          {
            n: '3',
            title: 'Set permissions — read only',
            body: 'Enable: Read account info, Read positions, Read wallet balance. Leave everything else off.',
          },
          {
            n: '4',
            title: 'Withdraw permissions — must be off',
            body: 'Never enable withdrawal permissions for any key you use with third-party apps.',
            highlight: true,
          },
          {
            n: '5',
            title: 'Copy your key and secret',
            body: "You'll see them once on creation. Keep them somewhere safe until the next step.",
          },
        ].map((item) => (
          <li
            key={item.n}
            className={`flex gap-3.5 p-3.5 rounded-xl border ${
              item.highlight ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/6 bg-sigflo-surface'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
                item.highlight ? 'bg-amber-500/20 text-amber-400' : 'bg-sigflo-accent/15 text-sigflo-accent'
              }`}
            >
              {item.n}
            </div>
            <div>
              <div className={`text-sm font-medium ${item.highlight ? 'text-amber-300' : 'text-sigflo-text'}`}>
                {item.title}
              </div>
              <div className="text-xs text-sigflo-muted mt-0.5 leading-relaxed">{item.body}</div>
              {item.link && (
                <a
                  href={item.link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 mt-1.5 text-xs text-sigflo-accent hover:text-sigflo-accent/80 transition-colors"
                >
                  {item.link.label}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <path d="M9 1h2v2m0-2L5 7M4 3H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors">
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black hover:bg-sigflo-accent/90 transition-all"
        >
          I've created my key
        </button>
      </div>
    </div>
  );
}

function EnterCredentialsStep({
  exchange,
  apiKey,
  apiSecret,
  label,
  error,
  onApiKeyChange,
  onApiSecretChange,
  onLabelChange,
  onConnect,
  onBack,
}: {
  exchange: ExchangeId;
  apiKey: string;
  apiSecret: string;
  label: string;
  error: string | null;
  onApiKeyChange: (v: string) => void;
  onApiSecretChange: (v: string) => void;
  onLabelChange: (v: string) => void;
  onConnect: () => void;
  onBack: () => void;
}) {
  const meta = EXCHANGE_META[exchange];
  const canConnect = apiKey.trim().length >= 8 && apiSecret.trim().length >= 8;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-sigflo-text">Enter your {meta.name} credentials</h2>
        <p className="mt-1 text-sm text-sigflo-muted">
          Your keys are encrypted before storage. Sigflo never logs them in plain text.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-sigflo-muted mb-1.5">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Paste your API key"
            className="w-full px-3.5 py-2.5 rounded-lg bg-sigflo-surface border border-white/8 text-sigflo-text text-sm placeholder:text-sigflo-muted/50 focus:outline-none focus:border-sigflo-accent/40 focus:ring-1 focus:ring-sigflo-accent/20 transition-all font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sigflo-muted mb-1.5">API Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => onApiSecretChange(e.target.value)}
            placeholder="Paste your API secret"
            className="w-full px-3.5 py-2.5 rounded-lg bg-sigflo-surface border border-white/8 text-sigflo-text text-sm placeholder:text-sigflo-muted/50 focus:outline-none focus:border-sigflo-accent/40 focus:ring-1 focus:ring-sigflo-accent/20 transition-all font-mono"
            autoComplete="new-password"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sigflo-muted mb-1.5">
            Label <span className="text-sigflo-muted/60">(optional)</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder={`e.g. My ${meta.name} account`}
            className="w-full px-3.5 py-2.5 rounded-lg bg-sigflo-surface border border-white/8 text-sigflo-text text-sm placeholder:text-sigflo-muted/50 focus:outline-none focus:border-sigflo-accent/40 focus:ring-1 focus:ring-sigflo-accent/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sigflo-accentDim border border-sigflo-accent/10">
        <svg className="w-4 h-4 text-sigflo-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 7h2v5H7V7zm0-3h2v2H7V4z" fill="currentColor" />
        </svg>
        <p className="text-xs text-sigflo-muted leading-relaxed">
          Credentials are encrypted with AES-256-GCM before leaving your browser session. They are stored in an isolated vault and never appear in logs.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-sigflo-lossDim border border-sigflo-loss/20">
          <svg className="w-4 h-4 text-sigflo-loss flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 7h2v4H7V7zm0 5h2v2H7v-2z" fill="currentColor" />
          </svg>
          <p className="text-xs text-sigflo-loss leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-2.5 rounded-lg text-sm text-sigflo-muted border border-white/6 hover:border-white/12 transition-colors">
          Back
        </button>
        <button
          onClick={onConnect}
          disabled={!canConnect}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sigflo-accent/90 transition-all"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

function ValidatingStep({ exchange }: { exchange: ExchangeId }) {
  const meta = EXCHANGE_META[exchange];
  return (
    <div className="flex flex-col items-center py-12 space-y-4">
      <div className="w-10 h-10 rounded-full border-2 border-sigflo-accent/20 border-t-sigflo-accent animate-spin" />
      <div className="text-center">
        <p className="text-sm font-medium text-sigflo-text">Verifying with {meta.name}</p>
        <p className="text-xs text-sigflo-muted mt-1">Checking permissions and account access</p>
      </div>
    </div>
  );
}

function SuccessStep({ exchange, onDone }: { exchange: ExchangeId; onDone?: () => void }) {
  const meta = EXCHANGE_META[exchange];
  return (
    <div className="flex flex-col items-center py-8 space-y-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-sigflo-accent/15 flex items-center justify-center">
        <svg className="w-7 h-7 text-sigflo-accent" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-sigflo-text">{meta.name} connected</h2>
        <p className="mt-2 text-sm text-sigflo-muted max-w-xs mx-auto leading-relaxed">
          Sigflo can now read your positions and balance. It will never place trades or move funds.
        </p>
      </div>
      <div className="w-full space-y-2.5 text-left">
        <PostConnectTip icon="🔍" text="Run a permission check from Security settings to confirm your key has no withdrawal access." />
        <PostConnectTip icon="🔄" text="You can rotate your API key at any time from Security → Key rotation." />
        <PostConnectTip icon="📋" text="All connection activity is recorded in your security audit log." />
      </div>
      <button
        onClick={onDone}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-sigflo-accent text-black hover:bg-sigflo-accent/90 transition-all"
      >
        Start trading
      </button>
    </div>
  );
}

function DisclosurePoint({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-xl border border-white/6 bg-sigflo-surface">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <div className="text-sm font-medium text-sigflo-text">{title}</div>
        <div className="text-xs text-sigflo-muted mt-0.5 leading-relaxed">{body}</div>
      </div>
    </div>
  );
}

function PostConnectTip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-white/6 bg-sigflo-surface">
      <span className="text-sm flex-shrink-0">{icon}</span>
      <p className="text-xs text-sigflo-muted leading-relaxed">{text}</p>
    </div>
  );
}
