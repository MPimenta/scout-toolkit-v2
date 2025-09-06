// API-specific Error Handling
// Provides consistent error handling for API routes

import { NextResponse } from 'next/server';
import { AppError, ErrorCode } from '@/types/errors';
import { apiLogger } from './error-logger';
import { handleError, createError } from './error-handler';

// Standard API error response format
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Map error codes to HTTP status codes
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  NETWORK_ERROR: 502,
  TIMEOUT_ERROR: 504,
};

// Create standardized API error response
export function createApiErrorResponse(
  error: AppError,
  statusCode?: number
): NextResponse<ApiErrorResponse> {
  const status = statusCode || ERROR_STATUS_MAP[error.code] || 500;
  
  const response: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };

  return NextResponse.json(response, { status });
}

// Handle API errors consistently
export function handleApiError(
  error: unknown,
  context: string,
  additionalDetails?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const appError = handleError(error, context, additionalDetails);
  
  // Log API error
  apiLogger.error('API', context, new Error(appError.message), {
    code: appError.code,
    details: appError.details,
    ...additionalDetails,
  });

  return createApiErrorResponse(appError);
}

// Common API error responses
export const apiErrors = {
  unauthorized: (message?: string) => 
    createApiErrorResponse(createError('AUTHENTICATION_ERROR', message)),
  
  forbidden: (message?: string) => 
    createApiErrorResponse(createError('AUTHORIZATION_ERROR', message)),
  
  notFound: (resource: string, id?: string) => 
    createApiErrorResponse(createError('NOT_FOUND', undefined, { resource, id })),
  
  validation: (field: string, message?: string) => 
    createApiErrorResponse(createError('VALIDATION_ERROR', message, { field })),
  
  conflict: (message?: string) => 
    createApiErrorResponse(createError('CONFLICT', message)),
  
  internal: (message?: string) => 
    createApiErrorResponse(createError('INTERNAL_ERROR', message)),
  
  network: (message?: string) => 
    createApiErrorResponse(createError('NETWORK_ERROR', message)),
  
  timeout: (message?: string) => 
    createApiErrorResponse(createError('TIMEOUT_ERROR', message)),
};

// API route wrapper for consistent error handling
export function withApiErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, 'API Route Handler');
    }
  };
}

// Validate request body
export function validateRequestBody<T>(
  body: unknown,
  requiredFields: string[]
): { isValid: true; data: T } | { isValid: false; response: NextResponse<ApiErrorResponse> } {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      response: apiErrors.validation('body', 'Corpo da requisição inválido'),
    };
  }

  const missingFields = requiredFields.filter(field => {
    const value = (body as Record<string, unknown>)[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      isValid: false,
      response: apiErrors.validation(
        missingFields.join(', '),
        `Campos obrigatórios em falta: ${missingFields.join(', ')}`
      ),
    };
  }

  return { isValid: true, data: body as T };
}

// Validate request parameters
export function validateRequestParams(
  params: Record<string, unknown>,
  requiredParams: string[]
): { isValid: true; data: Record<string, string> } | { isValid: false; response: NextResponse<ApiErrorResponse> } {
  const missingParams = requiredParams.filter(param => {
    const value = params[param];
    return value === undefined || value === null || value === '';
  });

  if (missingParams.length > 0) {
    return {
      isValid: false,
      response: apiErrors.validation(
        missingParams.join(', '),
        `Parâmetros obrigatórios em falta: ${missingParams.join(', ')}`
      ),
    };
  }

  return { isValid: true, data: params as Record<string, string> };
}

// Log API request/response
export function logApiRequest(method: string, url: string, context?: Record<string, unknown>): void {
  apiLogger.request(method, url, context);
}

export function logApiResponse(method: string, url: string, status: number, context?: Record<string, unknown>): void {
  apiLogger.response(method, url, status, context);
}
