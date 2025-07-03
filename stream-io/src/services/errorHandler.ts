import { toast } from 'react-hot-toast';

// Error types for categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  ASYNC_OPERATION = 'ASYNC_OPERATION',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Standardized error interface
export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
  stack?: string;
}

interface ErrorContext {
  operation?: string;
  component?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
}

interface NetworkError {
  status?: number;
  statusText?: string;
  response?: {
    data?: Record<string, unknown>;
  };
}

class ErrorHandlerService {
  private errorCount = 0;
  private maxErrorsPerSession = 50;
  // Track active error toasts to prevent duplicates
  private activeErrorToasts = new Map<string, { toastId: string; timestamp: number }>();
  private readonly TOAST_DEDUPLICATION_WINDOW = 30000; // 30 seconds

  constructor() {
    this.setupGlobalErrorHandlers();
    this.startCleanupTimer();
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.handleError(error, {
        type: ErrorType.ASYNC_OPERATION,
        severity: ErrorSeverity.HIGH,
        context: { source: 'unhandledrejection' }
      });
      event.preventDefault();
    });

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      this.handleError(error, {
        type: ErrorType.CLIENT_ERROR,
        severity: ErrorSeverity.HIGH,
        context: { 
          source: 'uncaught_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  private startCleanupTimer() {
    // Clean up expired toast entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.activeErrorToasts.entries()) {
        if (now - value.timestamp > this.TOAST_DEDUPLICATION_WINDOW) {
          this.activeErrorToasts.delete(key);
        }
      }
    }, 60000);
  }

  // Create a unique key for error deduplication based on message and type
  private createErrorKey(message: string, type: ErrorType, context?: Record<string, any>): string {
    const contextKey = context?.operation || '';
    return `${type}:${message}:${contextKey}`;
  }

  // Main error handling method
  public handleError(
    error: Error | string,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      showToast?: boolean;
      logToConsole?: boolean;
    } = {}
  ): string {
    if (this.errorCount >= this.maxErrorsPerSession) {
      console.warn('Max errors per session reached');
      return '';
    }

    const errorId = this.generateErrorId();
    const normalizedError = typeof error === 'string' ? new Error(error) : error;
    
    const appError: AppError = {
      id: errorId,
      type: options.type || this.categorizeError(normalizedError),
      severity: options.severity || this.determineSeverity(normalizedError),
      message: normalizedError.message,
      originalError: normalizedError,
      context: options.context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: normalizedError.stack,
    };

    this.errorCount++;

    if (options.logToConsole !== false) {
      this.logError(appError);
    }

    if (options.showToast !== false) {
      this.showToastNotification(appError);
    }

    return errorId;
  }

  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('server') || message.includes('5')) {
      return ErrorType.SERVER_ERROR;
    }
    
    return ErrorType.UNKNOWN;
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('server') || message.includes('network')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('validation') || message.includes('auth')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private logError(appError: AppError) {
    const typeIcon = this.getTypeIcon(appError.type);
    
    console.group(`${typeIcon} ${appError.type} Error [${appError.severity}]`);
    console.error('Message:', appError.message);
    console.error('Error ID:', appError.id);
    console.error('Timestamp:', appError.timestamp);
    
    if (appError.context) {
      console.error('Context:', appError.context);
    }
    
    if (appError.stack) {
      console.error('Stack:', appError.stack);
    }
    
    console.groupEnd();
  }

  private showToastNotification(appError: AppError) {
    const userMessage = this.getUserFriendlyMessage(appError);
    const errorKey = this.createErrorKey(userMessage, appError.type, appError.context);
    
    // Check if we already have an active toast for this error
    const existingToast = this.activeErrorToasts.get(errorKey);
    if (existingToast) {
      // If there's already an active toast for this error, don't show another one
      console.log(`Suppressing duplicate error toast: ${userMessage}`);
      return;
    }

    let toastId: string;
    const now = Date.now();
    
    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
        toastId = toast.error(userMessage, { 
          duration: 8000, 
          id: `critical-${errorKey}`
        });
        // Set up cleanup timer
        setTimeout(() => this.activeErrorToasts.delete(errorKey), 9000);
        break;
      case ErrorSeverity.HIGH:
        toastId = toast.error(userMessage, { 
          duration: 6000, 
          id: `high-${errorKey}`
        });
        // Set up cleanup timer
        setTimeout(() => this.activeErrorToasts.delete(errorKey), 7000);
        break;
      case ErrorSeverity.MEDIUM:
        toastId = toast.error(userMessage, { 
          duration: 4000, 
          id: `medium-${errorKey}`
        });
        // Set up cleanup timer
        setTimeout(() => this.activeErrorToasts.delete(errorKey), 5000);
        break;
      case ErrorSeverity.LOW:
        if (import.meta.env.DEV) {
          toastId = toast(userMessage, { 
            duration: 3000, 
            id: `low-${errorKey}`
          });
          // Set up cleanup timer
          setTimeout(() => this.activeErrorToasts.delete(errorKey), 4000);
        } else {
          return; // Don't show low severity errors in production
        }
        break;
      default:
        return;
    }

    // Track the toast
    this.activeErrorToasts.set(errorKey, { toastId, timestamp: now });
  }

  private getUserFriendlyMessage(appError: AppError): string {
    switch (appError.type) {
      case ErrorType.NETWORK:
        return 'Network connection problem. Please check your internet connection.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please sign in again.';
      case ErrorType.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      case ErrorType.NOT_FOUND:
        return 'The requested content was not found.';
      case ErrorType.SERVER_ERROR:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTypeIcon(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK: return '🌐';
      case ErrorType.AUTHENTICATION: return '🔒';
      case ErrorType.VALIDATION: return '📝';
      case ErrorType.NOT_FOUND: return '🔍';
      case ErrorType.SERVER_ERROR: return '🖥️';
      case ErrorType.ASYNC_OPERATION: return '⚡';
      default: return '❓';
    }
  }

  // Convenience methods
  public handleNetworkError(error: NetworkError, context?: ErrorContext): string {
    return this.handleError(error, {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      context,
    });
  }

  public handleAuthError(error: Error, context?: Record<string, any>): string {
    return this.handleError(error, {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      context,
    });
  }

  public handleAsyncError(error: Error, context?: Record<string, any>): string {
    return this.handleError(error, {
      type: ErrorType.ASYNC_OPERATION,
      severity: ErrorSeverity.MEDIUM,
      context,
    });
  }

  // Method to handle silent errors (logged but no toast)
  public handleSilentError(error: Error, context?: Record<string, any>): string {
    return this.handleError(error, {
      type: ErrorType.ASYNC_OPERATION,
      severity: ErrorSeverity.LOW,
      context,
      showToast: false,
    });
  }

  // Safe async wrapper
  public async safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: Record<string, any>
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleAsyncError(error as Error, context);
      return fallback;
    }
  }

  // Manually clear error toasts (useful for retry operations)
  public clearErrorToasts(): void {
    this.activeErrorToasts.clear();
    toast.dismiss();
  }
}

// Export singleton instance and utility functions
const errorHandler = new ErrorHandlerService();

export const handleError = errorHandler.handleError.bind(errorHandler);
export const handleNetworkError = errorHandler.handleNetworkError.bind(errorHandler);
export const handleAuthError = errorHandler.handleAuthError.bind(errorHandler);
export const handleAsyncError = errorHandler.handleAsyncError.bind(errorHandler);
export const handleSilentError = errorHandler.handleSilentError.bind(errorHandler);
export const safeAsync = errorHandler.safeAsync.bind(errorHandler);
export const clearErrorToasts = errorHandler.clearErrorToasts.bind(errorHandler);

export default errorHandler; 