/** Shared by the worker source, the sign-out cleanup and the tests (openspec: mobile-pwa). */
export const SW_VERSION = 'v1';
export const CACHE_PREFIX = 'kit-';
export const STATIC_CACHE = `${CACHE_PREFIX}static-${SW_VERSION}`;
export const PAGES_CACHE = `${CACHE_PREFIX}pages-${SW_VERSION}`;
export const OFFLINE_URL = '/offline';
