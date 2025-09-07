/**
 * Application constants
 * Centralized configuration values for the Scout Activities Platform
 */

/** Application name */
export const APP_NAME = 'Scout Activities Platform';

/** Application description */
export const APP_DESCRIPTION = 'A platform for scout leaders to browse activities and build programs';

/** Supported locales for internationalization */
export const SUPPORTED_LOCALES = ['pt', 'en'] as const;

/** Default locale for the application */
export const DEFAULT_LOCALE = 'pt' as const;

/** Maximum file size for uploads (5MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/** Maximum image dimensions in pixels */
export const MAX_IMAGE_DIMENSIONS = 2048;

/** Supported image formats for uploads */
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

/** Default page size for pagination */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size for pagination */
export const MAX_PAGE_SIZE = 100;

/** Cache durations for different data types (in seconds) */
export const CACHE_DURATIONS = {
  ACTIVITIES: 300, // 5 minutes
  TAXONOMIES: 3600, // 1 hour
  PUBLIC_PROGRAMS: 600, // 10 minutes
} as const;

/** Rate limiting configuration (requests per hour) */
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
