// Central Error Handling Utilities
// Provides consistent error handling across the application

import { AppError, ErrorCode, Result } from '@/types/errors';
import { getErrorMessage } from './error-messages';
import { logger } from './error-logger';

// Create standardized error objects
export function createError(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>
): AppError {
  const errorMessage = message || getErrorMessage(code);
  
  return {
    code,
    message: errorMessage,
    details,
  };
}

// Create validation error
export function createValidationError(
  field: string,
  message?: string,
  details?: Record<string, unknown>
): AppError {
  return createError('VALIDATION_ERROR', message, {
    field,
    ...details,
  });
}

// Create authentication error
export function createAuthError(message?: string): AppError {
  return createError('AUTHENTICATION_ERROR', message);
}

// Create authorization error
export function createAuthzError(message?: string): AppError {
  return createError('AUTHORIZATION_ERROR', message);
}

// Create not found error
export function createNotFoundError(resource: string, id?: string): AppError {
  return createError('NOT_FOUND', undefined, {
    resource,
    id,
  });
}

// Create conflict error
export function createConflictError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('CONFLICT', message, details);
}

// Create internal server error
export function createInternalError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('INTERNAL_ERROR', message, details);
}

// Create network error
export function createNetworkError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('NETWORK_ERROR', message, details);
}

// Create timeout error
export function createTimeoutError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('TIMEOUT_ERROR', message, details);
}

// Handle and log errors consistently
export function handleError(
  error: unknown,
  context?: string,
  additionalDetails?: Record<string, unknown>
): AppError {
  let appError: AppError;

  if (error instanceof Error) {
    // Log the original error
    logger.error(`Error in ${context || 'unknown context'}`, error, additionalDetails);
    
    // Convert to AppError
    appError = createInternalError(error.message, {
      originalError: error.name,
      stack: error.stack,
      context: context || 'unknown context',
      ...additionalDetails,
    });
  } else if (typeof error === 'object' && error !== null && 'code' in error) {
    // Already an AppError
    appError = error as AppError;
    logger.error(`AppError in ${context || 'unknown context'}`, undefined, {
      code: appError.code,
      message: appError.message,
      details: appError.details,
      ...additionalDetails,
    });
  } else {
    // Unknown error type
    logger.error(`Unknown error type in ${context || 'unknown context'}`, undefined, {
      error,
      ...additionalDetails,
    });
    
    appError = createInternalError('Erro desconhecido', {
      originalError: String(error),
      context: context || 'unknown context',
      ...additionalDetails,
    });
  }

  return appError;
}

// Safe async function wrapper
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<Result<T, AppError>> {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error) {
    const appError = handleError(error, context);
    return { success: false, error: appError };
  }
}

// Safe sync function wrapper
export function safeSync<T>(
  fn: () => T,
  context?: string
): Result<T, AppError> {
  try {
    const result = fn();
    return { success: true, data: result };
  } catch (error) {
    const appError = handleError(error, context);
    return { success: false, error: appError };
  }
}

// Validate required fields
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): Result<true, AppError> {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      success: false,
      error: createValidationError(
        missingFields.join(', '),
        `Campos obrigatórios em falta: ${missingFields.join(', ')}`,
        { missingFields }
      ),
    };
  }

  return { success: true, data: true };
}

// Validate email format
export function validateEmail(email: string): Result<true, AppError> {
  // Basic email validation - check for consecutive dots and basic structure
  if (email.includes('..') || !email.includes('@') || !email.includes('.')) {
    return {
      success: false,
      error: createValidationError('email', 'Formato de email inválido'),
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: createValidationError('email', 'Formato de email inválido'),
    };
  }

  return { success: true, data: true };
}

// Validate UUID format
export function validateUUID(uuid: string): Result<true, AppError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return {
      success: false,
      error: createValidationError('id', 'Formato de ID inválido'),
    };
  }

  return { success: true, data: true };
}
