import { describe, it, expect } from 'vitest'
import ptMessages from '@/lib/messages/pt.json'
import enMessages from '@/lib/messages/en.json'

describe('Message Files', () => {
  describe('Portuguese Messages (pt.json)', () => {
    it('should be a valid JSON object', () => {
      expect(typeof ptMessages).toBe('object')
      expect(ptMessages).not.toBeNull()
    })

    it('should have required top-level keys', () => {
      const requiredKeys = ['common', 'navigation', 'auth', 'home', 'activities']
      requiredKeys.forEach(key => {
        expect(ptMessages).toHaveProperty(key)
      })
    })

    it('should have auth translations', () => {
      expect(ptMessages.auth).toHaveProperty('signIn')
      expect(ptMessages.auth).toHaveProperty('signOut')
      expect(ptMessages.auth).toHaveProperty('loading')
      expect(ptMessages.auth).toHaveProperty('error')
    })

    it('should have common translations', () => {
      expect(ptMessages.common).toHaveProperty('loading')
      expect(ptMessages.common).toHaveProperty('error')
      expect(ptMessages.common).toHaveProperty('success')
      expect(ptMessages.common).toHaveProperty('cancel')
      expect(ptMessages.common).toHaveProperty('save')
    })

    it('should have navigation translations', () => {
      expect(ptMessages.navigation).toHaveProperty('home')
      expect(ptMessages.navigation).toHaveProperty('activities')
      expect(ptMessages.navigation).toHaveProperty('programs')
      expect(ptMessages.navigation).toHaveProperty('admin')
    })

    it('should have home translations', () => {
      expect(ptMessages.home).toHaveProperty('title')
      expect(ptMessages.home).toHaveProperty('subtitle')
      expect(ptMessages.home).toHaveProperty('description')
    })

    it('should have activities translations', () => {
      expect(ptMessages.activities).toHaveProperty('title')
      expect(ptMessages.activities).toHaveProperty('searchPlaceholder')
      expect(ptMessages.activities).toHaveProperty('filters')
      expect(ptMessages.activities).toHaveProperty('view')
    })
  })

  describe('English Messages (en.json)', () => {
    it('should be a valid JSON object', () => {
      expect(typeof enMessages).toBe('object')
      expect(enMessages).not.toBeNull()
    })

    it('should have the same structure as Portuguese messages', () => {
      const ptKeys = Object.keys(ptMessages)
      const enKeys = Object.keys(enMessages)
      expect(enKeys).toEqual(ptKeys)
    })

    it('should have auth translations', () => {
      expect(enMessages.auth).toHaveProperty('signIn')
      expect(enMessages.auth).toHaveProperty('signOut')
      expect(enMessages.auth).toHaveProperty('loading')
      expect(enMessages.auth).toHaveProperty('error')
    })

    it('should have common translations', () => {
      expect(enMessages.common).toHaveProperty('loading')
      expect(enMessages.common).toHaveProperty('error')
      expect(enMessages.common).toHaveProperty('success')
      expect(enMessages.common).toHaveProperty('cancel')
      expect(enMessages.common).toHaveProperty('save')
    })

    it('should have navigation translations', () => {
      expect(enMessages.navigation).toHaveProperty('home')
      expect(enMessages.navigation).toHaveProperty('activities')
      expect(enMessages.navigation).toHaveProperty('programs')
      expect(enMessages.navigation).toHaveProperty('admin')
    })

    it('should have home translations', () => {
      expect(enMessages.home).toHaveProperty('title')
      expect(enMessages.home).toHaveProperty('subtitle')
      expect(enMessages.home).toHaveProperty('description')
    })

    it('should have activities translations', () => {
      expect(enMessages.activities).toHaveProperty('title')
      expect(enMessages.activities).toHaveProperty('searchPlaceholder')
      expect(enMessages.activities).toHaveProperty('filters')
      expect(enMessages.activities).toHaveProperty('view')
    })
  })

  describe('Message Consistency', () => {
    it('should have consistent nested structure', () => {
      const checkNestedStructure = (obj1: any, obj2: any, path: string = ''): void => {
        const keys1 = Object.keys(obj1)
        const keys2 = Object.keys(obj2)

        expect(keys2).toEqual(keys1)

        keys1.forEach(key => {
          const newPath = path ? `${path}.${key}` : key
          if (typeof obj1[key] === 'object' && obj1[key] !== null) {
            checkNestedStructure(obj1[key], obj2[key], newPath)
          }
        })
      }

      checkNestedStructure(ptMessages, enMessages)
    })

    it('should not have empty string values', () => {
      const checkEmptyStrings = (obj: any, path: string = ''): void => {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key
          if (typeof value === 'string') {
            expect(value, `Empty string found at ${newPath}`).not.toBe('')
          } else if (typeof value === 'object' && value !== null) {
            checkEmptyStrings(value, newPath)
          }
        })
      }

      checkEmptyStrings(ptMessages)
      checkEmptyStrings(enMessages)
    })
  })
})

