import { Component, type ReactNode, type ErrorInfo } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  context?: string;
};

type State = {
  error: Error | null;
  errorId: string | null;
};

/**
 * Error boundary that prevents crashes from propagating to sensitive areas.
 * Renders a safe fallback rather than exposing stack traces to users.
 */
export class SecureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).slice(2, 9).toUpperCase();
    return { error, errorId };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { onError, context } = this.props;
    // Log to console in dev — never expose internals to users
    if (import.meta.env.DEV) {
      console.error(`[SecureErrorBoundary:${context ?? 'unknown'}]`, error, info);
    }
    onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ error: null, errorId: null });
  };

  render() {
    const { error, errorId } = this.state;
    const { fallback, children, context } = this.props;

    if (error) {
      if (fallback) return fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-white/6 bg-sigflo-surface text-center">
          <div className="w-10 h-10 rounded-xl bg-sigflo-elevated flex items-center justify-center">
            <svg className="w-5 h-5 text-sigflo-muted" fill="none" viewBox="0 0 20 20">
              <path d="M9 2a7 7 0 100 14A7 7 0 009 2zm0 5v4m0 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-sigflo-text">Something went wrong</p>
            <p className="text-xs text-sigflo-muted mt-1 leading-relaxed max-w-xs">
              {context
                ? `The ${context} panel ran into a problem.`
                : 'This section ran into a problem.'}{' '}
              Try refreshing or contact support if this keeps happening.
            </p>
            {errorId && (
              <p className="text-xs text-sigflo-muted/50 mt-2">
                Error ID: {errorId}
              </p>
            )}
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-sigflo-muted hover:text-sigflo-text hover:border-white/20 transition-all"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
