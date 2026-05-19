import { Link } from 'react-router-dom';

/**
 * Slim persistent disclaimer bar rendered above the bottom tab nav on every
 * main screen. Visible but unobtrusive — matches the muted slate tone of the
 * shell rather than looking like a legal warning banner.
 */
export function DisclaimerFooter() {
  return (
    <div className="border-t border-white/[0.04] bg-sigflo-bg/80 px-4 py-2 text-center">
      <p className="text-[10px] leading-tight text-sigflo-muted/60">
        Market analysis only · Not financial advice · Trading carries real risk
        {' · '}
        <Link
          to="/legal"
          className="underline decoration-sigflo-muted/30 underline-offset-2 transition hover:text-sigflo-muted/90 hover:decoration-sigflo-muted/60"
        >
          Legal
        </Link>
      </p>
    </div>
  );
}
