import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanGoBack } from '@/hooks/useCanGoBack';

type LegalDoc = 'risk' | 'terms' | 'privacy';

const DOCS: { id: LegalDoc; label: string; src: string }[] = [
  { id: 'risk', label: 'Risk disclosure', src: '/disclosure/index.html' },
  { id: 'terms', label: 'Terms of service', src: '/terms/index.html' },
  { id: 'privacy', label: 'Privacy policy', src: '/privacy/index.html' },
];

function docFromPath(path: string): LegalDoc {
  if (path.startsWith('/disclosure')) return 'risk';
  if (path.startsWith('/terms')) return 'terms';
  if (path.startsWith('/privacy')) return 'privacy';
  return 'risk';
}

export default function LegalScreen() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const canGoBack = useCanGoBack();
  const [searchParams] = useSearchParams();
  const docParam = searchParams.get('doc') as LegalDoc | null;
  const initialDoc = useMemo(() => docFromPath(pathname), [pathname]);
  const [active, setActive] = useState<LegalDoc>(
    docParam && DOCS.some((d) => d.id === docParam) ? docParam : initialDoc,
  );

  const doc = DOCS.find((d) => d.id === active)!;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0F1115]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <button
          type="button"
          onClick={() => (canGoBack ? navigate(-1) : navigate('/profile'))}
          className="text-xs font-semibold uppercase tracking-wider text-[#7ee8d3] transition hover:text-[#b8fff0]"
        >
          ← Back
        </button>
        <span className="truncate text-xs font-medium text-[rgba(245,247,250,0.45)]">{doc?.label ?? 'Legal'}</span>
        <div className="w-12" />
      </div>

      {/* Intro blurb */}
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[11px] leading-relaxed text-[rgba(245,247,250,0.45)]">
          Sigflo is a market analysis tool. Nothing here is financial advice — you are always
          responsible for your own trading decisions.
        </p>
      </div>

      {/* Doc tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] px-4 py-2.5">
        {DOCS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setActive(d.id)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
              active === d.id
                ? 'bg-[#152028] text-[#7ee8d3]'
                : 'text-[rgba(245,247,250,0.45)] hover:text-[rgba(245,247,250,0.7)]'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Document iframe */}
      <iframe
        key={doc.src}
        title={doc.label}
        className="min-h-0 w-full flex-1 border-0 bg-[#050505]"
        src={doc.src}
      />
    </div>
  );
}
