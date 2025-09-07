import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createError,
  createValidationError,
  createAuthError,
  createAuthzError,
  createNotFoundError,
  createConflictError,
  createInternalError,
  createNetworkError,
  createTimeoutError,
  handleError,
  safeAsync,
  safeSync,
  validateRequired,
  validateEmail,
  validateUUID,
} from '@/lib/errors/error-handler';
import { AppError, ErrorCode } from '@/types/errors';

// Mock the logger to avoid console output during tests
vi.mock('@/lib/errors/error-logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Error Handler Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createError', () => {
    it('should create a basic error with code and message', () => {
      const error = createError('VALIDATION_ERROR', 'Test error message');
      
      expect(error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Test error message',
        details: undefined,
      });
    });

    it('should create an error with details', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = createError('VALIDATION_ERROR', 'Test error', details);
      
      expect(error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Test error',
        details,
      });
    });

    it('should use default message when none provided', () => {
      const error = createError('VALIDATION_ERROR');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Dados inválidos'); // From ERROR_MESSAGES
    });
  });

  describe('createValidationError', () => {
    it('should create a validation error with field information', () => {
      const error = createValidationError('email', 'Invalid email format');
      
      expect(error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        details: {
          field: 'email',
        },
      });
    });

    it('should include additional details', () => {
      const details = { minLength: 5, maxLength: 50 };
      const error = createValidationError('password', 'Password too short', details);
      
      expect(error.details).toEqual({
        field: 'password',
        minLength: 5,
        maxLength: 50,
      });
    });
  });

  describe('createAuthError', () => {
    it('should create an authentication error', () => {
      const error = createAuthError('Invalid credentials');
      
      expect(error).toEqual({
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid credentials',
        details: undefined,
      });
    });
  });

  describe('createAuthzError', () => {
    it('should create an authorization error', () => {
      const error = createAuthzError('Access denied');
      
      expect(error).toEqual({
        code: 'AUTHORIZATION_ERROR',
        message: 'Access denied',
        details: undefined,
      });
    });
  });

  describe('createNotFoundError', () => {
    it('should create a not found error with resource information', () => {
      const error = createNotFoundError('user', '123');
      
      expect(error).toEqual({
        code: 'NOT_FOUND',
        message: 'Recurso não encontrado',
        details: {
          resource: 'user',
          id: '123',
        },
      });
    });
  });

  describe('handleError', () => {
    it('should handle Error instances', () => {
      const originalError = new Error('Original error message');
      const appError = handleError(originalError, 'test context');
      
      expect(appError.code).toBe('INTERNAL_ERROR');
      expect(appError.message).toBe('Original error message');
      expect(appError.details).toMatchObject({
        originalError: 'Error',
        context: 'test context',
      });
    });

    it('should handle AppError instances', () => {
      const appError = createValidationError('email', 'Invalid email');
      const handledError = handleError(appError, 'test context');
      
      expect(handledError).toEqual(appError);
    });

    it('should handle unknown error types', () => {
      const unknownError = 'String error';
      const appError = handleError(unknownError, 'test context');
      
      expect(appError.code).toBe('INTERNAL_ERROR');
      expect(appError.message).toBe('Erro desconhecido');
      expect(appError.details).toMatchObject({
        originalError: 'String error',
        context: 'test context',
      });
    });

    it('should include additional details', () => {
      const error = new Error('Test error');
      const additionalDetails = { userId: '123', action: 'update' };
      const appError = handleError(error, 'test context', additionalDetails);
      
      expect(appError.details).toMatchObject({
        originalError: 'Error',
        context: 'test context',
        userId: '123',
        action: 'update',
      });
    });
  });

  describe('safeAsync', () => {
    it('should return success result for successful async operations', async () => {
      const result = await safeAsync(async () => {
        return 'success';
      }, 'test context');
      
      expect(result).toEqual({
        success: true,
        data: 'success',
      });
    });

    it('should return error result for failed async operations', async () => {
      const result = await safeAsync(async () => {
        throw new Error('Async error');
      }, 'test context');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('safeSync', () => {
    it('should return success result for successful sync operations', () => {
      const result = safeSync(() => {
        return 'success';
      }, 'test context');
      
      expect(result).toEqual({
        success: true,
        data: 'success',
      });
    });

    it('should return error result for failed sync operations', () => {
      const result = safeSync(() => {
        throw new Error('Sync error');
      }, 'test context');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('validateRequired', () => {
    it('should pass validation when all required fields are present', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const result = validateRequired(data, ['name', 'email']);
      
      expect(result).toEqual({
        success: true,
        data: true,
      });
    });

    it('should fail validation when required fields are missing', () => {
      const data = { name: 'John' };
      const result = validateRequired(data, ['name', 'email']);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.details?.missingFields).toEqual(['email']);
    });

    it('should fail validation for empty strings', () => {
      const data = { name: 'John', email: '' };
      const result = validateRequired(data, ['name', 'email']);
      
      expect(result.success).toBe(false);
      expect(result.error?.details?.missingFields).toEqual(['email']);
    });

    it('should fail validation for null values', () => {
      const data = { name: 'John', email: null };
      const result = validateRequired(data, ['name', 'email']);
      
      expect(result.success).toBe(false);
      expect(result.error?.details?.missingFields).toEqual(['email']);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];
      
      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result).toEqual({
          success: true,
          data: true,
        });
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
      ];
      
      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
        expect(result.error?.details?.field).toBe('email');
      });
    });
  });

  describe('validateUUID', () => {
    it('should validate correct UUID formats', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];
      
      validUUIDs.forEach(uuid => {
        const result = validateUUID(uuid);
        expect(result).toEqual({
          success: true,
          data: true,
        });
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716-44665544000', // too short
        '550e8400-e29b-41d4-a716-4466554400000', // too long
        '550e8400-e29b-41d4-a716-44665544000g', // invalid character
      ];
      
      invalidUUIDs.forEach(uuid => {
        const result = validateUUID(uuid);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
        expect(result.error?.details?.field).toBe('id');
      });
    });
  });
});
