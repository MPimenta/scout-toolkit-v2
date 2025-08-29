import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock environment variables
vi.mock('process', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
  },
}));
