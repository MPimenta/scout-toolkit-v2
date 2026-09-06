/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// SQL-integration routes import @/lib/db/server. Pin Vitest to the
// disposable local DB so those imports never use .env.local / Neon.
process.env.DATABASE_URL =
  'postgresql://test_user:test_password@localhost:5432/scout_toolkit_test'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"test"',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    // One shared scout_toolkit_test; parallel files truncate each other.
    fileParallelism: false,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.spec.ts', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.stories.*',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
})
