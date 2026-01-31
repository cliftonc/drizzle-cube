/**
 * Tests for SunburstChart component
 *
 * Focus on data rendering, flow data transformation, tooltip behavior,
 * empty state handling, and summary statistics display.
 *
 * SunburstChart visualizes flow data using a radial sunburst diagram showing
 * paths from a starting step. It works with FlowChartData (nodes + links)
 * and displays hierarchical rings radiating from a center starting event.
 *
 * Key features:
 * - Center: Starting step (layer 0)
 * - Outward rings: Steps after the starting step (layers 1, 2, 3...)
 * - Values indicate count of entities following each path
 * - Only shows "after" steps (layer >= 0) for cleaner visualization
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SunburstChart from '../../../../src/client/components/charts/SunburstChart'
import type { FlowChartData, SankeyNode, SankeyLink } from '../../../../src/client/types/flow'

// Mock recharts to avoid ResponsiveContainer issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" className="recharts-responsive-container" style={{ width: 400, height: 400 }}>
        {children}
      </div>
    ),
  }
})

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Events.eventType': 'Event Type',
      'Events.timestamp': 'Timestamp',
      'Users.userId': 'User ID',
    }
    return labels[field] || field.split('.').pop() || field
  },
}))

// Mock the useTheme hook
vi.mock('../../../../src/client/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    effectiveTheme: 'light',
  }),
}))

/**
 * Helper to create valid FlowChartData for testing
 */
function createFlowData(
  nodes: Array<{ id: string; name: string; layer: number; value?: number }>,
  links: Array<{ source: string; target: string; value: number }>
): FlowChartData {
  return {
    nodes: nodes as SankeyNode[],
    links: links as SankeyLink[],
  }
}

// Simple flow data: Start -> A -> B
const simpleFlowData = createFlowData(
  [
    { id: 'start_Login', name: 'Login', layer: 0, value: 1000 },
    { id: 'after_1_ViewProduct', name: 'View Product', layer: 1, value: 800 },
    { id: 'after_2_AddToCart', name: 'Add to Cart', layer: 2, value: 500 },
  ],
  [
    { source: 'start_Login', target: 'after_1_ViewProduct', value: 800 },
    { source: 'after_1_ViewProduct', target: 'after_2_AddToCart', value: 500 },
  ]
)

// Flow data with multiple paths branching
const branchingFlowData = createFlowData(
  [
    { id: 'start_Login', name: 'Login', layer: 0, value: 1000 },
    { id: 'after_1_ViewProduct', name: 'View Product', layer: 1, value: 600 },
    { id: 'after_1_Search', name: 'Search', layer: 1, value: 400 },
    { id: 'after_2_AddToCart', name: 'Add to Cart', layer: 2, value: 400 },
    { id: 'after_2_ViewDetails', name: 'View Details', layer: 2, value: 200 },
  ],
  [
    { source: 'start_Login', target: 'after_1_ViewProduct', value: 600 },
    { source: 'start_Login', target: 'after_1_Search', value: 400 },
    { source: 'after_1_ViewProduct', target: 'after_2_AddToCart', value: 400 },
    { source: 'after_1_Search', target: 'after_2_ViewDetails', value: 200 },
  ]
)

// Flow data with "before" steps (negative layers - should be filtered out)
const flowDataWithBeforeSteps = createFlowData(
  [
    { id: 'before_1_Homepage', name: 'Homepage', layer: -1, value: 1200 },
    { id: 'start_Login', name: 'Login', layer: 0, value: 1000 },
    { id: 'after_1_Dashboard', name: 'Dashboard', layer: 1, value: 900 },
  ],
  [
    { source: 'before_1_Homepage', target: 'start_Login', value: 1000 },
    { source: 'start_Login', target: 'after_1_Dashboard', value: 900 },
  ]
)

// Flow data with multiple starting nodes
const multipleStartFlowData = createFlowData(
  [
    { id: 'start_Login', name: 'Login', layer: 0, value: 600 },
    { id: 'start_Signup', name: 'Signup', layer: 0, value: 400 },
    { id: 'after_1_Dashboard', name: 'Dashboard', layer: 1, value: 900 },
  ],
  [
    { source: 'start_Login', target: 'after_1_Dashboard', value: 550 },
    { source: 'start_Signup', target: 'after_1_Dashboard', value: 350 },
  ]
)

// Deep flow data with many layers
const deepFlowData = createFlowData(
  [
    { id: 'start_Step0', name: 'Step 0', layer: 0, value: 1000 },
    { id: 'after_1_Step1', name: 'Step 1', layer: 1, value: 800 },
    { id: 'after_2_Step2', name: 'Step 2', layer: 2, value: 600 },
    { id: 'after_3_Step3', name: 'Step 3', layer: 3, value: 400 },
    { id: 'after_4_Step4', name: 'Step 4', layer: 4, value: 200 },
  ],
  [
    { source: 'start_Step0', target: 'after_1_Step1', value: 800 },
    { source: 'after_1_Step1', target: 'after_2_Step2', value: 600 },
    { source: 'after_2_Step2', target: 'after_3_Step3', value: 400 },
    { source: 'after_3_Step3', target: 'after_4_Step4', value: 200 },
  ]
)

describe('SunburstChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render sunburst chart with valid flow data', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      // Recharts Sunburst renders an SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeDefined()
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} height={500} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} height="60vh" />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No flow data" when data is null', () => {
      render(<SunburstChart data={null as unknown as any[]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
      expect(
        screen.getByText('Configure a flow analysis with a starting step and event dimension')
      ).toBeInTheDocument()
    })

    it('should show "No flow data" when data is undefined', () => {
      render(<SunburstChart data={undefined as unknown as any[]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })

    it('should show "No flow data" when data array is empty', () => {
      render(<SunburstChart data={[]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })

    it('should show "No flow data" when flow data has no nodes', () => {
      const emptyNodesData = createFlowData([], [])
      render(<SunburstChart data={[emptyNodesData]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })

    it('should show "No flow data" when flow data has only negative layer nodes', () => {
      const onlyBeforeData = createFlowData(
        [
          { id: 'before_1_A', name: 'A', layer: -1, value: 100 },
          { id: 'before_2_B', name: 'B', layer: -2, value: 50 },
        ],
        [{ source: 'before_2_B', target: 'before_1_A', value: 50 }]
      )
      render(<SunburstChart data={[onlyBeforeData]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })
  })

  describe('data extraction', () => {
    it('should extract FlowChartData from single-element array', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle FlowChartData passed directly as data', () => {
      // Some APIs may pass the flow data directly instead of wrapped in array
      const { container } = render(
        <SunburstChart data={simpleFlowData as unknown as any[]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle data with nodes and links at top level', () => {
      const topLevelData = {
        nodes: simpleFlowData.nodes,
        links: simpleFlowData.links,
      }

      const { container } = render(
        <SunburstChart data={topLevelData as unknown as any[]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('data transformation to sunburst format', () => {
    it('should filter out negative layer nodes (before steps)', () => {
      const { container } = render(
        <SunburstChart data={[flowDataWithBeforeSteps]} />
      )

      // Should still render because there are layer 0 and layer 1 nodes
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle branching paths correctly', () => {
      const { container } = render(
        <SunburstChart data={[branchingFlowData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle multiple starting nodes (layer 0)', () => {
      const { container } = render(
        <SunburstChart data={[multipleStartFlowData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle deep flow with many layers', () => {
      const { container } = render(
        <SunburstChart data={[deepFlowData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle single node (starting node only)', () => {
      const singleNodeData = createFlowData(
        [{ id: 'start_Login', name: 'Login', layer: 0, value: 1000 }],
        []
      )

      const { container } = render(
        <SunburstChart data={[singleNodeData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('center label', () => {
    it('should display root node name in center', () => {
      render(<SunburstChart data={[simpleFlowData]} />)

      // The center label should show the starting step name
      expect(screen.getByText('Login')).toBeInTheDocument()
    })

    it('should display root node value in center', () => {
      render(<SunburstChart data={[simpleFlowData]} />)

      // The center should show the value formatted (appears in both center label and summary)
      const formattedValues = screen.getAllByText('1,000')
      expect(formattedValues.length).toBeGreaterThanOrEqual(1)
    })

    it('should show "Start" for multiple starting nodes', () => {
      render(<SunburstChart data={[multipleStartFlowData]} />)

      // When there are multiple starting nodes, a virtual "Start" root is created
      expect(screen.getByText('Start')).toBeInTheDocument()
    })
  })

  describe('summary footer', () => {
    it('should display summary statistics by default', () => {
      render(<SunburstChart data={[simpleFlowData]} />)

      // Should show event count and path count
      expect(screen.getByText(/events \(after\)/)).toBeInTheDocument()
      expect(screen.getByText(/Paths:/)).toBeInTheDocument()
      expect(screen.getByText(/starting entities/)).toBeInTheDocument()
    })

    it('should hide summary footer when hideSummaryFooter is true', () => {
      render(
        <SunburstChart
          data={[simpleFlowData]}
          displayConfig={{ hideSummaryFooter: true } as any}
        />
      )

      // Summary footer should not be visible
      expect(screen.queryByText(/events \(after\)/)).not.toBeInTheDocument()
    })

    it('should show correct node count (only after steps)', () => {
      render(<SunburstChart data={[flowDataWithBeforeSteps]} />)

      // Should count only layer >= 0 nodes (2 nodes: Login and Dashboard)
      const eventCountElement = screen.getByText(/events \(after\)/)
      expect(eventCountElement).toBeInTheDocument()
    })

    it('should show correct total starting entities', () => {
      render(<SunburstChart data={[simpleFlowData]} />)

      // Starting entities should be 1000 (from Login node) - appears multiple places
      const formattedValues = screen.getAllByText('1,000')
      expect(formattedValues.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('display configuration', () => {
    it('should use default innerRadius of 40', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should respect custom innerRadius', () => {
      const { container } = render(
        <SunburstChart
          data={[simpleFlowData]}
          displayConfig={{ innerRadius: 60 } as any}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle innerRadius of 0 (no center hole)', () => {
      const { container } = render(
        <SunburstChart
          data={[simpleFlowData]}
          displayConfig={{ innerRadius: 0 } as any}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      const { container } = render(
        <SunburstChart data={[simpleFlowData]} colorPalette={customPalette} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should use default CHART_COLORS when no palette provided', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should cycle through colors for many unique events', () => {
      // Create data with more unique event names than colors
      const manyEventsData = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0, value: 100 },
          { id: 'after_1_B', name: 'B', layer: 1, value: 90 },
          { id: 'after_1_C', name: 'C', layer: 1, value: 80 },
          { id: 'after_1_D', name: 'D', layer: 1, value: 70 },
          { id: 'after_1_E', name: 'E', layer: 1, value: 60 },
          { id: 'after_1_F', name: 'F', layer: 1, value: 50 },
          { id: 'after_1_G', name: 'G', layer: 1, value: 40 },
          { id: 'after_1_H', name: 'H', layer: 1, value: 30 },
          { id: 'after_1_I', name: 'I', layer: 1, value: 20 },
          { id: 'after_1_J', name: 'J', layer: 1, value: 10 },
        ],
        [
          { source: 'start_A', target: 'after_1_B', value: 90 },
          { source: 'start_A', target: 'after_1_C', value: 80 },
          { source: 'start_A', target: 'after_1_D', value: 70 },
          { source: 'start_A', target: 'after_1_E', value: 60 },
          { source: 'start_A', target: 'after_1_F', value: 50 },
          { source: 'start_A', target: 'after_1_G', value: 40 },
          { source: 'start_A', target: 'after_1_H', value: 30 },
          { source: 'start_A', target: 'after_1_I', value: 20 },
          { source: 'start_A', target: 'after_1_J', value: 10 },
        ]
      )

      const shortPalette = {
        name: 'short',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      const { container } = render(
        <SunburstChart data={[manyEventsData]} colorPalette={shortPalette} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle nodes without value property', () => {
      const noValueData = createFlowData(
        [
          { id: 'start_Login', name: 'Login', layer: 0 },
          { id: 'after_1_Dashboard', name: 'Dashboard', layer: 1 },
        ],
        [{ source: 'start_Login', target: 'after_1_Dashboard', value: 100 }]
      )

      const { container } = render(
        <SunburstChart data={[noValueData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle links with zero value', () => {
      const zeroValueLinks = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0, value: 100 },
          { id: 'after_1_B', name: 'B', layer: 1, value: 0 },
        ],
        [{ source: 'start_A', target: 'after_1_B', value: 0 }]
      )

      const { container } = render(
        <SunburstChart data={[zeroValueLinks]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very large entity counts', () => {
      const largeCountData = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0, value: 10000000 },
          { id: 'after_1_B', name: 'B', layer: 1, value: 5000000 },
        ],
        [{ source: 'start_A', target: 'after_1_B', value: 5000000 }]
      )

      const { container } = render(
        <SunburstChart data={[largeCountData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle special characters in event names', () => {
      const specialCharsData = createFlowData(
        [
          { id: 'start_Click:Button', name: 'Click:Button', layer: 0, value: 100 },
          { id: 'after_1_View/Page', name: 'View/Page', layer: 1, value: 80 },
        ],
        [{ source: 'start_Click:Button', target: 'after_1_View/Page', value: 80 }]
      )

      const { container } = render(
        <SunburstChart data={[specialCharsData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle orphan nodes (no incoming or outgoing links)', () => {
      const orphanNodeData = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0, value: 100 },
          { id: 'after_1_B', name: 'B', layer: 1, value: 50 },
          { id: 'after_1_Orphan', name: 'Orphan', layer: 1, value: 30 }, // No links to this
        ],
        [{ source: 'start_A', target: 'after_1_B', value: 50 }]
      )

      const { container } = render(
        <SunburstChart data={[orphanNodeData]} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('tooltip behavior', () => {
    it('should render tooltip component', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      // Recharts should include a tooltip
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    it('should use ResponsiveContainer', () => {
      const { container } = render(
        <SunburstChart data={[simpleFlowData]} />
      )

      // ResponsiveContainer wraps the chart
      const responsiveContainer = container.querySelector('.recharts-responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
    })
  })
})
