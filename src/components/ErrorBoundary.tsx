import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 inline-flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[#101B35] dark:text-white">Something went wrong</h1>
            <p className="text-sm text-[#68758A] dark:text-slate-400">{this.state.message}</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3867FF] text-white text-sm font-semibold hover:bg-[#2B54DB]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LoadingPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3867FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#68758A] dark:text-slate-400">Loading FixMate...</p>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="font-mono text-sm font-semibold text-[#3867FF] dark:text-[#22D3EE]">404</p>
        <h1 className="text-3xl font-extrabold text-[#101B35] dark:text-white tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-[#68758A] dark:text-slate-400">
          The repair service or page you requested could not be found or may have moved.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg bg-[#3867FF] text-white text-sm font-semibold hover:bg-[#2B54DB] transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/services"
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  );
}
