import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel } from '@/lib/errors/error-logger';

// Mock console methods
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Store original console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

describe('Error Logger', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset environment variables
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    
    vi.unstubAllEnvs();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('should log debug messages in development', async () => {
      // Dynamic import to get fresh instance with new env
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.debug('Debug message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Debug message')
      );
    });

    it('should log info messages in development', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.info('Info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Info message')
      );
    });

    it('should log warn messages in development', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.warn('Warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning message')
      );
    });

    it('should log error messages in development', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      const error = new Error('Test error');
      logger.error('Error message', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message')
      );
    });

    it('should include context in log messages', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      const context = { userId: '123', action: 'update' };
      logger.info('Info message', context);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Context: {"userId":"123","action":"update"}')
      );
    });

    it('should include error details in error messages', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      logger.error('Error message', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error: Test error\n    at test.js:1:1')
      );
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    it('should not log debug messages in production', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.debug('Debug message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should not log info messages in production', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.info('Info message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should log warn messages in production', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.warn('Warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Warning message')
      );
    });

    it('should log error messages in production', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      const error = new Error('Test error');
      logger.error('Error message', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message')
      );
    });
  });

  describe('Test Environment', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'test');
    });

    it('should not log debug messages in test', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.debug('Debug message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should not log info messages in test', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.info('Info message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it('should not log warn messages in test', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      logger.warn('Warning message');
      
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it('should log error messages in test', async () => {
      const { logger } = await import('@/lib/errors/error-logger');
      
      const error = new Error('Test error');
      logger.error('Error message', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Error message')
      );
    });
  });

  describe('Log Level Enum', () => {
    it('should have correct log level values', () => {
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.ERROR).toBe('error');
    });
  });

  describe('Convenience Functions', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('should provide convenience log functions', async () => {
      const { log } = await import('@/lib/errors/error-logger');
      
      log.debug('Debug message');
      log.info('Info message');
      log.warn('Warning message');
      log.error('Error message');
      
      expect(mockConsole.debug).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('API Logger', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('should provide API-specific logging functions', async () => {
      const { apiLogger } = await import('@/lib/errors/error-logger');
      
      apiLogger.request('GET', '/api/test');
      apiLogger.response('GET', '/api/test', 200);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('API Request: GET /api/test')
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('API Response: GET /api/test - 200')
      );
    });

    it('should log error responses as errors', async () => {
      const { apiLogger } = await import('@/lib/errors/error-logger');
      
      apiLogger.response('GET', '/api/test', 500);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('API Response: GET /api/test - 500')
      );
    });
  });

  describe('Database Logger', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development');
    });

    it('should provide database-specific logging functions', async () => {
      const { dbLogger } = await import('@/lib/errors/error-logger');
      
      dbLogger.query('SELECT * FROM users');
      dbLogger.error('INSERT', new Error('Database error'));
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DB Query: SELECT * FROM users')
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('DB Error: INSERT')
      );
    });
  });
});
