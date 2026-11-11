import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DivisionPill } from '@/components/ui/DivisionPill'

describe('DivisionPill', () => {
  it.each([
    ['cub_scouts', 'Alcateia', 'bg-division-cub-scouts', 'text-division-cub-scouts-foreground'],
    ['scouts', 'Tribo de Escoteiros', 'bg-division-scouts', 'text-division-scouts-foreground'],
    ['adventurers', 'Tribo de Exploradores', 'bg-division-adventurers', 'text-division-adventurers-foreground'],
    ['rovers', 'Clã', 'bg-division-rovers', 'text-division-rovers-foreground'],
    ['leaders', 'Chefia', 'bg-division-leaders', 'text-division-leaders-foreground'],
  ])('renders %s with its own fill and label colour', (ageGroup, name, fill, label) => {
    render(<DivisionPill ageGroup={ageGroup} code="1A.2" />)
    const pill = screen.getByLabelText(`${name}: 1A.2`)
    expect(pill).toHaveClass(fill)
    expect(pill).toHaveClass(label)
    expect(pill).toHaveTextContent('1A.2')
  })

  it('uses a near-black label on the Clã red, never white', () => {
    render(<DivisionPill ageGroup="rovers" code="4S.1.3" />)
    const pill = screen.getByLabelText('Clã: 4S.1.3')
    expect(pill).not.toHaveClass('text-white')
    expect(pill).not.toHaveClass('text-primary-foreground')
  })

  it('gives the Chefia pill a visible border', () => {
    render(<DivisionPill ageGroup="leaders" code="X" />)
    expect(screen.getByLabelText('Chefia: X')).toHaveClass('border-division-leaders-border')
  })

  it('falls back to the neutral badge for an unknown age group', () => {
    render(<DivisionPill ageGroup="mystery" code="9Z.9" />)
    const pill = screen.getByLabelText('9Z.9')
    expect(pill).toHaveClass('border-border')
    expect(pill.className).not.toMatch(/division/)
    expect(pill).not.toHaveAttribute('data-age-group')
  })

  it('puts the long title in the tooltip', () => {
    render(<DivisionPill ageGroup="scouts" code="2F.1" title="Cuidar do corpo" />)
    expect(screen.getByLabelText('Tribo de Escoteiros: 2F.1')).toHaveAttribute(
      'title',
      'Tribo de Escoteiros: 2F.1 — Cuidar do corpo'
    )
  })
})
