import React from 'react';

type State = { hasError: boolean; errorMessage: string };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[app-error-boundary]', error);
    const msg = error instanceof Error ? error.message : String(error);
    this.setState({ errorMessage: msg });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-center">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
            {this.state.errorMessage && (
              <pre className="mt-3 max-w-full overflow-auto whitespace-pre-wrap break-words text-left text-xs text-rose-300/80">
                {this.state.errorMessage}
              </pre>
            )}
            <p className="mt-2 text-sm text-zinc-400">Please refresh and try again.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
