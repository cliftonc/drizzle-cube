/**
 * FieldDetailPanel Component Tests
 *
 * Tests for the field detail panel that displays information about
 * hovered/focused fields in the field search modal.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FieldDetailPanel from '../../../../src/client/components/AnalysisBuilder/FieldDetailPanel'
import type { FieldOption } from '../../../../src/client/components/AnalysisBuilder/types'

describe('FieldDetailPanel', () => {
  // Test field fixtures
  const measureField: FieldOption = {
    name: 'Users.count',
    title: 'User Count',
    shortTitle: 'Count',
    type: 'count',
    description: 'Total number of users in the system',
    cubeName: 'Users',
    fieldType: 'measure',
  }

  const sumMeasureField: FieldOption = {
    name: 'Orders.totalRevenue',
    title: 'Total Revenue',
    shortTitle: 'Revenue',
    type: 'sum',
    cubeName: 'Orders',
    fieldType: 'measure',
  }

  const avgMeasureField: FieldOption = {
    name: 'Users.avgAge',
    title: 'Average Age',
    shortTitle: 'Avg Age',
    type: 'avg',
    cubeName: 'Users',
    fieldType: 'measure',
  }

  const minMeasureField: FieldOption = {
    name: 'Products.minPrice',
    title: 'Minimum Price',
    shortTitle: 'Min Price',
    type: 'min',
    cubeName: 'Products',
    fieldType: 'measure',
  }

  const maxMeasureField: FieldOption = {
    name: 'Products.maxPrice',
    title: 'Maximum Price',
    shortTitle: 'Max Price',
    type: 'max',
    cubeName: 'Products',
    fieldType: 'measure',
  }

  const countDistinctMeasureField: FieldOption = {
    name: 'Users.uniqueEmails',
    title: 'Unique Emails',
    shortTitle: 'Unique',
    type: 'countDistinct',
    cubeName: 'Users',
    fieldType: 'measure',
  }

  const countDistinctApproxMeasureField: FieldOption = {
    name: 'Events.approxUsers',
    title: 'Approx Users',
    shortTitle: 'Approx',
    type: 'countDistinctApprox',
    cubeName: 'Events',
    fieldType: 'measure',
  }

  const runningTotalMeasureField: FieldOption = {
    name: 'Sales.runningTotal',
    title: 'Running Total',
    shortTitle: 'Running',
    type: 'runningTotal',
    cubeName: 'Sales',
    fieldType: 'measure',
  }

  const numberMeasureField: FieldOption = {
    name: 'Metrics.value',
    title: 'Value',
    shortTitle: 'Val',
    type: 'number',
    cubeName: 'Metrics',
    fieldType: 'measure',
  }

  const stringDimensionField: FieldOption = {
    name: 'Users.name',
    title: 'User Name',
    shortTitle: 'Name',
    type: 'string',
    description: 'The full name of the user',
    cubeName: 'Users',
    fieldType: 'dimension',
  }

  const numberDimensionField: FieldOption = {
    name: 'Users.age',
    title: 'User Age',
    shortTitle: 'Age',
    type: 'number',
    cubeName: 'Users',
    fieldType: 'dimension',
  }

  const booleanDimensionField: FieldOption = {
    name: 'Users.isActive',
    title: 'Is Active',
    shortTitle: 'Active',
    type: 'boolean',
    cubeName: 'Users',
    fieldType: 'dimension',
  }

  const geoDimensionField: FieldOption = {
    name: 'Locations.coordinates',
    title: 'Coordinates',
    shortTitle: 'Coords',
    type: 'geo',
    cubeName: 'Locations',
    fieldType: 'dimension',
  }

  const timeDimensionField: FieldOption = {
    name: 'Users.createdAt',
    title: 'Created At',
    shortTitle: 'Created',
    type: 'time',
    cubeName: 'Users',
    fieldType: 'timeDimension',
  }

  const unknownTypeDimensionField: FieldOption = {
    name: 'Data.custom',
    title: 'Custom Field',
    shortTitle: 'Custom',
    type: 'custom',
    cubeName: 'Data',
    fieldType: 'dimension',
  }

  const unknownTypeMeasureField: FieldOption = {
    name: 'Data.special',
    title: 'Special Measure',
    shortTitle: 'Special',
    type: 'special',
    cubeName: 'Data',
    fieldType: 'measure',
  }

  describe('empty state', () => {
    it('should show placeholder when no field provided', () => {
      render(<FieldDetailPanel field={null} />)

      expect(screen.getByText('Hover over a field to see details')).toBeInTheDocument()
    })

    it('should show placeholder when field is undefined', () => {
      render(<FieldDetailPanel field={undefined as unknown as FieldOption} />)

      expect(screen.getByText('Hover over a field to see details')).toBeInTheDocument()
    })
  })

  describe('measure field display', () => {
    it('should display measure field title', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('User Count')).toBeInTheDocument()
    })

    it('should display measure field name', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Users.count')).toBeInTheDocument()
    })

    it('should display description when provided', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Total number of users in the system')).toBeInTheDocument()
    })

    it('should not show description section when not provided', () => {
      render(<FieldDetailPanel field={sumMeasureField} />)

      // The description text should not be present
      expect(screen.queryByText('Total number')).not.toBeInTheDocument()
    })

    it('should display cube name', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Cube')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should display category as Measure', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Measure')).toBeInTheDocument()
    })

    it('should display Count type for count measure', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()
    })

    it('should display Sum type for sum measure', () => {
      render(<FieldDetailPanel field={sumMeasureField} />)

      expect(screen.getByText('Sum')).toBeInTheDocument()
    })

    it('should display Average type for avg measure', () => {
      render(<FieldDetailPanel field={avgMeasureField} />)

      expect(screen.getByText('Average')).toBeInTheDocument()
    })

    it('should display Minimum type for min measure', () => {
      render(<FieldDetailPanel field={minMeasureField} />)

      expect(screen.getByText('Minimum')).toBeInTheDocument()
    })

    it('should display Maximum type for max measure', () => {
      render(<FieldDetailPanel field={maxMeasureField} />)

      expect(screen.getByText('Maximum')).toBeInTheDocument()
    })

    it('should display Count Distinct type for countDistinct measure', () => {
      render(<FieldDetailPanel field={countDistinctMeasureField} />)

      expect(screen.getByText('Count Distinct')).toBeInTheDocument()
    })

    it('should display Count Distinct (Approx) type for countDistinctApprox measure', () => {
      render(<FieldDetailPanel field={countDistinctApproxMeasureField} />)

      expect(screen.getByText('Count Distinct (Approx)')).toBeInTheDocument()
    })

    it('should display Running Total type for runningTotal measure', () => {
      render(<FieldDetailPanel field={runningTotalMeasureField} />)

      // "Running Total" appears in both title and type
      const runningTotalTexts = screen.getAllByText('Running Total')
      expect(runningTotalTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('should display Number type for number measure', () => {
      render(<FieldDetailPanel field={numberMeasureField} />)

      expect(screen.getByText('Number')).toBeInTheDocument()
    })

    it('should fallback to raw type for unknown measure type', () => {
      render(<FieldDetailPanel field={unknownTypeMeasureField} />)

      expect(screen.getByText('special')).toBeInTheDocument()
    })
  })

  describe('dimension field display', () => {
    it('should display dimension field title', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('User Name')).toBeInTheDocument()
    })

    it('should display dimension field name', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('Users.name')).toBeInTheDocument()
    })

    it('should display description when provided', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('The full name of the user')).toBeInTheDocument()
    })

    it('should display cube name', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('Cube')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should display category as Dimension', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
      // "Dimension" appears in the Category badge
      const dimensionTexts = screen.getAllByText('Dimension')
      expect(dimensionTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('should display Text type for string dimension', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('should display Number type for number dimension', () => {
      render(<FieldDetailPanel field={numberDimensionField} />)

      expect(screen.getByText('Number')).toBeInTheDocument()
    })

    it('should display Boolean type for boolean dimension', () => {
      render(<FieldDetailPanel field={booleanDimensionField} />)

      expect(screen.getByText('Boolean')).toBeInTheDocument()
    })

    it('should display Geographic type for geo dimension', () => {
      render(<FieldDetailPanel field={geoDimensionField} />)

      expect(screen.getByText('Geographic')).toBeInTheDocument()
    })

    it('should fallback to Dimension for unknown dimension type', () => {
      render(<FieldDetailPanel field={unknownTypeDimensionField} />)

      // "Dimension" appears in both Type and Category sections
      const dimensionTexts = screen.getAllByText('Dimension')
      expect(dimensionTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('time dimension field display', () => {
    it('should display time dimension field title', () => {
      render(<FieldDetailPanel field={timeDimensionField} />)

      expect(screen.getByText('Created At')).toBeInTheDocument()
    })

    it('should display time dimension field name', () => {
      render(<FieldDetailPanel field={timeDimensionField} />)

      expect(screen.getByText('Users.createdAt')).toBeInTheDocument()
    })

    it('should display category as Time Dimension', () => {
      render(<FieldDetailPanel field={timeDimensionField} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
      // Time Dimension appears twice - in Category badge and Type display
      const timeDimensionTexts = screen.getAllByText('Time Dimension')
      expect(timeDimensionTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('should display Time Dimension type', () => {
      render(<FieldDetailPanel field={timeDimensionField} />)

      expect(screen.getByText('Type')).toBeInTheDocument()
      // Should show 'Time Dimension' for both Type and Category
      const timeDimensionTexts = screen.getAllByText('Time Dimension')
      expect(timeDimensionTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('usage hint', () => {
    it('should show keyboard hint for measures', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Enter')).toBeInTheDocument()
      expect(screen.getByText(/click to add this field/i)).toBeInTheDocument()
    })

    it('should show keyboard hint for dimensions', () => {
      render(<FieldDetailPanel field={stringDimensionField} />)

      expect(screen.getByText('Enter')).toBeInTheDocument()
      expect(screen.getByText(/click to add this field/i)).toBeInTheDocument()
    })

    it('should show keyboard hint for time dimensions', () => {
      render(<FieldDetailPanel field={timeDimensionField} />)

      expect(screen.getByText('Enter')).toBeInTheDocument()
      expect(screen.getByText(/click to add this field/i)).toBeInTheDocument()
    })
  })

  describe('icon rendering', () => {
    it('should render icon for measure field', () => {
      const { container } = render(<FieldDetailPanel field={measureField} />)

      // Should have the icon container with measure styling
      const iconContainer = container.querySelector('.bg-dc-measure')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should render icon for dimension field', () => {
      const { container } = render(<FieldDetailPanel field={stringDimensionField} />)

      // Should have the icon container with dimension styling
      const iconContainer = container.querySelector('.bg-dc-dimension')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should render icon for time dimension field', () => {
      const { container } = render(<FieldDetailPanel field={timeDimensionField} />)

      // Should have the icon container with time dimension styling
      const iconContainer = container.querySelector('.bg-dc-time-dimension')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('metadata section', () => {
    it('should display Type label', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Type')).toBeInTheDocument()
    })

    it('should display Cube label', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Cube')).toBeInTheDocument()
    })

    it('should display Category label', () => {
      render(<FieldDetailPanel field={measureField} />)

      expect(screen.getByText('Category')).toBeInTheDocument()
    })
  })

  describe('different cubes', () => {
    it('should display correct cube name for Orders cube', () => {
      render(<FieldDetailPanel field={sumMeasureField} />)

      expect(screen.getByText('Orders')).toBeInTheDocument()
    })

    it('should display correct cube name for Products cube', () => {
      render(<FieldDetailPanel field={minMeasureField} />)

      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('should display correct cube name for Locations cube', () => {
      render(<FieldDetailPanel field={geoDimensionField} />)

      expect(screen.getByText('Locations')).toBeInTheDocument()
    })
  })
})
