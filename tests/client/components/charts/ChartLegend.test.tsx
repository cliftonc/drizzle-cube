/**
 * Tests for ChartLegend component
 *
 * Focus on legend visibility, mouse interaction callbacks,
 * and default styling configuration.
 *
 * ChartLegend is a thin wrapper around Recharts' Legend component
 * that provides consistent styling and visibility control.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Track Legend calls for assertions
let legendCalls: any[] = []

vi.mock('recharts', () => ({
  Legend: (props: any) => {
    legendCalls.push(props)
    return (
      <div
        data-testid="recharts-legend"
        data-icon-type={props.iconType}
        data-icon-size={props.iconSize}
        data-layout={props.layout}
        data-align={props.align}
        data-vertical-align={props.verticalAlign}
        style={props.wrapperStyle}
        onMouseEnter={() => props.onMouseEnter?.({}, 0)}
        onMouseLeave={() => props.onMouseLeave?.()}
      >
        Legend
      </div>
    )
  },
}))

// Import after mocking
import ChartLegend from '../../../../src/client/components/charts/ChartLegend'

// Helper to get last Legend call
function getLastLegendCall() {
  return legendCalls[legendCalls.length - 1]
}

describe('ChartLegend', () => {
  beforeEach(() => {
    legendCalls = []
  })

  describe('visibility', () => {
    it('should render legend by default', () => {
      render(<ChartLegend />)

      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument()
    })

    it('should render legend when showLegend is true', () => {
      render(<ChartLegend showLegend={true} />)

      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument()
    })

    it('should not render legend when showLegend is false', () => {
      render(<ChartLegend showLegend={false} />)

      expect(screen.queryByTestId('recharts-legend')).not.toBeInTheDocument()
    })

    it('should return null when showLegend is false', () => {
      const { container } = render(<ChartLegend showLegend={false} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('default styling', () => {
    it('should use rect icon type', () => {
      render(<ChartLegend />)

      const legend = screen.getByTestId('recharts-legend')
      expect(legend).toHaveAttribute('data-icon-type', 'rect')
    })

    it('should use icon size of 8', () => {
      render(<ChartLegend />)

      const legend = screen.getByTestId('recharts-legend')
      expect(legend).toHaveAttribute('data-icon-size', '8')
    })

    it('should use horizontal layout', () => {
      render(<ChartLegend />)

      const legend = screen.getByTestId('recharts-legend')
      expect(legend).toHaveAttribute('data-layout', 'horizontal')
    })

    it('should be center aligned', () => {
      render(<ChartLegend />)

      const legend = screen.getByTestId('recharts-legend')
      expect(legend).toHaveAttribute('data-align', 'center')
    })

    it('should be positioned at bottom', () => {
      render(<ChartLegend />)

      const legend = screen.getByTestId('recharts-legend')
      expect(legend).toHaveAttribute('data-vertical-align', 'bottom')
    })

    it('should have fontSize of 12px in wrapper style', () => {
      render(<ChartLegend />)

      const lastCall = getLastLegendCall()
      expect(lastCall.wrapperStyle).toMatchObject({
        fontSize: '12px',
      })
    })

    it('should have paddingTop of 10px in wrapper style', () => {
      render(<ChartLegend />)

      const lastCall = getLastLegendCall()
      expect(lastCall.wrapperStyle).toMatchObject({
        paddingTop: '10px',
      })
    })
  })

  describe('mouse event callbacks', () => {
    it('should call onMouseEnter when provided', () => {
      const mockMouseEnter = vi.fn()
      render(<ChartLegend onMouseEnter={mockMouseEnter} />)

      const legend = screen.getByTestId('recharts-legend')
      fireEvent.mouseEnter(legend)

      expect(mockMouseEnter).toHaveBeenCalled()
    })

    it('should call onMouseLeave when provided', () => {
      const mockMouseLeave = vi.fn()
      render(<ChartLegend onMouseLeave={mockMouseLeave} />)

      const legend = screen.getByTestId('recharts-legend')
      fireEvent.mouseLeave(legend)

      expect(mockMouseLeave).toHaveBeenCalled()
    })

    it('should pass onMouseEnter to Legend component', () => {
      const mockMouseEnter = vi.fn()
      render(<ChartLegend onMouseEnter={mockMouseEnter} />)

      const lastCall = getLastLegendCall()
      expect(lastCall.onMouseEnter).toBe(mockMouseEnter)
    })

    it('should pass onMouseLeave to Legend component', () => {
      const mockMouseLeave = vi.fn()
      render(<ChartLegend onMouseLeave={mockMouseLeave} />)

      const lastCall = getLastLegendCall()
      expect(lastCall.onMouseLeave).toBe(mockMouseLeave)
    })

    it('should handle undefined mouse callbacks', () => {
      render(<ChartLegend />)

      // Should not throw when callbacks are undefined
      const legend = screen.getByTestId('recharts-legend')
      expect(() => {
        fireEvent.mouseEnter(legend)
        fireEvent.mouseLeave(legend)
      }).not.toThrow()
    })

    it('should not call onMouseEnter when hidden', () => {
      const mockMouseEnter = vi.fn()
      render(<ChartLegend showLegend={false} onMouseEnter={mockMouseEnter} />)

      // Legend is not rendered, so callback should never be called
      expect(mockMouseEnter).not.toHaveBeenCalled()
    })
  })

  describe('Legend component props', () => {
    it('should pass all required props to Legend', () => {
      const mockMouseEnter = vi.fn()
      const mockMouseLeave = vi.fn()

      render(
        <ChartLegend
          onMouseEnter={mockMouseEnter}
          onMouseLeave={mockMouseLeave}
          showLegend={true}
        />
      )

      const lastCall = getLastLegendCall()
      expect(lastCall.wrapperStyle).toMatchObject({
        fontSize: '12px',
        paddingTop: '10px',
      })
      expect(lastCall.iconType).toBe('rect')
      expect(lastCall.iconSize).toBe(8)
      expect(lastCall.layout).toBe('horizontal')
      expect(lastCall.align).toBe('center')
      expect(lastCall.verticalAlign).toBe('bottom')
      expect(lastCall.onMouseEnter).toBe(mockMouseEnter)
      expect(lastCall.onMouseLeave).toBe(mockMouseLeave)
    })
  })

  describe('edge cases', () => {
    it('should handle multiple renders without issues', () => {
      const { rerender } = render(<ChartLegend showLegend={true} />)
      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument()

      rerender(<ChartLegend showLegend={false} />)
      expect(screen.queryByTestId('recharts-legend')).not.toBeInTheDocument()

      rerender(<ChartLegend showLegend={true} />)
      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument()
    })

    it('should handle callback changes on rerender', () => {
      const mockMouseEnter1 = vi.fn()
      const mockMouseEnter2 = vi.fn()

      const { rerender } = render(<ChartLegend onMouseEnter={mockMouseEnter1} />)

      // First callback is set
      expect(getLastLegendCall().onMouseEnter).toBe(mockMouseEnter1)

      // Change callback
      rerender(<ChartLegend onMouseEnter={mockMouseEnter2} />)

      // Second callback is set
      expect(getLastLegendCall().onMouseEnter).toBe(mockMouseEnter2)
    })

    it('should work with null callbacks', () => {
      render(
        <ChartLegend
          onMouseEnter={null as unknown as undefined}
          onMouseLeave={null as unknown as undefined}
        />
      )

      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument()
    })
  })

  describe('integration with chart context', () => {
    it('should render when used in a typical chart setup', () => {
      // Simulate how ChartLegend would be used inside a chart
      const ChartWrapper = () => (
        <div data-testid="chart-wrapper">
          <svg width={400} height={300}>
            {/* Chart content would go here */}
          </svg>
          <ChartLegend showLegend={true} />
        </div>
      )

      render(<ChartWrapper />)

      expect(screen.getByTestId('chart-wrapper')).toBeInTheDocument()
      expect(screen.getByTestId('recharts-legend')).toBeInTheDocument()
    })

    it('should support series highlighting pattern', () => {
      // Common pattern: highlight series on legend hover
      let highlightedSeries: string | null = null

      const handleMouseEnter = (o: any) => {
        highlightedSeries = o?.dataKey || null
      }

      const handleMouseLeave = () => {
        highlightedSeries = null
      }

      render(
        <ChartLegend
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )

      // Simulate hover
      const legend = screen.getByTestId('recharts-legend')
      fireEvent.mouseEnter(legend)

      // Check that callbacks work in this pattern
      const lastCall = getLastLegendCall()
      expect(typeof lastCall.onMouseEnter).toBe('function')
      expect(typeof lastCall.onMouseLeave).toBe('function')
    })
  })
})
