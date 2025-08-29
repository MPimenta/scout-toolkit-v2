import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSession, getCurrentUser, requireAuth, requireAdmin, isAdmin, isAuthenticated } from '@/lib/auth/utils'

// Mock the auth function
vi.mock('../../../src/lib/auth/config', () => ({
  auth: vi.fn(),
}))

describe('Auth Utils', () => {
  let mockAuth: any

  beforeEach(async () => {
    const authModule = await import('../../../src/lib/auth/config')
    mockAuth = vi.mocked(authModule.auth)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSession', () => {
    it('should return session from auth function', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@escoteiros.pt',
          role: 'user',
        },
      }

      mockAuth.mockResolvedValue(mockSession)

      const result = await getSession()

      expect(mockAuth).toHaveBeenCalledOnce()
      expect(result).toEqual(mockSession)
    })

    it('should return null when no session', async () => {
      mockAuth.mockResolvedValue(null)

      const result = await getSession()

      expect(mockAuth).toHaveBeenCalledOnce()
      expect(result).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should return user from session', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@escoteiros.pt',
        role: 'user',
      }

      mockAuth.mockResolvedValue({ user: mockUser })

      const result = await getCurrentUser()

      expect(result).toEqual(mockUser)
    })

    it('should return undefined when no session', async () => {
      mockAuth.mockResolvedValue(null)

      const result = await getCurrentUser()

      expect(result).toBeUndefined()
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@escoteiros.pt',
        role: 'user',
      }

      mockAuth.mockResolvedValue({ user: mockUser })

      const result = await requireAuth()

      expect(result).toEqual(mockUser)
    })

    it('should throw error when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      await expect(requireAuth()).rejects.toThrow('Authentication required')
    })
  })

  describe('requireAdmin', () => {
    it('should return user when admin', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@escoteiros.pt',
        role: 'admin',
      }

      mockAuth.mockResolvedValue({ user: mockUser })

      const result = await requireAdmin()

      expect(result).toEqual(mockUser)
    })

    it('should throw error when not admin', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@escoteiros.pt',
        role: 'user',
      }

      mockAuth.mockResolvedValue({ user: mockUser })

      await expect(requireAdmin()).rejects.toThrow('Admin access required')
    })

    it('should throw error when not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      await expect(requireAdmin()).rejects.toThrow('Authentication required')
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { role: 'admin' }
      expect(isAdmin(adminUser)).toBe(true)
    })

    it('should return false for non-admin user', () => {
      const regularUser = { role: 'user' }
      expect(isAdmin(regularUser)).toBe(false)
    })

    it('should return false for user without role', () => {
      const userWithoutRole = {}
      expect(isAdmin(userWithoutRole as any)).toBe(false)
    })
  })

  describe('isAuthenticated', () => {
    it('should return true for authenticated user', () => {
      const authenticatedUser = { id: 'user-1' }
      expect(isAuthenticated(authenticatedUser)).toBe(true)
    })

    it('should return false for null user', () => {
      expect(isAuthenticated(null)).toBe(false)
    })

    it('should return false for user without id', () => {
      const userWithoutId = { name: 'John Doe' }
      expect(isAuthenticated(userWithoutId as any)).toBe(false)
    })

    it('should return false for user with empty id', () => {
      const userWithEmptyId = { id: '' }
      expect(isAuthenticated(userWithEmptyId)).toBe(false)
    })
  })
})
