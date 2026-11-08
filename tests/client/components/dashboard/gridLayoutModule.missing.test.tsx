import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, renderHook, screen, waitFor } from '@testing-library/react'

// react-grid-layout is an optional peer. Loading it fails as it does in an app
// without it (#1422).
const loads = vi.hoisted(() => ({ count: 0 }))
vi.mock('react-grid-layout', () => {
  loads.count++
  throw new Error('Cannot find module react-grid-layout')
})

describe('react-grid-layout not installed', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('does not load it while the dashboard is in row mode', async () => {
    const { useGridLayoutModule } = await import('../../../../src/client/components/dashboard/gridLayoutModule')
    const { result } = renderHook(() => useGridLayoutModule(false))
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(result.current).toBeUndefined()
    expect(loads.count).toBe(0)
  })

  it('resolves to null in grid mode', async () => {
    const { useGridLayoutModule } = await import('../../../../src/client/components/dashboard/gridLayoutModule')
    const { result } = renderHook(() => useGridLayoutModule(true))
    await waitFor(() => expect(result.current).toBeNull())
  })

  it('shows the install command in place of the grid', async () => {
    const { MissingGridLayoutFallback } = await import('../../../../src/client/components/dashboard/gridLayoutModule')
    render(<MissingGridLayoutFallback />)
    expect(screen.getByText('npm install react-grid-layout')).toBeInTheDocument()
    expect(screen.getByText('Grid layout needs react-grid-layout')).toBeInTheDocument()
  })
})
