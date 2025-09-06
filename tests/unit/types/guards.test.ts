import { describe, it, expect } from 'vitest';
import {
  // Primitive type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  
  // Union type guards
  isAgeGroup,
  isGroupSize,
  isEffortLevel,
  isLocation,
  isUserRole,
  isEntryType,
  
  // Entity type guards
  isUser,
  isActivity,
  isProgram,
  isProgramEntry,
  isActivityType,
  isEducationalGoal,
  isSdg,
  isReview,
  
  // API response type guards
  isApiActivity,
  isApiProgram,
  isApiProgramEntry,
  
  // Error type guards
  isErrorCode,
  isAppError,
  
  // Array type guards
  isUserArray,
  isActivityArray,
  isProgramArray,
  isProgramEntryArray,
  isApiActivityArray,
  isApiProgramArray,
  isApiProgramEntryArray,
} from '@/types/guards';

describe('Type Guards - Primitive Types', () => {
  describe('isString', () => {
    it('should return true for valid strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('123')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(123.45)).toBe(true);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should return true for valid booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for valid objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject(new Date())).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for valid arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });
});

describe('Type Guards - Union Types', () => {
  describe('isAgeGroup', () => {
    it('should return true for valid age groups', () => {
      expect(isAgeGroup('cub_scouts')).toBe(true);
      expect(isAgeGroup('scouts')).toBe(true);
      expect(isAgeGroup('adventurers')).toBe(true);
      expect(isAgeGroup('rovers')).toBe(true);
      expect(isAgeGroup('leaders')).toBe(true);
    });

    it('should return false for invalid age groups', () => {
      expect(isAgeGroup('invalid')).toBe(false);
      expect(isAgeGroup('')).toBe(false);
      expect(isAgeGroup(123)).toBe(false);
      expect(isAgeGroup(null)).toBe(false);
    });
  });

  describe('isGroupSize', () => {
    it('should return true for valid group sizes', () => {
      expect(isGroupSize('small')).toBe(true);
      expect(isGroupSize('medium')).toBe(true);
      expect(isGroupSize('large')).toBe(true);
    });

    it('should return false for invalid group sizes', () => {
      expect(isGroupSize('invalid')).toBe(false);
      expect(isGroupSize('')).toBe(false);
      expect(isGroupSize(123)).toBe(false);
    });
  });

  describe('isEffortLevel', () => {
    it('should return true for valid effort levels', () => {
      expect(isEffortLevel('low')).toBe(true);
      expect(isEffortLevel('medium')).toBe(true);
      expect(isEffortLevel('high')).toBe(true);
    });

    it('should return false for invalid effort levels', () => {
      expect(isEffortLevel('invalid')).toBe(false);
      expect(isEffortLevel('')).toBe(false);
      expect(isEffortLevel(123)).toBe(false);
    });
  });

  describe('isLocation', () => {
    it('should return true for valid locations', () => {
      expect(isLocation('inside')).toBe(true);
      expect(isLocation('outside')).toBe(true);
    });

    it('should return false for invalid locations', () => {
      expect(isLocation('invalid')).toBe(false);
      expect(isLocation('')).toBe(false);
      expect(isLocation(123)).toBe(false);
    });
  });

  describe('isUserRole', () => {
    it('should return true for valid user roles', () => {
      expect(isUserRole('user')).toBe(true);
      expect(isUserRole('admin')).toBe(true);
    });

    it('should return false for invalid user roles', () => {
      expect(isUserRole('invalid')).toBe(false);
      expect(isUserRole('')).toBe(false);
      expect(isUserRole(123)).toBe(false);
    });
  });

  describe('isEntryType', () => {
    it('should return true for valid entry types', () => {
      expect(isEntryType('activity')).toBe(true);
      expect(isEntryType('custom')).toBe(true);
    });

    it('should return false for invalid entry types', () => {
      expect(isEntryType('invalid')).toBe(false);
      expect(isEntryType('')).toBe(false);
      expect(isEntryType(123)).toBe(false);
    });
  });
});

describe('Type Guards - Entity Types', () => {
  describe('isUser', () => {
    it('should return true for valid user objects', () => {
      const validUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      expect(isUser(validUser)).toBe(true);
    });

    it('should return false for invalid user objects', () => {
      expect(isUser({})).toBe(false);
      expect(isUser({ id: '123' })).toBe(false);
      expect(isUser({ id: '123', email: 'test@example.com' })).toBe(false);
      expect(isUser('string')).toBe(false);
      expect(isUser(null)).toBe(false);
    });
  });

  describe('isActivity', () => {
    it('should return true for valid activity objects', () => {
      const validActivity = {
        id: '123',
        name: 'Test Activity',
        description: 'Test Description',
        materials: 'Test Materials',
        approximate_duration_minutes: 60,
        group_size: 'small',
        effort_level: 'medium',
        location: 'inside',
        age_group: 'scouts',
        activity_type_id: '456',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        is_approved: true,
      };
      expect(isActivity(validActivity)).toBe(true);
    });

    it('should return false for invalid activity objects', () => {
      expect(isActivity({})).toBe(false);
      expect(isActivity({ id: '123' })).toBe(false);
      expect(isActivity('string')).toBe(false);
      expect(isActivity(null)).toBe(false);
    });
  });

  describe('isProgram', () => {
    it('should return true for valid program objects', () => {
      const validProgram = {
        id: '123',
        name: 'Test Program',
        start_time: '09:00',
        user_id: '456',
        is_public: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      expect(isProgram(validProgram)).toBe(true);
    });

    it('should return false for invalid program objects', () => {
      expect(isProgram({})).toBe(false);
      expect(isProgram({ id: '123' })).toBe(false);
      expect(isProgram('string')).toBe(false);
      expect(isProgram(null)).toBe(false);
    });
  });

  describe('isProgramEntry', () => {
    it('should return true for valid program entry objects', () => {
      const validEntry = {
        id: '123',
        program_id: '456',
        position: 1,
        start_time: '09:00',
        end_time: '10:00',
        entry_type: 'activity',
        created_at: '2023-01-01T00:00:00Z',
      };
      expect(isProgramEntry(validEntry)).toBe(true);
    });

    it('should return false for invalid program entry objects', () => {
      expect(isProgramEntry({})).toBe(false);
      expect(isProgramEntry({ id: '123' })).toBe(false);
      expect(isProgramEntry('string')).toBe(false);
      expect(isProgramEntry(null)).toBe(false);
    });
  });
});

describe('Type Guards - API Response Types', () => {
  describe('isApiActivity', () => {
    it('should return true for valid API activity objects', () => {
      const validApiActivity = {
        id: '123',
        name: 'Test Activity',
        description: 'Test Description',
        materials: 'Test Materials',
        approximate_duration_minutes: 60,
        group_size: 'small',
        effort_level: 'medium',
        location: 'inside',
        age_group: 'scouts',
        created_at: '2023-01-01T00:00:00Z',
        activity_type: {
          id: '456',
          name: 'Test Type',
        },
        educational_goals: [],
        sdgs: [],
      };
      expect(isApiActivity(validApiActivity)).toBe(true);
    });

    it('should return false for invalid API activity objects', () => {
      expect(isApiActivity({})).toBe(false);
      expect(isApiActivity({ id: '123' })).toBe(false);
      expect(isApiActivity('string')).toBe(false);
      expect(isApiActivity(null)).toBe(false);
    });
  });

  describe('isApiProgram', () => {
    it('should return true for valid API program objects', () => {
      const validApiProgram = {
        id: '123',
        name: 'Test Program',
        start_time: '09:00',
        is_public: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        entry_count: 5,
        total_duration_minutes: 300,
      };
      expect(isApiProgram(validApiProgram)).toBe(true);
    });

    it('should return false for invalid API program objects', () => {
      expect(isApiProgram({})).toBe(false);
      expect(isApiProgram({ id: '123' })).toBe(false);
      expect(isApiProgram('string')).toBe(false);
      expect(isApiProgram(null)).toBe(false);
    });
  });
});

describe('Type Guards - Error Types', () => {
  describe('isErrorCode', () => {
    it('should return true for valid error codes', () => {
      expect(isErrorCode('VALIDATION_ERROR')).toBe(true);
      expect(isErrorCode('AUTHENTICATION_ERROR')).toBe(true);
      expect(isErrorCode('AUTHORIZATION_ERROR')).toBe(true);
      expect(isErrorCode('NOT_FOUND')).toBe(true);
      expect(isErrorCode('CONFLICT')).toBe(true);
      expect(isErrorCode('INTERNAL_ERROR')).toBe(true);
      expect(isErrorCode('NETWORK_ERROR')).toBe(true);
      expect(isErrorCode('TIMEOUT_ERROR')).toBe(true);
    });

    it('should return false for invalid error codes', () => {
      expect(isErrorCode('INVALID_ERROR')).toBe(false);
      expect(isErrorCode('')).toBe(false);
      expect(isErrorCode(123)).toBe(false);
      expect(isErrorCode(null)).toBe(false);
    });
  });

  describe('isAppError', () => {
    it('should return true for valid app error objects', () => {
      const validError = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      };
      expect(isAppError(validError)).toBe(true);
    });

    it('should return false for invalid app error objects', () => {
      expect(isAppError({})).toBe(false);
      expect(isAppError({ code: 'INVALID' })).toBe(false);
      expect(isAppError({ message: 'Error' })).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });
});

describe('Type Guards - Array Types', () => {
  describe('isUserArray', () => {
    it('should return true for valid user arrays', () => {
      const validUsers = [
        {
          id: '1',
          email: 'test1@example.com',
          name: 'User 1',
          role: 'user',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'test2@example.com',
          name: 'User 2',
          role: 'admin',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];
      expect(isUserArray(validUsers)).toBe(true);
    });

    it('should return false for invalid user arrays', () => {
      expect(isUserArray([])).toBe(true); // Empty array is valid
      expect(isUserArray([{}])).toBe(false);
      expect(isUserArray([{ id: '1' }])).toBe(false);
      expect(isUserArray('string')).toBe(false);
      expect(isUserArray(null)).toBe(false);
    });
  });

  describe('isActivityArray', () => {
    it('should return true for valid activity arrays', () => {
      const validActivities = [
        {
          id: '1',
          name: 'Activity 1',
          description: 'Description 1',
          materials: 'Materials 1',
          approximate_duration_minutes: 60,
          group_size: 'small',
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          activity_type_id: '456',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          is_approved: true,
        },
      ];
      expect(isActivityArray(validActivities)).toBe(true);
    });

    it('should return false for invalid activity arrays', () => {
      expect(isActivityArray([])).toBe(true); // Empty array is valid
      expect(isActivityArray([{}])).toBe(false);
      expect(isActivityArray([{ id: '1' }])).toBe(false);
      expect(isActivityArray('string')).toBe(false);
      expect(isActivityArray(null)).toBe(false);
    });
  });
});
