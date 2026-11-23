/**
 * Tests for the icon registry: a component from getIcon() shows the icon that
 * the registry holds when the component renders.
 */

import { render, waitFor } from '@testing-library/react'
import type { IconifyIcon } from '@iconify/types'
import { afterEach, describe, expect, it } from 'vitest'
import { getIcon, registerIcons, resetIcons, setIcon } from '../../../src/client/icons/registry'

const hostRefreshIcon: IconifyIcon = {
  body: '<path d="M1 1h22" data-host-icon="refresh"/>',
  width: 24,
  height: 24
}

const hostAddIcon: IconifyIcon = {
  body: '<path d="M2 2h20" data-host-icon="add"/>',
  width: 24,
  height: 24
}

async function renderedHostIcon(container: HTMLElement): Promise<string | null> {
  await waitFor(() => expect(container.querySelector('svg')).not.toBeNull())
  return container.querySelector('[data-host-icon]')?.getAttribute('data-host-icon') ?? null
}

describe('icon registry', () => {
  afterEach(() => {
    resetIcons()
  })

  it('shows a host icon from registerIcons() in a component taken before the call', async () => {
    const RefreshIcon = getIcon('refresh')

    registerIcons({ refresh: hostRefreshIcon })
    const { container } = render(<RefreshIcon />)

    expect(await renderedHostIcon(container)).toBe('refresh')
  })

  it('shows a host icon from setIcon() in a component taken before the call', async () => {
    const AddIcon = getIcon('add')

    setIcon('add', hostAddIcon)
    const { container } = render(<AddIcon />)

    expect(await renderedHostIcon(container)).toBe('add')
  })

  it('shows the default icon again in a component taken before resetIcons()', async () => {
    registerIcons({ refresh: hostRefreshIcon })
    const RefreshIcon = getIcon('refresh')

    resetIcons()
    const { container } = render(<RefreshIcon />)

    expect(await renderedHostIcon(container)).toBeNull()
  })

  it('shows a host icon in a component taken after registerIcons()', async () => {
    registerIcons({ refresh: hostRefreshIcon })
    const RefreshIcon = getIcon('refresh')

    const { container } = render(<RefreshIcon />)

    expect(await renderedHostIcon(container)).toBe('refresh')
  })
})
