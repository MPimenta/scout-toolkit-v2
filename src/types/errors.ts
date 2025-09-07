// Error Handling Types
// These types define consistent error handling across the application

/**
 * Base error structure for all application errors
 */
export interface BaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * API error response structure
 */
export interface ApiError {
  error: BaseError;
}

/**
 * Application error codes for consistent error handling
 */
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

/**
 * Validation error with specific field information
 */
export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    value: unknown;
    constraint: string;
  };
}

/**
 * Authentication error for invalid or expired sessions
 */
export interface AuthenticationError extends BaseError {
  code: 'AUTHENTICATION_ERROR';
  message: 'Sessão expirada ou inválida';
}

/**
 * Authorization error for insufficient permissions
 */
export interface AuthorizationError extends BaseError {
  code: 'AUTHORIZATION_ERROR';
  message: 'Acesso negado';
}

/**
 * Not found error for missing resources
 */
export interface NotFoundError extends BaseError {
  code: 'NOT_FOUND';
  message: 'Recurso não encontrado';
}

/**
 * Conflict error for data conflicts
 */
export interface ConflictError extends BaseError {
  code: 'CONFLICT';
  message: 'Conflito de dados';
}

/**
 * Internal server error for unexpected failures
 */
export interface InternalError extends BaseError {
  code: 'INTERNAL_ERROR';
  message: 'Erro interno do servidor';
}

/**
 * Network error for connection issues
 */
export interface NetworkError extends BaseError {
  code: 'NETWORK_ERROR';
  message: 'Erro de conexão';
}

/**
 * Timeout error for operations that exceed time limits
 */
export interface TimeoutError extends BaseError {
  code: 'TIMEOUT_ERROR';
  message: 'Tempo limite excedido';
}

/**
 * Generic application error type for flexible error handling
 */
export interface AppError extends BaseError {
  code: ErrorCode;
}

/**
 * Union type for all specific application errors
 */
export type SpecificAppError = 
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | InternalError
  | NetworkError
  | TimeoutError;

/**
 * Error result type for functions that can fail
 * @template T - The success data type
 * @template E - The error type (defaults to AppError)
 */
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Error boundary props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Error context type
export interface ErrorContextType {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  clearError: () => void;
}

// Error logging type
export interface ErrorLog {
  id: string;
  timestamp: string;
  error: AppError;
  context?: {
    userId?: string;
    path?: string;
    userAgent?: string;
    stack?: string;
  };
}
