'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Halloween-themed Error Boundary
 * Catches React errors and displays spooky error UI
 */
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
    console.error('🦇 Error Boundary Caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default Halloween-themed error UI
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#1a0f2e] via-[#0a0a0f] to-[#1a0f2e] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-2 border-[#DC2626] bg-[#2e1065]/30 shadow-[0_0_40px_rgba(220,38,38,0.5)]">
            <CardHeader className="text-center">
              <div className="text-8xl mb-4 animate-pulse">🦇</div>
              <CardTitle className="text-4xl text-[#DC2626] mb-2">
                Dark Magic Failed
              </CardTitle>
              <CardDescription className="text-xl text-[#a78bfa]">
                A curse has befallen the resurrection ritual
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="bg-[#1a0f2e] border-2 border-[#DC2626] rounded-lg p-4">
                <h3 className="text-[#FF6B35] font-semibold mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Error Details:</span>
                </h3>
                <p className="text-[#F7F7FF] font-mono text-sm break-words">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={this.handleReset}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#F7F7FF] shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  <span className="mr-2">🔮</span>
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-2 border-[#5b21b6] text-[#a78bfa] hover:bg-[#2e1065]/50"
                >
                  <span className="mr-2">🔄</span>
                  Reload Page
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-[#a78bfa] text-sm pt-4 border-t border-[#5b21b6]">
                <p>If this curse persists, consult the grimoire (documentation)</p>
                <p className="mt-1">or summon the maintainers via GitHub Issues</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
