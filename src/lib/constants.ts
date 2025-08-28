// Application constants
export const APP_NAME = 'Scout Activities Platform';
export const APP_DESCRIPTION = 'A platform for scout leaders to browse activities and build programs';

// Supported locales
export const SUPPORTED_LOCALES = ['pt', 'en'] as const;
export const DEFAULT_LOCALE = 'pt' as const;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_DIMENSIONS = 2048;
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  ACTIVITIES: 300, // 5 minutes
  TAXONOMIES: 3600, // 1 hour
  PUBLIC_PROGRAMS: 600, // 10 minutes
} as const;

// Rate limiting
export const RATE_LIMITS = {
  AUTHENTICATED: 1000, // requests per hour
  UNAUTHENTICATED: 100, // requests per hour
  FILE_UPLOADS: 10, // uploads per hour
} as const;

// Age groups
export const AGE_GROUPS = [
  'cub_scouts',
  'scouts',
  'adventurers',
  'rovers',
  'leaders',
] as const;

// Group sizes
export const GROUP_SIZES = ['small', 'medium', 'large'] as const;

// Effort levels
export const EFFORT_LEVELS = ['low', 'medium', 'high'] as const;

// Locations
export const LOCATIONS = ['inside', 'outside'] as const;

// User roles
export const USER_ROLES = ['user', 'admin'] as const;
