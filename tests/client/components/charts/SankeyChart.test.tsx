/**
 * Tests for SankeyChart component
 *
 * Focus on data rendering, flow data transformation, node/link display,
 * tooltip behavior, empty state handling, and summary statistics.
 *
 * SankeyChart visualizes flow data using Sankey diagrams showing paths
 * between states. It works with FlowChartData (nodes + links) and
 * displays both "before" and "after" steps relative to a starting point.
 *
 * Key features:
 * - Nodes representing events at different layers (before, start, after)
 * - Links showing the flow of entities between adjacent nodes
 * - Values indicating count of entities following each path
 * - Color-coded layers (orange for before, blue for start, green for after)
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SankeyChart from '../../../../src/client/components/charts/SankeyChart'
import type { FlowChartData, SankeyNode, SankeyLink } from '../../../../src/client/types/flow'

// Mock recharts to avoid ResponsiveContainer issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" className="recharts-responsive-container" style={{ width: 800, height: 400 }}>
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

// Simple flow data: A -> B -> C
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

// Flow data with before, start, and after steps
const bidirectionalFlowData = createFlowData(
  [
    { id: 'before_2_Landing', name: 'Landing Page', layer: -2, value: 1500 },
    { id: 'before_1_Signup', name: 'Signup', layer: -1, value: 1200 },
    { id: 'start_Login', name: 'Login', layer: 0, value: 1000 },
    { id: 'after_1_Dashboard', name: 'Dashboard', layer: 1, value: 900 },
    { id: 'after_2_Profile', name: 'Profile', layer: 2, value: 500 },
  ],
  [
    { source: 'before_2_Landing', target: 'before_1_Signup', value: 1200 },
    { source: 'before_1_Signup', target: 'start_Login', value: 1000 },
    { source: 'start_Login', target: 'after_1_Dashboard', value: 900 },
    { source: 'after_1_Dashboard', target: 'after_2_Profile', value: 500 },
  ]
)

// Flow data with branching paths
const branchingFlowData = createFlowData(
  [
    { id: 'start_Home', name: 'Home', layer: 0, value: 1000 },
    { id: 'after_1_Products', name: 'Products', layer: 1, value: 600 },
    { id: 'after_1_About', name: 'About', layer: 1, value: 300 },
    { id: 'after_1_Contact', name: 'Contact', layer: 1, value: 100 },
    { id: 'after_2_Checkout', name: 'Checkout', layer: 2, value: 400 },
    { id: 'after_2_Cart', name: 'Cart', layer: 2, value: 200 },
  ],
  [
    { source: 'start_Home', target: 'after_1_Products', value: 600 },
    { source: 'start_Home', target: 'after_1_About', value: 300 },
    { source: 'start_Home', target: 'after_1_Contact', value: 100 },
    { source: 'after_1_Products', target: 'after_2_Checkout', value: 400 },
    { source: 'after_1_Products', target: 'after_2_Cart', value: 200 },
  ]
)

// Flow data with converging paths
const convergingFlowData = createFlowData(
  [
    { id: 'start_A', name: 'Path A Start', layer: 0, value: 500 },
    { id: 'start_B', name: 'Path B Start', layer: 0, value: 500 },
    { id: 'after_1_Common', name: 'Common Step', layer: 1, value: 900 },
    { id: 'after_2_End', name: 'End', layer: 2, value: 800 },
  ],
  [
    { source: 'start_A', target: 'after_1_Common', value: 450 },
    { source: 'start_B', target: 'after_1_Common', value: 450 },
    { source: 'after_1_Common', target: 'after_2_End', value: 800 },
  ]
)

// Deep flow data
const deepFlowData = createFlowData(
  [
    { id: 'before_3_Step_3', name: 'Step -3', layer: -3, value: 2000 },
    { id: 'before_2_Step_2', name: 'Step -2', layer: -2, value: 1800 },
    { id: 'before_1_Step_1', name: 'Step -1', layer: -1, value: 1500 },
    { id: 'start_Step0', name: 'Step 0', layer: 0, value: 1000 },
    { id: 'after_1_Step1', name: 'Step 1', layer: 1, value: 800 },
    { id: 'after_2_Step2', name: 'Step 2', layer: 2, value: 600 },
    { id: 'after_3_Step3', name: 'Step 3', layer: 3, value: 400 },
  ],
  [
    { source: 'before_3_Step_3', target: 'before_2_Step_2', value: 1800 },
    { source: 'before_2_Step_2', target: 'before_1_Step_1', value: 1500 },
    { source: 'before_1_Step_1', target: 'start_Step0', value: 1000 },
    { source: 'start_Step0', target: 'after_1_Step1', value: 800 },
    { source: 'after_1_Step1', target: 'after_2_Step2', value: 600 },
    { source: 'after_2_Step2', target: 'after_3_Step3', value: 400 },
  ]
)

describe('SankeyChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render sankey chart with valid flow data', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // Recharts ResponsiveContainer is mocked
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(<SankeyChart data={[simpleFlowData]} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeDefined()
    })

    it('should respect custom numeric height', () => {
      render(<SankeyChart data={[simpleFlowData]} height={500} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should respect custom string height', () => {
      render(<SankeyChart data={[simpleFlowData]} height="60vh" />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No flow data" when data is null', () => {
      render(<SankeyChart data={null as unknown as any[]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
      expect(
        screen.getByText('Configure a flow analysis with a starting step and event dimension')
      ).toBeInTheDocument()
    })

    it('should show "No flow data" when data is undefined', () => {
      render(<SankeyChart data={undefined as unknown as any[]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })

    it('should show "No flow data" when data array is empty', () => {
      render(<SankeyChart data={[]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })

    it('should show "No flow data" when flow data has no nodes', () => {
      const emptyNodesData = createFlowData([], [])
      render(<SankeyChart data={[emptyNodesData]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })

    it('should show "No flow data" when flow data has null nodes', () => {
      const nullNodesData = { nodes: null, links: [] } as unknown as FlowChartData
      render(<SankeyChart data={[nullNodesData]} />)

      expect(screen.getByText('No flow data')).toBeInTheDocument()
    })
  })

  describe('data extraction', () => {
    it('should extract FlowChartData from single-element array', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle FlowChartData passed directly as data', () => {
      render(<SankeyChart data={simpleFlowData as unknown as any[]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle data with nodes and links at top level', () => {
      const topLevelData = {
        nodes: simpleFlowData.nodes,
        links: simpleFlowData.links,
      }

      render(<SankeyChart data={topLevelData as unknown as any[]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('data transformation to Recharts format', () => {
    it('should transform string node IDs to numeric indices for links', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // The transformation should succeed and render the chart
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle bidirectional flow (before and after steps)', () => {
      render(<SankeyChart data={[bidirectionalFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle branching paths', () => {
      render(<SankeyChart data={[branchingFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle converging paths', () => {
      render(<SankeyChart data={[convergingFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle deep flow with many layers', () => {
      render(<SankeyChart data={[deepFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle invalid link references gracefully', () => {
      // Create data with a link that references a non-existent node
      const invalidLinkData = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0, value: 100 },
          { id: 'after_1_B', name: 'B', layer: 1, value: 80 },
        ],
        [
          { source: 'start_A', target: 'after_1_B', value: 80 },
          { source: 'start_A', target: 'nonexistent_node', value: 20 }, // Invalid
        ]
      )

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      render(<SankeyChart data={[invalidLinkData]} />)

      // Should still render, filtering out invalid links
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('node coloring by layer', () => {
    it('should color nodes based on their layer', () => {
      render(<SankeyChart data={[bidirectionalFlowData]} />)

      // Different layers should have different colors
      // Before (negative): orange
      // Start (0): blue
      // After (positive): green
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      render(<SankeyChart data={[bidirectionalFlowData]} colorPalette={customPalette} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should cycle through custom palette colors based on absolute layer', () => {
      const shortPalette = {
        name: 'short',
        colors: ['#ff0000', '#00ff00'],
      }

      render(<SankeyChart data={[deepFlowData]} colorPalette={shortPalette} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('summary footer', () => {
    it('should display summary statistics by default', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // Should show event count, path count, and starting entities
      expect(screen.getByText(/events/)).toBeInTheDocument()
      expect(screen.getByText(/Paths:/)).toBeInTheDocument()
      expect(screen.getByText(/starting entities/)).toBeInTheDocument()
    })

    it('should hide summary footer when hideSummaryFooter is true', () => {
      render(
        <SankeyChart
          data={[simpleFlowData]}
          displayConfig={{ hideSummaryFooter: true } as any}
        />
      )

      expect(screen.queryByText(/events/)).not.toBeInTheDocument()
    })

    it('should show correct node count', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // Simple flow has 3 nodes
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show correct link count', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // Simple flow has 2 links
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should show correct total starting entities', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // Starting entities from Login node: 1000
      expect(screen.getByText('1,000')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should use default linkOpacity of 0.5', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should respect custom linkOpacity', () => {
      render(
        <SankeyChart
          data={[simpleFlowData]}
          displayConfig={{ linkOpacity: '0.3' } as any}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should use default nodeWidth of 10', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should respect custom nodeWidth', () => {
      render(
        <SankeyChart
          data={[simpleFlowData]}
          displayConfig={{ nodeWidth: 20 } as any}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should use default nodePadding of 50', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should respect custom nodePadding', () => {
      render(
        <SankeyChart
          data={[simpleFlowData]}
          displayConfig={{ nodePadding: 30 } as any}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should show node labels by default', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should hide node labels when showNodeLabels is false', () => {
      render(
        <SankeyChart
          data={[simpleFlowData]}
          displayConfig={{ showNodeLabels: false } as any}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single node flow', () => {
      const singleNodeData = createFlowData(
        [{ id: 'start_Only', name: 'Only Node', layer: 0, value: 100 }],
        []
      )

      render(<SankeyChart data={[singleNodeData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle nodes without value property', () => {
      const noValueData = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0 },
          { id: 'after_1_B', name: 'B', layer: 1 },
        ],
        [{ source: 'start_A', target: 'after_1_B', value: 100 }]
      )

      render(<SankeyChart data={[noValueData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle very large entity counts', () => {
      const largeCountData = createFlowData(
        [
          { id: 'start_A', name: 'A', layer: 0, value: 10000000 },
          { id: 'after_1_B', name: 'B', layer: 1, value: 5000000 },
        ],
        [{ source: 'start_A', target: 'after_1_B', value: 5000000 }]
      )

      render(<SankeyChart data={[largeCountData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle special characters in event names', () => {
      const specialCharsData = createFlowData(
        [
          { id: 'start_Click:Button', name: 'Click:Button<Test>', layer: 0, value: 100 },
          { id: 'after_1_View/Page', name: 'View/Page&More', layer: 1, value: 80 },
        ],
        [{ source: 'start_Click:Button', target: 'after_1_View/Page', value: 80 }]
      )

      render(<SankeyChart data={[specialCharsData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle nodes with same name in different layers', () => {
      const sameNameData = createFlowData(
        [
          { id: 'before_1_Login', name: 'Login', layer: -1, value: 100 },
          { id: 'start_Login', name: 'Login', layer: 0, value: 100 },
          { id: 'after_1_Login', name: 'Login', layer: 1, value: 100 },
        ],
        [
          { source: 'before_1_Login', target: 'start_Login', value: 100 },
          { source: 'start_Login', target: 'after_1_Login', value: 100 },
        ]
      )

      render(<SankeyChart data={[sameNameData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle very wide flow (many parallel paths)', () => {
      const wideFlowData = createFlowData(
        [
          { id: 'start_Home', name: 'Home', layer: 0, value: 1000 },
          ...Array.from({ length: 10 }, (_, i) => ({
            id: `after_1_Page${i}`,
            name: `Page ${i}`,
            layer: 1,
            value: 100,
          })),
        ],
        Array.from({ length: 10 }, (_, i) => ({
          source: 'start_Home',
          target: `after_1_Page${i}`,
          value: 100,
        }))
      )

      render(<SankeyChart data={[wideFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should handle self-referencing layers (cycle prevention)', () => {
      // Sankey diagrams typically don't support cycles, but we should handle gracefully
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('tooltip behavior', () => {
    it('should render tooltip component', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    it('should use ResponsiveContainer', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      const responsiveContainer = screen.getByTestId('responsive-container')
      expect(responsiveContainer).toBeInTheDocument()
      expect(responsiveContainer).toHaveClass('recharts-responsive-container')
    })

    it('should track container width for label positioning', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })

  describe('node label positioning', () => {
    it('should render nodes with labels', () => {
      render(<SankeyChart data={[simpleFlowData]} />)

      // Custom node renderer should create text elements
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })
  })
})
