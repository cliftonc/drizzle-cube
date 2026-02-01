import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisDisplayConfigPanel from '../../../../src/client/components/AnalysisBuilder/AnalysisDisplayConfigPanel'
import type { ChartType, ChartDisplayConfig, ColorPalette } from '../../../../src/client/types'

// Mock the useChartConfig hook
vi.mock('../../../../src/client/charts/lazyChartConfigRegistry', () => ({
  useChartConfig: vi.fn(),
}))

// Import after mock
import { useChartConfig } from '../../../../src/client/charts/lazyChartConfigRegistry'

// Mock AxisFormatControls
vi.mock('../../../../src/client/components/charts/AxisFormatControls', () => ({
  AxisFormatControls: ({ axisLabel, value, onChange }: any) => (
    <div data-testid={`axis-format-${axisLabel.toLowerCase().replace(/\s+/g, '-')}`}>
      <span>{axisLabel}</span>
      <button onClick={() => onChange({ unit: 'currency' })}>Change Format</button>
    </div>
  ),
}))

const mockedUseChartConfig = vi.mocked(useChartConfig)

describe('AnalysisDisplayConfigPanel', () => {
  const mockColorPalette: ColorPalette = {
    name: 'Default',
    colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'],
  }

  const defaultProps = {
    chartType: 'bar' as ChartType,
    displayConfig: {} as ChartDisplayConfig,
    colorPalette: mockColorPalette,
    onDisplayConfigChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation
    mockedUseChartConfig.mockReturnValue({
      config: {
        dropZones: [],
        displayOptions: ['showLegend', 'showGrid', 'showTooltip'],
        displayOptionsConfig: [],
      },
      loading: false,
      loaded: true,
    })
  })

  describe('loading state', () => {
    it('should show loading message when config is not loaded', () => {
      mockedUseChartConfig.mockReturnValue({
        config: { dropZones: [] },
        loading: true,
        loaded: false,
      })

      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Loading display options...')).toBeInTheDocument()
    })

    it('should not show loading message when config is loaded', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.queryByText('Loading display options...')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show message when no display options are available', () => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptions: [],
          displayOptionsConfig: [],
        },
        loading: false,
        loaded: true,
      })

      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('No display options available for this chart type.')).toBeInTheDocument()
    })

    it('should show message when displayOptions and displayOptionsConfig are both undefined', () => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
        },
        loading: false,
        loaded: true,
      })

      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('No display options available for this chart type.')).toBeInTheDocument()
    })
  })

  describe('boolean display options (legacy)', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'stacked', 'hideHeader'],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render Show Legend checkbox', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Show Legend')).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /show legend/i })).toBeInTheDocument()
    })

    it('should render Show Grid checkbox', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Show Grid')).toBeInTheDocument()
    })

    it('should render Show Tooltip checkbox', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Show Tooltip')).toBeInTheDocument()
    })

    it('should render Stacked checkbox', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Stacked')).toBeInTheDocument()
    })

    it('should render Hide Header checkbox', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Hide Header')).toBeInTheDocument()
    })

    it('should call onDisplayConfigChange when showLegend is toggled', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          displayConfig={{ showLegend: true }}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const checkbox = screen.getByRole('checkbox', { name: /show legend/i })
      await user.click(checkbox)

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ showLegend: false })
      )
    })

    it('should reflect current displayConfig values', () => {
      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          displayConfig={{ showLegend: true, showGrid: false }}
        />
      )

      const legendCheckbox = screen.getByRole('checkbox', { name: /show legend/i })
      const gridCheckbox = screen.getByRole('checkbox', { name: /show grid/i })

      expect(legendCheckbox).toBeChecked()
      expect(gridCheckbox).not.toBeChecked()
    })

    it('should use default value of true for showLegend when not specified', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /show legend/i })
      expect(checkbox).toBeChecked()
    })

    it('should use default value of false for stacked when not specified', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      const checkbox = screen.getByRole('checkbox', { name: /stacked/i })
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('structured display options - boolean type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'customOption',
              label: 'Custom Option',
              type: 'boolean',
              defaultValue: false,
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render boolean option as checkbox', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Custom Option')).toBeInTheDocument()
    })

    it('should call onDisplayConfigChange when boolean option is toggled', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ customOption: true })
      )
    })
  })

  describe('structured display options - string type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'title',
              label: 'Chart Title',
              type: 'string',
              placeholder: 'Enter title',
              description: 'Title shown above the chart',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render string option as text input', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Chart Title')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter title')).toBeInTheDocument()
    })

    it('should show description text', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Title shown above the chart')).toBeInTheDocument()
    })

    it('should call onDisplayConfigChange when string value changes', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const input = screen.getByPlaceholderText('Enter title')
      await user.type(input, 'My Chart')

      expect(onDisplayConfigChange).toHaveBeenCalled()
    })
  })

  describe('structured display options - content string (textarea)', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'content',
              label: 'Content',
              type: 'string',
              placeholder: 'Enter markdown content',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render content field as textarea', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Content')).toBeInTheDocument()
      // Content field uses textarea
      const textarea = screen.getByPlaceholderText('Enter markdown content')
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should show note about headers, lists and links', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('(only headers, lists and links)')).toBeInTheDocument()
    })
  })

  describe('structured display options - number type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'maxItems',
              label: 'Max Items',
              type: 'number',
              min: 1,
              max: 100,
              step: 1,
              defaultValue: 10,
              placeholder: 'Enter number',
              description: 'Maximum items to display',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render number option as number input', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Max Items')).toBeInTheDocument()
      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should have min, max, and step attributes', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveAttribute('min', '1')
      expect(input).toHaveAttribute('max', '100')
      expect(input).toHaveAttribute('step', '1')
    })

    it('should call onDisplayConfigChange when number value changes', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const input = screen.getByPlaceholderText('Enter number')
      await user.clear(input)
      await user.type(input, '50')

      expect(onDisplayConfigChange).toHaveBeenCalled()
    })
  })

  describe('structured display options - select type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'stackType',
              label: 'Stacking',
              type: 'select',
              defaultValue: 'none',
              options: [
                { value: 'none', label: 'None' },
                { value: 'normal', label: 'Stacked' },
                { value: 'percent', label: 'Stacked 100%' },
              ],
              description: 'How to stack multiple bar series',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render select option as dropdown', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Stacking')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render all options in dropdown', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveTextContent('None')
      expect(select).toHaveTextContent('Stacked')
      expect(select).toHaveTextContent('Stacked 100%')
    })

    it('should call onDisplayConfigChange when select value changes', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'normal')

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ stackType: 'normal' })
      )
    })
  })

  describe('structured display options - color type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'fillColor',
              label: 'Fill Color',
              type: 'color',
              defaultValue: '#8884d8',
              description: 'Color for the fill',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render color option with color picker and text input', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Fill Color')).toBeInTheDocument()
      // Both color picker and text input have the default value
      const colorInputs = screen.getAllByDisplayValue('#8884d8')
      expect(colorInputs.length).toBe(2) // One color picker + one text input
    })

    it('should call onDisplayConfigChange when color changes', async () => {
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const colorInput = screen.getAllByDisplayValue('#8884d8')[0]
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ fillColor: '#ff0000' })
      )
    })
  })

  describe('structured display options - paletteColor type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'colorIndex',
              label: 'Color',
              type: 'paletteColor',
              defaultValue: 0,
              description: 'Select from palette',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render palette color buttons', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Color')).toBeInTheDocument()
      // Should have buttons for each color in the palette
      const colorButtons = screen.getAllByRole('button')
      expect(colorButtons.length).toBeGreaterThanOrEqual(5) // 5 colors in mock palette
    })

    it('should call onDisplayConfigChange when palette color is selected', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      // Click on a color button (find by title which includes the color)
      const colorButtons = screen.getAllByTitle(/Color \d+:/)
      await user.click(colorButtons[2])

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ colorIndex: 2 })
      )
    })

    it('should show fallback color when no palette is provided', () => {
      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          colorPalette={undefined}
        />
      )

      // Should show default color button
      const colorButton = screen.getByTitle('Default Color')
      expect(colorButton).toBeInTheDocument()
    })
  })

  describe('structured display options - buttonGroup type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'orientation',
              label: 'Orientation',
              type: 'buttonGroup',
              defaultValue: 'horizontal',
              options: [
                { value: 'horizontal', label: 'Horizontal' },
                { value: 'vertical', label: 'Vertical' },
              ],
              description: 'Chart orientation',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render button group', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Orientation')).toBeInTheDocument()
      expect(screen.getByText('Horizontal')).toBeInTheDocument()
      expect(screen.getByText('Vertical')).toBeInTheDocument()
    })

    it('should highlight selected option', () => {
      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          displayConfig={{ orientation: 'vertical' }}
        />
      )

      const verticalButton = screen.getByText('Vertical')
      // The selected button should have the primary background class
      expect(verticalButton).toHaveClass('bg-dc-primary')
    })

    it('should call onDisplayConfigChange when button group option is clicked', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const verticalButton = screen.getByText('Vertical')
      await user.click(verticalButton)

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: 'vertical' })
      )
    })
  })

  describe('structured display options - axisFormat type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'leftYAxisFormat',
              label: 'Left Y-Axis Format',
              type: 'axisFormat',
              description: 'Number formatting for left Y-axis',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render AxisFormatControls component', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByTestId('axis-format-left-y-axis-format')).toBeInTheDocument()
    })

    it('should pass correct props to AxisFormatControls', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      // AxisFormatControls should receive the label
      expect(screen.getByText('Left Y-Axis Format')).toBeInTheDocument()
    })
  })

  describe('structured display options - stringArray type', () => {
    beforeEach(() => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptionsConfig: [
            {
              key: 'customLabels',
              label: 'Custom Labels',
              type: 'stringArray',
              placeholder: 'One label per line',
              description: 'Enter labels, one per line',
            },
          ],
        },
        loading: false,
        loaded: true,
      })
    })

    it('should render string array as textarea', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Custom Labels')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('One label per line')).toBeInTheDocument()
    })

    it('should display existing values as newline-separated text', () => {
      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          displayConfig={{ customLabels: ['Label 1', 'Label 2', 'Label 3'] }}
        />
      )

      const textarea = screen.getByPlaceholderText('One label per line')
      expect(textarea).toHaveValue('Label 1\nLabel 2\nLabel 3')
    })

    it('should call onDisplayConfigChange on blur with array value', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const textarea = screen.getByPlaceholderText('One label per line')
      await user.clear(textarea)
      await user.type(textarea, 'First\nSecond\nThird')

      // StringArrayInput updates on blur
      fireEvent.blur(textarea)

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customLabels: ['First', 'Second', 'Third'],
        })
      )
    })

    it('should filter empty lines from string array', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const textarea = screen.getByPlaceholderText('One label per line')
      await user.type(textarea, 'First\n\n\nSecond')
      fireEvent.blur(textarea)

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customLabels: ['First', 'Second'],
        })
      )
    })

    it('should set undefined when array is empty', async () => {
      const user = userEvent.setup()
      const onDisplayConfigChange = vi.fn()

      render(
        <AnalysisDisplayConfigPanel
          {...defaultProps}
          displayConfig={{ customLabels: ['Test'] }}
          onDisplayConfigChange={onDisplayConfigChange}
        />
      )

      const textarea = screen.getByPlaceholderText('One label per line')
      await user.clear(textarea)
      fireEvent.blur(textarea)

      expect(onDisplayConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          customLabels: undefined,
        })
      )
    })
  })

  describe('display options heading', () => {
    it('should show Display Options section heading', () => {
      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      expect(screen.getByText('Display Options')).toBeInTheDocument()
    })
  })

  describe('combined legacy and structured options', () => {
    it('should render both legacy and structured options', () => {
      mockedUseChartConfig.mockReturnValue({
        config: {
          dropZones: [],
          displayOptions: ['showLegend', 'showGrid'],
          displayOptionsConfig: [
            {
              key: 'stackType',
              label: 'Stacking',
              type: 'select',
              defaultValue: 'none',
              options: [
                { value: 'none', label: 'None' },
                { value: 'normal', label: 'Stacked' },
              ],
            },
          ],
        },
        loading: false,
        loaded: true,
      })

      render(<AnalysisDisplayConfigPanel {...defaultProps} />)

      // Legacy options
      expect(screen.getByText('Show Legend')).toBeInTheDocument()
      expect(screen.getByText('Show Grid')).toBeInTheDocument()

      // Structured option
      expect(screen.getByText('Stacking')).toBeInTheDocument()
    })
  })
})
