// Can be imported from a shared config
export const locales = ['pt', 'en'] as const;
export const defaultLocale = 'pt' as const;

export type Locale = (typeof locales)[number];
