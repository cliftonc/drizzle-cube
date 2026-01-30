import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FloatingEditToolbar from '../../../src/client/components/FloatingEditToolbar'
import type { DashboardLayoutMode } from '../../../src/client/types'

describe('FloatingEditToolbar', () => {
  const createDefaultProps = () => ({
    isEditBarVisible: false,
    position: 'right' as const,
    isEditMode: false,
    onEditModeToggle: vi.fn(),
    layoutMode: 'grid' as DashboardLayoutMode,
    onLayoutModeChange: vi.fn(),
    allowedModes: ['grid', 'rows'] as DashboardLayoutMode[],
    canChangeLayoutMode: true,
    currentPalette: 'default',
    onPaletteChange: vi.fn(),
    onAddPortlet: vi.fn()
  })

  describe('rendering', () => {
    it('should render edit toggle button', () => {
      const props = createDefaultProps()

      render(<FloatingEditToolbar {...props} />)

      expect(screen.getByTitle('Edit Dashboard')).toBeInTheDocument()
    })

    it('should show "Finish Editing" tooltip when in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      expect(screen.getByTitle('Finish Editing')).toBeInTheDocument()
    })

    it('should not show layout mode buttons when not in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = false

      render(<FloatingEditToolbar {...props} />)

      expect(screen.queryByTitle('Grid Layout')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Rows Layout')).not.toBeInTheDocument()
    })

    it('should show layout mode buttons when in edit mode with multiple allowed modes', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      expect(screen.getByTitle('Grid Layout')).toBeInTheDocument()
      expect(screen.getByTitle('Rows Layout')).toBeInTheDocument()
    })

    it('should not show layout mode buttons when only one mode is allowed', () => {
      const props = createDefaultProps()
      props.isEditMode = true
      props.allowedModes = ['grid']

      render(<FloatingEditToolbar {...props} />)

      expect(screen.queryByTitle('Grid Layout')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Rows Layout')).not.toBeInTheDocument()
    })

    it('should show color palette button in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      expect(screen.getByTitle('Color Palette')).toBeInTheDocument()
    })

    it('should not show color palette button when not in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = false

      render(<FloatingEditToolbar {...props} />)

      expect(screen.queryByTitle('Color Palette')).not.toBeInTheDocument()
    })

    it('should show add portlet button in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      expect(screen.getByTitle('Add Portlet')).toBeInTheDocument()
    })

    it('should not show add portlet button when not in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = false

      render(<FloatingEditToolbar {...props} />)

      expect(screen.queryByTitle('Add Portlet')).not.toBeInTheDocument()
    })
  })

  describe('visibility', () => {
    it('should be visible when isEditBarVisible is false', () => {
      const props = createDefaultProps()
      props.isEditBarVisible = false

      render(<FloatingEditToolbar {...props} />)

      const toolbar = screen.getByTitle('Edit Dashboard').closest('div[class*="fixed"]')
      expect(toolbar).not.toHaveClass('dc:pointer-events-none')
    })

    it('should be hidden when isEditBarVisible is true', () => {
      const props = createDefaultProps()
      props.isEditBarVisible = true

      render(<FloatingEditToolbar {...props} />)

      const toolbar = screen.getByTitle('Edit Dashboard').closest('div[class*="fixed"]')
      expect(toolbar?.className).toContain('dc:pointer-events-none')
    })
  })

  describe('positioning', () => {
    it('should position on right when position is right', () => {
      const props = createDefaultProps()
      props.position = 'right'

      render(<FloatingEditToolbar {...props} />)

      const toolbar = screen.getByTitle('Edit Dashboard').closest('div[class*="fixed"]')
      expect(toolbar?.className).toContain('dc:right-4')
    })

    it('should position on left when position is left', () => {
      const props = createDefaultProps()
      props.position = 'left'

      render(<FloatingEditToolbar {...props} />)

      const toolbar = screen.getByTitle('Edit Dashboard').closest('div[class*="fixed"]')
      expect(toolbar?.className).toContain('dc:left-4')
    })
  })

  describe('edit toggle button', () => {
    it('should call onEditModeToggle when clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Edit Dashboard'))

      expect(props.onEditModeToggle).toHaveBeenCalled()
    })
  })

  describe('layout mode buttons', () => {
    it('should highlight grid button when layoutMode is grid', () => {
      const props = createDefaultProps()
      props.isEditMode = true
      props.layoutMode = 'grid'

      render(<FloatingEditToolbar {...props} />)

      const gridButton = screen.getByTitle('Grid Layout')
      expect(gridButton.className).toContain('bg-dc-accent')
    })

    it('should highlight rows button when layoutMode is rows', () => {
      const props = createDefaultProps()
      props.isEditMode = true
      props.layoutMode = 'rows'

      render(<FloatingEditToolbar {...props} />)

      const rowsButton = screen.getByTitle('Rows Layout')
      expect(rowsButton.className).toContain('bg-dc-accent')
    })

    it('should call onLayoutModeChange with grid when grid button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Grid Layout'))

      expect(props.onLayoutModeChange).toHaveBeenCalledWith('grid')
    })

    it('should call onLayoutModeChange with rows when rows button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Rows Layout'))

      expect(props.onLayoutModeChange).toHaveBeenCalledWith('rows')
    })

    it('should disable layout buttons when canChangeLayoutMode is false', () => {
      const props = createDefaultProps()
      props.isEditMode = true
      props.canChangeLayoutMode = false

      render(<FloatingEditToolbar {...props} />)

      const gridButton = screen.getByTitle('Grid Layout')
      const rowsButton = screen.getByTitle('Rows Layout')

      expect(gridButton).toBeDisabled()
      expect(rowsButton).toBeDisabled()
    })
  })

  describe('add portlet button', () => {
    it('should call onAddPortlet when clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Add Portlet'))

      expect(props.onAddPortlet).toHaveBeenCalled()
    })
  })

  describe('color palette dropdown', () => {
    it('should open palette dropdown when palette button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Color Palette'))

      // Dropdown should show palette options
      await waitFor(() => {
        // Look for a palette name in the dropdown
        expect(document.querySelector('[class*="absolute"]')).toBeInTheDocument()
      })
    })

    it('should call onPaletteChange when palette selected', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      // Open dropdown
      await user.click(screen.getByTitle('Color Palette'))

      // Wait for dropdown to render
      await waitFor(() => {
        expect(document.querySelector('[class*="w-52"]')).toBeInTheDocument()
      })

      // Find and click first palette option (should be a button in the dropdown)
      const paletteButtons = document.querySelectorAll('[class*="w-52"] button')
      if (paletteButtons.length > 0) {
        await user.click(paletteButtons[0])
        expect(props.onPaletteChange).toHaveBeenCalled()
      }
    })

    it('should close palette dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      // Open dropdown
      await user.click(screen.getByTitle('Color Palette'))

      await waitFor(() => {
        expect(document.querySelector('[class*="w-52"]')).toBeInTheDocument()
      })

      // Click outside (on body)
      await user.click(document.body)

      await waitFor(() => {
        expect(document.querySelector('[class*="w-52"]')).not.toBeInTheDocument()
      })
    })

    it('should close palette dropdown when edit bar becomes visible', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true
      props.isEditBarVisible = false

      const { rerender } = render(<FloatingEditToolbar {...props} />)

      // Open dropdown
      await user.click(screen.getByTitle('Color Palette'))

      await waitFor(() => {
        expect(document.querySelector('[class*="w-52"]')).toBeInTheDocument()
      })

      // Make edit bar visible
      rerender(<FloatingEditToolbar {...props} isEditBarVisible={true} />)

      await waitFor(() => {
        expect(document.querySelector('[class*="w-52"]')).not.toBeInTheDocument()
      })
    })

    it('should position palette dropdown opposite to toolbar position (left toolbar -> right dropdown)', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true
      props.position = 'left'

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Color Palette'))

      await waitFor(() => {
        const dropdown = document.querySelector('[class*="w-52"]')
        expect(dropdown?.className).toContain('dc:left-full')
      })
    })

    it('should position palette dropdown opposite to toolbar position (right toolbar -> left dropdown)', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true
      props.position = 'right'

      render(<FloatingEditToolbar {...props} />)

      await user.click(screen.getByTitle('Color Palette'))

      await waitFor(() => {
        const dropdown = document.querySelector('[class*="w-52"]')
        expect(dropdown?.className).toContain('dc:right-full')
      })
    })
  })

  describe('button active states', () => {
    it('should show edit toggle as active when in edit mode', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      const editButton = screen.getByTitle('Finish Editing')
      expect(editButton.className).toContain('bg-dc-accent')
    })

    it('should show palette button as active when dropdown is open', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<FloatingEditToolbar {...props} />)

      const paletteButton = screen.getByTitle('Color Palette')

      // Initially not active
      expect(paletteButton.className).not.toContain('bg-dc-accent')

      await user.click(paletteButton)

      // After click, should be active
      await waitFor(() => {
        expect(paletteButton.className).toContain('bg-dc-accent')
      })
    })
  })
})
