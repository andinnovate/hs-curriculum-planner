import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { PlanMeta } from '../types'
import { ManagePlansPanel } from './ManagePlansPanel'

const basePlans: PlanMeta[] = [
  { id: 'plan-a', name: 'Plan A', updatedAt: '2024-01-01T00:00:00.000Z', lastSyncedAt: null },
  { id: 'plan-b', name: 'Plan B', updatedAt: '2024-01-01T00:00:00.000Z', lastSyncedAt: null },
]

function renderPanel(overrides?: Partial<ComponentProps<typeof ManagePlansPanel>>) {
  const props: ComponentProps<typeof ManagePlansPanel> = {
    plans: basePlans,
    currentPlanId: 'plan-a',
    onClose: vi.fn(),
    onRename: vi.fn(),
    onCopy: vi.fn(),
    onDelete: vi.fn(),
    onSelectPlan: vi.fn(),
    onCompare: vi.fn(),
    onAddBlankPlan: vi.fn(),
    ...overrides,
  }
  return { ...render(<ManagePlansPanel {...props} />), props }
}

describe('ManagePlansPanel', () => {
  it('selects plans via name and make current', () => {
    const { props } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Plan B' }))
    expect(props.onSelectPlan).toHaveBeenCalledWith('plan-b')

    fireEvent.click(screen.getByRole('button', { name: /make current/i }))
    expect(props.onSelectPlan).toHaveBeenCalledWith('plan-b')
  })

  it('disables delete when only one plan exists', () => {
    renderPanel({
      plans: [{ id: 'solo', name: 'Solo Plan', updatedAt: '2024-01-01T00:00:00.000Z', lastSyncedAt: null }],
      currentPlanId: 'solo',
    })

    fireEvent.click(screen.getByRole('button', { name: /plan actions for solo plan/i }))
    const deleteButton = screen.getByRole('menuitem', { name: 'Delete' })
    expect(deleteButton).toBeDisabled()
    expect(screen.getByText('You must keep at least one plan.')).toBeInTheDocument()
  })

  it('opens compare controls and triggers compare action', () => {
    const { props } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /plan actions for plan a/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Compare' }))

    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'plan-b' } })
    fireEvent.click(screen.getByRole('button', { name: /open compare/i }))

    expect(props.onCompare).toHaveBeenCalledWith('plan-a', 'plan-b')
  })

  it('closes compare controls when cancelled', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /plan actions for plan a/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Compare' }))
    expect(screen.getByText('Compare to')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Compare to')).toBeNull()
  })

  it('closes the action menu on scroll', () => {
    const { container } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /plan actions for plan a/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    const list = container.querySelector('.manage-plans-list') as HTMLUListElement
    fireEvent.scroll(list)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('adds a blank plan from the footer link', () => {
    const { props } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: /add a blank plan/i }))
    expect(props.onAddBlankPlan).toHaveBeenCalled()
  })
})
