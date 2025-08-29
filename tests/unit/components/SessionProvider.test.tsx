import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { SessionProvider } from '@/components/auth/SessionProvider'

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

describe('SessionProvider', () => {
  it('renders children wrapped in NextAuth SessionProvider', () => {
    const { getByTestId, getByText } = render(
      <SessionProvider>
        <div>Test Child</div>
      </SessionProvider>
    )

    expect(getByTestId('session-provider')).toBeInTheDocument()
    expect(getByText('Test Child')).toBeInTheDocument()
  })

  it('passes through multiple children', () => {
    const { getByText } = render(
      <SessionProvider>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </SessionProvider>
    )

    expect(getByText('Child 1')).toBeInTheDocument()
    expect(getByText('Child 2')).toBeInTheDocument()
    expect(getByText('Child 3')).toBeInTheDocument()
  })

  it('renders without children', () => {
    const { getByTestId } = render(<SessionProvider>{}</SessionProvider>)

    expect(getByTestId('session-provider')).toBeInTheDocument()
  })
})

