// Central Error Handling Utilities
// Provides consistent error handling across the application

import { AppError, ErrorCode, Result } from '@/types/errors';
import { getErrorMessage } from './error-messages';
import { logger } from './error-logger';

/**
 * Creates a standardized error object with consistent structure
 * @param code - The error code from the ErrorCode enum
 * @param message - Optional custom error message, defaults to standard message for code
 * @param details - Optional additional error details
 * @returns AppError object with standardized structure
 */
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

/**
 * Creates a validation error for a specific field
 * @param field - The field that failed validation
 * @param message - Optional custom error message
 * @param details - Optional additional validation details
 * @returns AppError object with VALIDATION_ERROR code
 */
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

/**
 * Creates an authentication error
 * @param message - Optional custom error message
 * @returns AppError object with AUTHENTICATION_ERROR code
 */
export function createAuthError(message?: string): AppError {
  return createError('AUTHENTICATION_ERROR', message);
}

/**
 * Creates an authorization error
 * @param message - Optional custom error message
 * @returns AppError object with AUTHORIZATION_ERROR code
 */
export function createAuthzError(message?: string): AppError {
  return createError('AUTHORIZATION_ERROR', message);
}

/**
 * Creates a not found error for a specific resource
 * @param resource - The type of resource that was not found
 * @param id - Optional ID of the resource that was not found
 * @returns AppError object with NOT_FOUND code
 */
export function createNotFoundError(resource: string, id?: string): AppError {
  return createError('NOT_FOUND', undefined, {
    resource,
    id,
  });
}

/**
 * Creates a conflict error for resource conflicts
 * @param message - Optional custom error message
 * @param details - Optional additional conflict details
 * @returns AppError object with CONFLICT code
 */
export function createConflictError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('CONFLICT', message, details);
}

/**
 * Creates an internal server error
 * @param message - Optional custom error message
 * @param details - Optional additional error details
 * @returns AppError object with INTERNAL_ERROR code
 */
export function createInternalError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('INTERNAL_ERROR', message, details);
}

/**
 * Creates a network error
 * @param message - Optional custom error message
 * @param details - Optional additional error details
 * @returns AppError object with NETWORK_ERROR code
 */
export function createNetworkError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('NETWORK_ERROR', message, details);
}

/**
 * Creates a timeout error
 * @param message - Optional custom error message
 * @param details - Optional additional error details
 * @returns AppError object with TIMEOUT_ERROR code
 */
export function createTimeoutError(message?: string, details?: Record<string, unknown>): AppError {
  return createError('TIMEOUT_ERROR', message, details);
}

/**
 * Handles and logs errors consistently with context information
 * @param error - The error to handle (can be any type)
 * @param context - Optional context string for debugging
 * @param additionalDetails - Optional additional error details
 * @returns AppError object with standardized structure
 */
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

/**
 * Safely executes an async function and returns a Result type
 * @param fn - The async function to execute
 * @param context - Optional context string for error handling
 * @returns Promise<Result<T, AppError>> - Success with data or failure with error
 */
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

/**
 * Safely executes a synchronous function and returns a Result type
 * @param fn - The synchronous function to execute
 * @param context - Optional context string for error handling
 * @returns Result<T, AppError> - Success with data or failure with error
 */
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

/**
 * Validates email format using a comprehensive regex pattern
 * @param email - The email string to validate
 * @returns Result<true, AppError> - Success if valid, error if invalid
 */
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
