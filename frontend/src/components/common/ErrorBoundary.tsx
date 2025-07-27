import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { Icon } from './Icon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isDark?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // errorReportingService.captureException(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          padding: '20px',
        }}>
          <GlassCard isDark={this.props.isDark} style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ padding: '32px' }}>
              <Icon
                name="status-error"
                size="xl"
                color="#EF4444"
                style={{ marginBottom: '16px' }}
              />
              
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: this.props.isDark ? '#ffffff' : '#333333',
              }}>
                Something went wrong
              </h2>
              
              <p style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: this.props.isDark ? '#cccccc' : '#666666',
                lineHeight: '1.5',
              }}>
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{
                  marginBottom: '24px',
                  textAlign: 'left',
                  backgroundColor: this.props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}>
                  <summary style={{ 
                    cursor: 'pointer',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: this.props.isDark ? '#ffffff' : '#333333',
                  }}>
                    Error Details (Development)
                  </summary>
                  <pre style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    color: this.props.isDark ? '#cccccc' : '#666666',
                  }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <GlassButton
                  onClick={this.handleRetry}
                  variant="primary"
                  isDark={this.props.isDark}
                >
                  <Icon name="action-refresh" size="sm" />
                  Try Again
                </GlassButton>
                
                <GlassButton
                  onClick={() => window.location.reload()}
                  variant="outline"
                  isDark={this.props.isDark}
                >
                  <Icon name="action-refresh" size="sm" />
                  Reload Page
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    console.error('Error captured:', error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}