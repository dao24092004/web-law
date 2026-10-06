'use client';


import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console -- intentional error reporting
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorState
          error={this.state.error}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }
    return this.props.children;
  }
}

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  onReload?: () => void;
  title?: string;
  description?: string;
  showHome?: boolean;
}

export function ErrorState({
  error,
  onRetry,
  onReload,
  title = 'Đã xảy ra lỗi',
  description = 'Hệ thống gặp sự cố khi render component này. Vui lòng thử lại.',
  showHome = true,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        background: 'white',
        border: '1px solid var(--danger, #DC2626)',
        borderRadius: 10,
        padding: 32,
        textAlign: 'center',
        maxWidth: 520,
        margin: '40px auto',
        color: 'var(--gray-700)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--danger-faint, #FEE2E2)',
          color: 'var(--danger, #DC2626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <h3
        style={{
          margin: '0 0 8px',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--gray-800)',
        }}
      >
        {title}
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
        {description}
      </p>
      {error?.message && (
        <pre
          style={{
            margin: '0 0 16px',
            padding: 10,
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: 6,
            fontSize: '0.72rem',
            fontFamily: 'monospace',
            color: 'var(--gray-700)',
            textAlign: 'left',
            overflow: 'auto',
            maxHeight: 120,
          }}
        >
          {error.message}
        </pre>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onRetry}
          className="action-btn action-btn--primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={12} /> Thử lại
        </button>
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            className="action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={12} /> Reload trang
          </button>
        )}
        {showHome && (
          <Link
            href="/admin/dashboard"
            className="action-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            <Home size={12} /> Về Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}