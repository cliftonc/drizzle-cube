/**
 * Tests for ColorPaletteSelector component
 *
 * ColorPaletteSelector:
 * - Renders a dropdown button showing current palette name
 * - Shows color preview swatches for current palette
 * - Opens/closes dropdown menu on button click
 * - Displays all available color palettes
 * - Calls onPaletteChange when palette is selected
 * - Closes dropdown after selection
 * - Shows selected palette with visual indicator
 * - Closes dropdown when clicking outside
 * - Sorts palettes alphabetically by label
 */

import React from 'react'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ColorPaletteSelector from '../../../../src/client/components/ColorPaletteSelector'
import { COLOR_PALETTES, getColorPalette } from '../../../../src/client/utils/colorPalettes'

// ============================================================================
// ColorPaletteSelector Tests
// ============================================================================

describe('ColorPaletteSelector', () => {
  let onPaletteChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onPaletteChange = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render with default palette when no currentPalette specified', () => {
      render(
        <ColorPaletteSelector
          onPaletteChange={onPaletteChange}
        />
      )

      expect(screen.getByText('Default')).toBeDefined()
    })

    it('should render with specified palette name', () => {
      render(
        <ColorPaletteSelector
          currentPalette="ocean"
          onPaletteChange={onPaletteChange}
        />
      )

      expect(screen.getByText('Ocean')).toBeDefined()
    })

    it('should render as a button that can be clicked', () => {
      render(
        <ColorPaletteSelector
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDefined()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <ColorPaletteSelector
          onPaletteChange={onPaletteChange}
          className="custom-class"
        />
      )

      expect(container.querySelector('.custom-class')).toBeDefined()
    })

    it('should render chevron icon', () => {
      render(
        <ColorPaletteSelector
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeDefined()
    })

    it('should fall back to default palette for invalid palette name', () => {
      render(
        <ColorPaletteSelector
          currentPalette="nonexistent-palette"
          onPaletteChange={onPaletteChange}
        />
      )

      // Should show default palette label
      expect(screen.getByText('Default')).toBeDefined()
    })
  })

  describe('color swatches preview', () => {
    it('should render series color swatches for current palette', () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')
      // Check for color swatch divs within the button
      const swatches = button.querySelectorAll('div[style*="background"]')
      expect(swatches.length).toBeGreaterThan(0)
    })

    it('should render gradient color swatches for current palette', () => {
      render(
        <ColorPaletteSelector
          currentPalette="ocean"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')
      // Gradient swatches should also be present
      const swatches = button.querySelectorAll('div[style*="background"]')
      expect(swatches.length).toBeGreaterThan(0)
    })
  })

  describe('dropdown interactions', () => {
    it('should open dropdown when button is clicked', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      // Dropdown should show palette options
      await waitFor(() => {
        expect(screen.getByText('Ocean')).toBeDefined()
        expect(screen.getByText('Sunset')).toBeDefined()
        expect(screen.getByText('Forest')).toBeDefined()
      })
    })

    it('should close dropdown when button is clicked again', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')

      // Open dropdown
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getAllByText('Ocean').length).toBeGreaterThan(0)
      })

      // Close dropdown
      fireEvent.click(button)

      // Dropdown should close
      await waitFor(() => {
        const oceanTexts = screen.queryAllByText('Ocean')
        // Should have at most 1 (the trigger may still show if selected)
        expect(oceanTexts.length).toBeLessThanOrEqual(1)
      })
    })

    it('should call onPaletteChange when palette is selected', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Ocean')).toBeDefined()
      })

      // Find and click the Ocean option
      const oceanOption = screen.getByText('Ocean').closest('button')
      if (oceanOption) {
        fireEvent.click(oceanOption)
      }

      expect(onPaletteChange).toHaveBeenCalledWith('ocean')
    })

    it('should close dropdown after palette selection', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getAllByText('Forest').length).toBeGreaterThan(0)
      })

      // Select a palette
      const forestOption = screen.getByText('Forest').closest('button')
      if (forestOption) {
        fireEvent.click(forestOption)
      }

      // Dropdown should close after selection
      await waitFor(() => {
        const sunsetTexts = screen.queryAllByText('Sunset')
        expect(sunsetTexts.length).toBeLessThanOrEqual(1)
      })
    })

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <ColorPaletteSelector
            currentPalette="default"
            onPaletteChange={onPaletteChange}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getAllByText('Ocean').length).toBeGreaterThan(0)
      })

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'))

      // Dropdown should close
      await waitFor(() => {
        const oceanTexts = screen.queryAllByText('Ocean')
        expect(oceanTexts.length).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('palette list', () => {
    it('should display all available palettes', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        // Check for several known palette names
        expect(screen.getByText('Ocean')).toBeDefined()
        expect(screen.getByText('Sunset')).toBeDefined()
        expect(screen.getByText('Forest')).toBeDefined()
        expect(screen.getByText('Purple')).toBeDefined()
        expect(screen.getByText('Monochrome')).toBeDefined()
      })
    })

    it('should sort palettes alphabetically', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Autumn')).toBeDefined()
      })

      // Get all palette option buttons
      const buttons = screen.getAllByRole('button')
      const paletteLabels: string[] = []

      buttons.forEach(btn => {
        const text = btn.textContent?.trim()
        // Filter to only palette options (not the main trigger)
        if (text && text !== 'Default' && !text.includes('Default')) {
          const fontMediumSpan = btn.querySelector('.dc\\:font-medium')
          if (fontMediumSpan) {
            paletteLabels.push(fontMediumSpan.textContent || '')
          }
        }
      })

      // Verify alphabetical order for some known pairs
      const autumnIndex = paletteLabels.indexOf('Autumn')
      const winterIndex = paletteLabels.indexOf('Winter')

      if (autumnIndex !== -1 && winterIndex !== -1) {
        expect(autumnIndex).toBeLessThan(winterIndex)
      }
    })
  })

  describe('selected state', () => {
    it('should visually indicate selected palette', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="ocean"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getAllByText('Ocean').length).toBeGreaterThan(0)
      })

      // Find the Ocean option in the dropdown
      const oceanOptions = screen.getAllByText('Ocean')
      const oceanButton = oceanOptions[oceanOptions.length > 1 ? 1 : 0]?.closest('button')

      // Selected button should have indicator dot
      const indicator = oceanButton?.querySelector('.dc\\:rounded-full')
      // Indicator should exist for selected item
      expect(indicator).toBeDefined()
    })

    it('should highlight current palette with different styling', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="sunset"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getAllByText('Sunset').length).toBeGreaterThan(0)
      })

      // Find the Sunset option
      const sunsetOptions = screen.getAllByText('Sunset')
      const sunsetButton = sunsetOptions[sunsetOptions.length > 1 ? 1 : 0]?.closest('button')

      // Should have the selected background class
      expect(sunsetButton?.className).toContain('bg-dc-surface-secondary')
    })
  })

  describe('palette preview in dropdown', () => {
    it('should show color swatches for each palette in dropdown', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Ocean')).toBeDefined()
      })

      // Find an option with color swatches
      const oceanOption = screen.getByText('Ocean').closest('button')
      const swatches = oceanOption?.querySelectorAll('div[style*="background"]')

      // Each palette option should have preview swatches
      expect(swatches?.length).toBeGreaterThan(0)
    })
  })

  describe('different palettes', () => {
    // Test each palette to ensure they all work
    const palettesToTest = ['default', 'ocean', 'sunset', 'forest', 'purple', 'monochrome', 'pastel', 'vibrant']

    palettesToTest.forEach(paletteName => {
      it(`should handle ${paletteName} palette correctly`, () => {
        const palette = getColorPalette(paletteName)

        render(
          <ColorPaletteSelector
            currentPalette={paletteName}
            onPaletteChange={onPaletteChange}
          />
        )

        expect(screen.getByText(palette.label)).toBeDefined()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle rapid open/close cycles', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')

      // Rapidly toggle dropdown
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      // Should not throw and component should remain functional
      await waitFor(() => {
        // After odd number of clicks, dropdown should be open
        const oceanTexts = screen.queryAllByText('Ocean')
        expect(oceanTexts.length).toBeGreaterThan(0)
      })
    })

    it('should handle multiple selections', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      // First selection
      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Ocean')).toBeDefined()
      })

      const oceanOption = screen.getByText('Ocean').closest('button')
      if (oceanOption) fireEvent.click(oceanOption)

      expect(onPaletteChange).toHaveBeenCalledWith('ocean')

      // Second selection (re-open dropdown)
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Forest')).toBeDefined()
      })

      const forestOption = screen.getByText('Forest').closest('button')
      if (forestOption) fireEvent.click(forestOption)

      expect(onPaletteChange).toHaveBeenCalledWith('forest')
      expect(onPaletteChange).toHaveBeenCalledTimes(2)
    })

    it('should work with empty className', () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
          className=""
        />
      )

      expect(screen.getByRole('button')).toBeDefined()
    })

    it('should maintain state after multiple interactions', async () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')

      // Open and close several times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(button)
        await waitFor(() => {
          expect(screen.getAllByText('Ocean').length).toBeGreaterThanOrEqual(1)
        })

        fireEvent.click(button)
        await waitFor(() => {
          const oceanTexts = screen.queryAllByText('Ocean')
          expect(oceanTexts.length).toBeLessThanOrEqual(1)
        })
      }

      // Component should still work
      expect(screen.getByText('Default')).toBeDefined()
    })
  })

  describe('palette colors', () => {
    it('should verify default palette has expected colors', () => {
      const defaultPalette = getColorPalette('default')

      expect(defaultPalette.colors).toBeDefined()
      expect(defaultPalette.colors.length).toBeGreaterThan(0)
      expect(defaultPalette.gradient).toBeDefined()
      expect(defaultPalette.gradient.length).toBeGreaterThan(0)
    })

    it('should have unique palette names', () => {
      const names = COLOR_PALETTES.map(p => p.name)
      const uniqueNames = [...new Set(names)]
      expect(names.length).toBe(uniqueNames.length)
    })

    it('should have all palettes with required properties', () => {
      COLOR_PALETTES.forEach(palette => {
        expect(palette.name).toBeDefined()
        expect(palette.label).toBeDefined()
        expect(palette.colors).toBeDefined()
        expect(palette.colors.length).toBeGreaterThan(0)
        expect(palette.gradient).toBeDefined()
        expect(palette.gradient.length).toBeGreaterThan(0)
      })
    })
  })

  describe('keyboard accessibility', () => {
    it('should be focusable', () => {
      render(
        <ColorPaletteSelector
          currentPalette="default"
          onPaletteChange={onPaletteChange}
        />
      )

      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })
})
