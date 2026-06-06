import { Component, type ErrorInfo, type ReactNode } from 'react';
import { feedBrowserPath } from '@/config/appRoutes';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Sigflo]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-sigflo-bg px-6 py-10 text-center text-sigflo-text">
          <p className="text-sm font-semibold text-white">Something went wrong</p>
          <p className="mt-4 max-w-lg text-left text-xs text-sigflo-muted">
            An unexpected error occurred. Please refresh and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign(feedBrowserPath())}
            className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-bold text-sigflo-bg"
          >
            Back to feed
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
