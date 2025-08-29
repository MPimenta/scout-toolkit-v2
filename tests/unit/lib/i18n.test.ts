import { describe, it, expect } from 'vitest'
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config'

describe('i18n Configuration', () => {
  describe('locales', () => {
    it('should have correct locales defined', () => {
      expect(locales).toEqual(['pt', 'en'])
    })

    it('should have Portuguese as first locale', () => {
      expect(locales[0]).toBe('pt')
    })

    it('should have English as second locale', () => {
      expect(locales[1]).toBe('en')
    })

    it('should have exactly 2 locales', () => {
      expect(locales).toHaveLength(2)
    })
  })

  describe('defaultLocale', () => {
    it('should be Portuguese', () => {
      expect(defaultLocale).toBe('pt')
    })

    it('should be included in locales array', () => {
      expect(locales).toContain(defaultLocale)
    })
  })

  describe('Locale type', () => {
    it('should accept valid locales', () => {
      const validLocales: Locale[] = ['pt', 'en']
      expect(validLocales).toEqual(['pt', 'en'])
    })

    it('should not accept invalid locales', () => {
      // TypeScript should catch this at compile time
      // This test verifies the type constraint
      const localesArray = locales as readonly string[]
      expect(localesArray).toContain('pt')
      expect(localesArray).toContain('en')
      expect(localesArray).not.toContain('fr')
    })
  })

  describe('locale validation', () => {
    it('should validate Portuguese locale', () => {
      const isValidLocale = (locale: string): locale is Locale => {
        return locales.includes(locale as Locale)
      }

      expect(isValidLocale('pt')).toBe(true)
    })

    it('should validate English locale', () => {
      const isValidLocale = (locale: string): locale is Locale => {
        return locales.includes(locale as Locale)
      }

      expect(isValidLocale('en')).toBe(true)
    })

    it('should reject invalid locales', () => {
      const isValidLocale = (locale: string): locale is Locale => {
        return locales.includes(locale as Locale)
      }

      expect(isValidLocale('fr')).toBe(false)
      expect(isValidLocale('es')).toBe(false)
      expect(isValidLocale('de')).toBe(false)
    })
  })
})

