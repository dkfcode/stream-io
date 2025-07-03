import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, only affects this component, not the entire app
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error) {
    // Log the error to the console for debugging
    console.error('Error caught by ErrorBoundary:', error);
    
    // In a real app, you might want to send this to an error reporting service
    // e.g., Sentry, Rollbar, etc.
    
    // For now, just log it
    this.logError(error);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, report to error tracking service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    // For now, log to console. Replace with actual error reporting service
    console.error('Error Report:', errorReport);
    
    // Example: Send to error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private logError = (error: Error) => {
    // Implementation of logError method
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        const FallbackComponent = this.props.fallbackComponent;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            resetError={this.handleReset} 
          />
        );
      }

      // Default error UI
      const isIsolated = this.props.isolate;
      const containerClass = isIsolated 
        ? "bg-red-50 border border-red-200 rounded-lg p-6 m-4"
        : "min-h-screen bg-gradient-to-br from-red-900/20 to-black flex items-center justify-center p-4";

      return (
        <div className={containerClass}>
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                {isIsolated ? 'Component Error' : 'Something went wrong'}
              </h2>
              <p className="text-gray-300 mb-4">
                {isIsolated 
                  ? 'This section encountered an error but the rest of the app should work normally.'
                  : 'We apologize for the inconvenience. The application encountered an unexpected error.'
                }
              </p>
              
              {/* Error details (only in development) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="bg-gray-800 rounded p-4 mb-6 text-left">
                  <summary className="cursor-pointer text-red-400 font-medium mb-2">
                    <Bug className="inline w-4 h-4 mr-2" />
                    Error Details (Development)
                  </summary>
                  <div className="text-xs text-gray-300 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1 bg-gray-900 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1 bg-gray-900 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              
              {!isIsolated && (
                <>
                  <button
                    onClick={this.handleRefresh}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Page</span>
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go Home</span>
                  </button>
                </>
              )}
            </div>

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="mt-6 text-xs text-gray-400">
                Error ID: {this.state.errorId}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Specialized Error Boundary for async operations
export const AsyncErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary isolate={true}>
    {children}
  </ErrorBoundary>
);

// High-level Error Boundary for entire app sections
export const AppSectionErrorBoundary: React.FC<{ 
  children: ReactNode; 
  sectionName?: string;
}> = ({ children, sectionName }) => (
  <ErrorBoundary 
    onError={(error, errorInfo) => {
      console.error(`Error in ${sectionName || 'app section'}:`, error);
    }}
  >
    {children}
  </ErrorBoundary>
); 