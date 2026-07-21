import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // Track error in analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }
  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }));
  };
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <div className="flex gap-3 justify-center">
              {this.state.retryCount < 3 && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-[#246BFF] text-white text-xs font-bold rounded-lg hover:bg-[#1A5AD6] transition-all"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-zinc-600 transition-all"
              >
                Reload Page
              </button>
            </div>
            {this.state.retryCount >= 3 && (
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-3">Multiple retries failed. Please reload the page.</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
