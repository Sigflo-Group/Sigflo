import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Subtle grid texture overlay; off for chart cards so plot / dark panes stay clean. Default true. */
  panelTexture?: boolean;
};

export function Card({ className = '', children, panelTexture = true, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-sigflo-surface shadow-card ${
        panelTexture ? 'relative overflow-hidden' : ''
      } ${className}`}
      {...rest}
    >
      {panelTexture ? (
        <>
          <span className="sigflo-panel-grid-overlay" aria-hidden />
          {/* Real box (not display:contents) so z-index stacks above the grid overlay in all browsers */}
          <div className="relative z-[1] min-h-0 min-w-full">{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
