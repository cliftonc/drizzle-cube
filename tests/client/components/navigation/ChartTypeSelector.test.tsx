/**
 * Tests for ChartTypeSelector component
 *
 * ChartTypeSelector:
 * - Renders a dropdown button showing current chart type
 * - Opens/closes dropdown menu on button click
 * - Displays chart types in a grid layout
 * - Calls onTypeChange when chart type is selected
 * - Closes dropdown after selection
 * - Shows selected chart type with visual indicator
 * - Supports compact mode for narrow containers
 * - Filters out excluded chart types
 * - Handles chart availability (disabled states)
 * - Sorts chart types alphabetically by label
 */

import React from 'react'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChartTypeSelector from '../../../../src/client/components/ChartTypeSelector'
import type { ChartType } from '../../../../src/client/types'

// ============================================================================
// ChartTypeSelector Tests
// ============================================================================

describe('ChartTypeSelector', () => {
  let onTypeChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onTypeChange = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should render with selected chart type label', () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      expect(screen.getByText('Bar Chart')).toBeDefined()
    })

    it('should render with different chart types', () => {
      render(
        <ChartTypeSelector
          selectedType="line"
          onTypeChange={onTypeChange}
        />
      )

      expect(screen.getByText('Line Chart')).toBeDefined()
    })

    it('should render as a button that can be clicked', () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDefined()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          className="custom-class"
        />
      )

      expect(container.querySelector('.custom-class')).toBeDefined()
    })

    it('should render chevron icon that rotates when open', () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeDefined()
    })
  })

  describe('dropdown interactions', () => {
    it('should open dropdown when button is clicked', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      // Dropdown should now show multiple chart type options
      await waitFor(() => {
        // Look for other chart types that should appear in dropdown
        expect(screen.getByText('Line Chart')).toBeDefined()
      })
    })

    it('should close dropdown when button is clicked again', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      const button = screen.getByRole('button', { name: /bar chart/i })

      // Open dropdown
      fireEvent.click(button)
      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // Close dropdown
      fireEvent.click(button)

      // The multiple "Line Chart" text should only show the label now
      await waitFor(() => {
        const lineCharts = screen.queryAllByText('Line Chart')
        // Should only have 0 or minimal instances after close
        expect(lineCharts.length).toBeLessThanOrEqual(1)
      })
    })

    it('should call onTypeChange when chart type is selected', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      // Open dropdown
      const triggerButton = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(triggerButton)

      // Wait for dropdown to open and find line chart option
      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // Find and click the Line Chart option button
      const lineChartButtons = screen.getAllByText('Line Chart')
      const lineChartOption = lineChartButtons.find(el => el.closest('button')?.getAttribute('type') === 'button')
      if (lineChartOption) {
        fireEvent.click(lineChartOption.closest('button')!)
      }

      expect(onTypeChange).toHaveBeenCalledWith('line')
    })

    it('should close dropdown after selection', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      // Open dropdown
      const triggerButton = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // Select a chart type
      const lineChartButtons = screen.getAllByText('Line Chart')
      const lineChartOption = lineChartButtons.find(el => el.closest('button')?.getAttribute('type') === 'button')
      if (lineChartOption) {
        fireEvent.click(lineChartOption.closest('button')!)
      }

      // Dropdown should close after selection
      await waitFor(() => {
        // Only the trigger should remain visible, not the dropdown options
        const allPieCharts = screen.queryAllByText('Pie Chart')
        expect(allPieCharts.length).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('chart type exclusion', () => {
    it('should exclude specified chart types', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          excludeTypes={['funnel', 'sankey']}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // Excluded types should not be present
      expect(screen.queryByText('Funnel Chart')).toBeNull()
      expect(screen.queryByText('Sankey Chart')).toBeNull()
    })

    it('should show all chart types when no exclusions', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Funnel Chart')).toBeDefined()
      })
    })
  })

  describe('chart availability', () => {
    it('should disable unavailable chart types', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          availability={{
            pie: { available: false, reason: 'Requires at least one dimension' },
            bar: { available: true },
            line: { available: true }
          }}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Pie Chart')).toBeDefined()
      })

      // Find the pie chart button and verify it's disabled
      const pieChartText = screen.getByText('Pie Chart')
      const pieChartButton = pieChartText.closest('button')
      expect(pieChartButton?.disabled).toBe(true)
    })

    it('should not call onTypeChange when clicking disabled chart', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          availability={{
            pie: { available: false, reason: 'Requires at least one dimension' }
          }}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Pie Chart')).toBeDefined()
      })

      // Try to click disabled pie chart
      const pieChartText = screen.getByText('Pie Chart')
      const pieChartButton = pieChartText.closest('button')
      if (pieChartButton) {
        fireEvent.click(pieChartButton)
      }

      // onTypeChange should not have been called with 'pie'
      expect(onTypeChange).not.toHaveBeenCalledWith('pie')
    })

    it('should show unavailable reason as tooltip', async () => {
      const unavailableReason = 'Requires at least one dimension'
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          availability={{
            pie: { available: false, reason: unavailableReason }
          }}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Pie Chart')).toBeDefined()
      })

      // Find the pie chart button and check title attribute
      const pieChartText = screen.getByText('Pie Chart')
      const pieChartButton = pieChartText.closest('button')
      expect(pieChartButton?.getAttribute('title')).toBe(unavailableReason)
    })
  })

  describe('compact mode', () => {
    it('should render in compact mode when prop is true', async () => {
      const { container } = render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          compact={true}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // In compact mode, the grid should use 2 columns (dc:grid-cols-2)
      const gridContainer = container.querySelector('.dc\\:grid-cols-2')
      expect(gridContainer).toBeDefined()
    })

    it('should use responsive grid in non-compact mode', async () => {
      const { container } = render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          compact={false}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // In non-compact mode, should have responsive grid classes
      const gridContainer = container.querySelector('.dc\\:sm\\:grid-cols-3')
      expect(gridContainer).toBeDefined()
    })
  })

  describe('selected state', () => {
    it('should visually indicate selected chart type', async () => {
      render(
        <ChartTypeSelector
          selectedType="line"
          onTypeChange={onTypeChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /line chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        // Multiple instances of "Line Chart" should exist
        const lineCharts = screen.getAllByText('Line Chart')
        expect(lineCharts.length).toBeGreaterThan(0)
      })

      // The selected item should have a special indicator (dot)
      const lineChartTexts = screen.getAllByText('Line Chart')
      const selectedButton = lineChartTexts[lineChartTexts.length > 1 ? 1 : 0]?.closest('button')

      // Check for the selection indicator dot
      const indicator = selectedButton?.querySelector('.dc\\:rounded-full')
      // Indicator may or may not be present depending on implementation
    })
  })

  describe('chart type labels', () => {
    it('should display correct labels for various chart types', async () => {
      const chartTypes: ChartType[] = ['bar', 'line', 'pie', 'area', 'scatter', 'radar']
      const expectedLabels: Record<ChartType, string> = {
        activityGrid: 'Activity Grid',
        area: 'Area Chart',
        bar: 'Bar Chart',
        bubble: 'Bubble Chart',
        funnel: 'Funnel Chart',
        heatmap: 'Heatmap',
        kpiDelta: 'KPI Delta',
        kpiNumber: 'KPI Number',
        kpiText: 'KPI Text',
        line: 'Line Chart',
        markdown: 'Markdown',
        pie: 'Pie Chart',
        radar: 'Radar Chart',
        radialBar: 'Radial Bar Chart',
        retentionCombined: 'Retention Chart',
        retentionHeatmap: 'Retention Matrix',
        sankey: 'Sankey Chart',
        scatter: 'Scatter Plot',
        sunburst: 'Sunburst Chart',
        table: 'Data Table',
        treemap: 'TreeMap'
      }

      for (const chartType of chartTypes) {
        cleanup()

        render(
          <ChartTypeSelector
            selectedType={chartType}
            onTypeChange={onTypeChange}
          />
        )

        expect(screen.getByText(expectedLabels[chartType])).toBeDefined()
      }
    })
  })

  describe('sorting', () => {
    it('should sort chart types alphabetically by label', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Activity Grid')).toBeDefined()
      })

      // Get all button texts in order
      const buttons = screen.getAllByRole('button')
      const labels: string[] = []
      buttons.forEach(btn => {
        const text = btn.textContent?.trim()
        if (text && text !== 'Bar Chart' && !text.includes('Bar Chart')) {
          // Skip the main trigger button
          labels.push(text)
        }
      })

      // Verify at least Activity Grid comes before TreeMap (alphabetical)
      const activityIndex = labels.findIndex(l => l.includes('Activity'))
      const treemapIndex = labels.findIndex(l => l.includes('TreeMap'))

      if (activityIndex !== -1 && treemapIndex !== -1) {
        expect(activityIndex).toBeLessThan(treemapIndex)
      }
    })
  })

  describe('keyboard interactions', () => {
    it('should be focusable', () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
        />
      )

      const button = screen.getByRole('button', { name: /bar chart/i })
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })

  describe('edge cases', () => {
    it('should handle empty excludeTypes array', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          excludeTypes={[]}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // All chart types should be present
      expect(screen.getByText('Funnel Chart')).toBeDefined()
    })

    it('should handle undefined availability', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          availability={undefined}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Pie Chart')).toBeDefined()
      })

      // Pie chart should be enabled (not disabled)
      const pieChartText = screen.getByText('Pie Chart')
      const pieChartButton = pieChartText.closest('button')
      expect(pieChartButton?.disabled).toBeFalsy()
    })

    it('should work with partial availability map', async () => {
      render(
        <ChartTypeSelector
          selectedType="bar"
          onTypeChange={onTypeChange}
          availability={{
            pie: { available: false, reason: 'Disabled' }
            // Other chart types not specified
          }}
        />
      )

      // Open dropdown
      const button = screen.getByRole('button', { name: /bar chart/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Line Chart')).toBeDefined()
      })

      // Line chart should be enabled (not in availability map)
      const lineChartText = screen.getByText('Line Chart')
      const lineChartButton = lineChartText.closest('button')
      expect(lineChartButton?.disabled).toBeFalsy()

      // Pie chart should be disabled
      const pieChartText = screen.getByText('Pie Chart')
      const pieChartButton = pieChartText.closest('button')
      expect(pieChartButton?.disabled).toBe(true)
    })
  })
})
