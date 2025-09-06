import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  createApiErrorResponse,
  handleApiError,
  apiErrors,
  validateRequestBody,
  validateRequestParams,
  logApiRequest,
  logApiResponse,
} from '@/lib/errors/api-error-handler';
import { createError } from '@/lib/errors/error-handler';

// Mock the logger to avoid console output during tests
vi.mock('@/lib/errors/error-logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  apiLogger: {
    request: vi.fn(),
    response: vi.fn(),
    error: vi.fn(),
  },
}));

describe('API Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createApiErrorResponse', () => {
    it('should create a standardized API error response', () => {
      const appError = createError('VALIDATION_ERROR', 'Test error', { field: 'email' });
      const response = createApiErrorResponse(appError);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
      
      // Note: We can't easily test the JSON content without parsing the response
      // The response structure is tested through integration tests
    });

    it('should use custom status code when provided', () => {
      const appError = createError('VALIDATION_ERROR', 'Test error');
      const response = createApiErrorResponse(appError, 422);
      
      expect(response.status).toBe(422);
    });

    it('should map error codes to correct HTTP status codes', () => {
      const testCases = [
        { code: 'VALIDATION_ERROR' as const, expectedStatus: 400 },
        { code: 'AUTHENTICATION_ERROR' as const, expectedStatus: 401 },
        { code: 'AUTHORIZATION_ERROR' as const, expectedStatus: 403 },
        { code: 'NOT_FOUND' as const, expectedStatus: 404 },
        { code: 'CONFLICT' as const, expectedStatus: 409 },
        { code: 'INTERNAL_ERROR' as const, expectedStatus: 500 },
        { code: 'NETWORK_ERROR' as const, expectedStatus: 502 },
        { code: 'TIMEOUT_ERROR' as const, expectedStatus: 504 },
      ];
      
      testCases.forEach(({ code, expectedStatus }) => {
        const appError = createError(code, 'Test error');
        const response = createApiErrorResponse(appError);
        expect(response.status).toBe(expectedStatus);
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle Error instances and return API response', () => {
      const error = new Error('Test error');
      const response = handleApiError(error, 'test context');
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });

    it('should handle AppError instances and return API response', () => {
      const appError = createError('VALIDATION_ERROR', 'Test error');
      const response = handleApiError(appError, 'test context');
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it('should include additional details in error handling', () => {
      const error = new Error('Test error');
      const additionalDetails = { userId: '123', action: 'update' };
      const response = handleApiError(error, 'test context', additionalDetails);
      
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });
  });

  describe('apiErrors', () => {
    it('should create unauthorized error response', () => {
      const response = apiErrors.unauthorized('Custom message');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(401);
    });

    it('should create forbidden error response', () => {
      const response = apiErrors.forbidden('Custom message');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(403);
    });

    it('should create not found error response', () => {
      const response = apiErrors.notFound('user', '123');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(404);
    });

    it('should create validation error response', () => {
      const response = apiErrors.validation('email', 'Invalid email format');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it('should create conflict error response', () => {
      const response = apiErrors.conflict('Resource already exists');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(409);
    });

    it('should create internal error response', () => {
      const response = apiErrors.internal('Internal server error');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });

    it('should create network error response', () => {
      const response = apiErrors.network('Network error');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(502);
    });

    it('should create timeout error response', () => {
      const response = apiErrors.timeout('Request timeout');
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(504);
    });
  });

  describe('validateRequestBody', () => {
    it('should validate request body with all required fields', () => {
      const body = { name: 'John', email: 'john@example.com' };
      const result = validateRequestBody(body, ['name', 'email']);
      
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data).toEqual(body);
      }
    });

    it('should reject invalid request body', () => {
      const body = 'invalid body';
      const result = validateRequestBody(body, ['name', 'email']);
      
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.response).toBeInstanceOf(NextResponse);
        expect(result.response.status).toBe(400);
      }
    });

    it('should reject request body with missing required fields', () => {
      const body = { name: 'John' };
      const result = validateRequestBody(body, ['name', 'email']);
      
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.response).toBeInstanceOf(NextResponse);
        expect(result.response.status).toBe(400);
      }
    });

    it('should reject request body with empty string fields', () => {
      const body = { name: 'John', email: '' };
      const result = validateRequestBody(body, ['name', 'email']);
      
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.response).toBeInstanceOf(NextResponse);
        expect(result.response.status).toBe(400);
      }
    });
  });

  describe('validateRequestParams', () => {
    it('should validate request params with all required parameters', () => {
      const params = { id: '123', type: 'user' };
      const result = validateRequestParams(params, ['id', 'type']);
      
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data).toEqual(params);
      }
    });

    it('should reject request params with missing required parameters', () => {
      const params = { id: '123' };
      const result = validateRequestParams(params, ['id', 'type']);
      
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.response).toBeInstanceOf(NextResponse);
        expect(result.response.status).toBe(400);
      }
    });

    it('should reject request params with empty string parameters', () => {
      const params = { id: '123', type: '' };
      const result = validateRequestParams(params, ['id', 'type']);
      
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.response).toBeInstanceOf(NextResponse);
        expect(result.response.status).toBe(400);
      }
    });
  });

  describe('logApiRequest', () => {
    it('should log API request without throwing errors', () => {
      expect(() => {
        logApiRequest('GET', '/api/test');
      }).not.toThrow();
    });

    it('should log API request with context', () => {
      expect(() => {
        logApiRequest('POST', '/api/test', { userId: '123' });
      }).not.toThrow();
    });
  });

  describe('logApiResponse', () => {
    it('should log API response without throwing errors', () => {
      expect(() => {
        logApiResponse('GET', '/api/test', 200);
      }).not.toThrow();
    });

    it('should log API response with context', () => {
      expect(() => {
        logApiResponse('POST', '/api/test', 201, { userId: '123' });
      }).not.toThrow();
    });
  });
});
