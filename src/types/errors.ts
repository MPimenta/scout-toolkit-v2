// Error Handling Types
// These types define consistent error handling across the application

// Base error structure
export interface BaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// API error response
export interface ApiError {
  error: BaseError;
}

// Application error types
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

// Specific error types
export interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    value: unknown;
    constraint: string;
  };
}

export interface AuthenticationError extends BaseError {
  code: 'AUTHENTICATION_ERROR';
  message: 'Sessão expirada ou inválida';
}

export interface AuthorizationError extends BaseError {
  code: 'AUTHORIZATION_ERROR';
  message: 'Acesso negado';
}

export interface NotFoundError extends BaseError {
  code: 'NOT_FOUND';
  message: 'Recurso não encontrado';
}

export interface ConflictError extends BaseError {
  code: 'CONFLICT';
  message: 'Conflito de dados';
}

export interface InternalError extends BaseError {
  code: 'INTERNAL_ERROR';
  message: 'Erro interno do servidor';
}

export interface NetworkError extends BaseError {
  code: 'NETWORK_ERROR';
  message: 'Erro de conexão';
}

export interface TimeoutError extends BaseError {
  code: 'TIMEOUT_ERROR';
  message: 'Tempo limite excedido';
}

// Generic application error type
export interface AppError extends BaseError {
  code: ErrorCode;
}

// Union type for all specific application errors
export type SpecificAppError = 
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | InternalError
  | NetworkError
  | TimeoutError;

// Error result type for functions that can fail
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
