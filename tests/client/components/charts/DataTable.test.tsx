/**
 * Tests for DataTable component
 *
 * Focus on data transformation, column rendering, and empty state handling.
 * DataTable is a pure presentational component that receives data as props.
 */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DataTable from '../../../../src/client/components/charts/DataTable'

// Mock the CubeProvider hooks to avoid context dependencies
vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeMeta: () => ({
    getFieldLabel: (field: string) => {
      // Return human-readable labels for test fields
      const labels: Record<string, string> = {
        'Users.name': 'Name',
        'Users.count': 'Count',
        'Users.revenue': 'Revenue',
        'Users.createdAt': 'Created At',
        'Orders.total': 'Total Orders',
        'Products.category': 'Category',
      }
      return labels[field] || field
    },
    meta: null,
  }),
}))

// Mock pivotUtils to test flat table rendering
vi.mock('../../../../src/client/utils/pivotUtils', () => ({
  hasTimeDimensionForPivot: () => null,
  pivotTableData: () => null,
  getMeasureType: () => 'number',
  getOrderedColumnsFromQuery: (queryObject: any) => {
    if (!queryObject) return []
    const cols: string[] = []
    if (queryObject.dimensions) cols.push(...queryObject.dimensions)
    if (queryObject.timeDimensions) {
      cols.push(...queryObject.timeDimensions.map((td: any) => td.dimension))
    }
    if (queryObject.measures) cols.push(...queryObject.measures)
    return cols
  },
}))

// Sample test data
const mockData = [
  { 'Users.name': 'Alice', 'Users.count': 10, 'Users.revenue': 1500.5 },
  { 'Users.name': 'Bob', 'Users.count': 5, 'Users.revenue': 750.25 },
  { 'Users.name': 'Charlie', 'Users.count': 15, 'Users.revenue': 2250.75 },
]

// Helper to create larger dataset for pagination tests
const createMockData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    'Users.name': `User ${i + 1}`,
    'Users.count': Math.floor(Math.random() * 100),
    'Users.revenue': Math.floor(Math.random() * 10000) / 100,
  }))

describe('DataTable', () => {
  describe('rendering', () => {
    it('should render column headers from data keys', () => {
      render(<DataTable data={mockData} height={300} />)

      // Check that column headers are rendered with proper labels
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })

    it('should render all data rows', () => {
      render(<DataTable data={mockData} height={300} />)

      // All row data should be visible
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('should show "No data available" message when data array is empty', () => {
      render(<DataTable data={[]} height={300} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.getByText('No data to display in table')).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined/null', () => {
      render(<DataTable data={null as unknown as any[]} height={300} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should use field labels from getFieldLabel when provided', () => {
      render(<DataTable data={mockData} height={300} />)

      // Our mock returns human-readable labels
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })

    it('should respect column order from chartConfig.xAxis', () => {
      const chartConfig = {
        xAxis: ['Users.revenue', 'Users.name', 'Users.count'],
      }

      render(<DataTable data={mockData} chartConfig={chartConfig} height={300} />)

      // Get all column headers
      const headers = screen.getAllByRole('columnheader')

      // Verify order matches xAxis config
      expect(headers[0]).toHaveTextContent('Revenue')
      expect(headers[1]).toHaveTextContent('Name')
      expect(headers[2]).toHaveTextContent('Count')
    })

    it('should derive column order from queryObject when xAxis not provided', () => {
      const queryObject = {
        dimensions: ['Users.name'],
        measures: ['Users.count', 'Users.revenue'],
      }

      render(<DataTable data={mockData} queryObject={queryObject} height={300} />)

      // Get all column headers
      const headers = screen.getAllByRole('columnheader')

      // Should follow queryObject order: dimensions then measures
      expect(headers[0]).toHaveTextContent('Name')
      expect(headers[1]).toHaveTextContent('Count')
      expect(headers[2]).toHaveTextContent('Revenue')
    })
  })

  describe('formatting', () => {
    it('should format numbers with locale formatting', () => {
      const dataWithLargeNumbers = [
        { 'Users.name': 'Test', 'Users.count': 1234567 },
      ]

      render(<DataTable data={dataWithLargeNumbers} height={300} />)

      // Should have locale-formatted numbers (1,234,567)
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    })

    it('should format decimal numbers with locale formatting', () => {
      const dataWithDecimals = [
        { 'Users.name': 'Test', 'Users.revenue': 1234.56 },
      ]

      render(<DataTable data={dataWithDecimals} height={300} />)

      // Should show formatted with locale
      expect(screen.getByText('1,234.56')).toBeInTheDocument()
    })

    it('should handle null/undefined values gracefully', () => {
      const dataWithNulls = [
        { 'Users.name': 'Alice', 'Users.count': null, 'Users.revenue': undefined },
        { 'Users.name': null, 'Users.count': 5, 'Users.revenue': 100 },
      ]

      render(<DataTable data={dataWithNulls} height={300} />)

      // Component should render without crashing
      // Null values render as empty strings in flat table
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display boolean values as Yes/No', () => {
      const dataWithBooleans = [
        { 'Users.name': 'Alice', 'Users.active': true },
        { 'Users.name': 'Bob', 'Users.active': false },
      ]

      render(<DataTable data={dataWithBooleans} height={300} />)

      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })

    it('should convert non-string/number values to string', () => {
      const dataWithObjects = [
        { 'Users.name': 'Test', 'Users.data': 'some text' },
      ]

      render(<DataTable data={dataWithObjects} height={300} />)

      expect(screen.getByText('some text')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle data with single row', () => {
      const singleRow = [{ 'Users.name': 'Only User', 'Users.count': 42 }]

      render(<DataTable data={singleRow} height={300} />)

      expect(screen.getByText('Only User')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should handle data with many columns', () => {
      const wideData = [
        {
          'Col.a': 1,
          'Col.b': 2,
          'Col.c': 3,
          'Col.d': 4,
          'Col.e': 5,
          'Col.f': 6,
          'Col.g': 7,
          'Col.h': 8,
        },
      ]

      render(<DataTable data={wideData} height={300} />)

      // All columns should be rendered
      const headers = screen.getAllByRole('columnheader')
      expect(headers).toHaveLength(8)
    })

    it('should handle empty strings in data', () => {
      const dataWithEmptyStrings = [
        { 'Users.name': '', 'Users.count': 0 },
      ]

      render(<DataTable data={dataWithEmptyStrings} height={300} />)

      // Should render without crashing
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should show "No columns available" when data has no columns', () => {
      const emptyObjectData = [{}]

      render(<DataTable data={emptyObjectData} height={300} />)

      // With no keys, there are no columns
      expect(screen.getByText('No columns available')).toBeInTheDocument()
    })

    it('should handle mixed data types across rows', () => {
      const mixedData = [
        { 'Users.name': 'Alice', 'Users.value': 100 },
        { 'Users.name': 'Bob', 'Users.value': 'text' },
        { 'Users.name': 'Charlie', 'Users.value': true },
      ]

      render(<DataTable data={mixedData} height={300} />)

      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('text')).toBeInTheDocument()
      expect(screen.getByText('Yes')).toBeInTheDocument()
    })

    it('should handle integers without adding decimal places', () => {
      const integerData = [
        { 'Users.name': 'Test', 'Users.count': 42 },
      ]

      render(<DataTable data={integerData} height={300} />)

      // Integer should be formatted without decimals
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.queryByText('42.00')).not.toBeInTheDocument()
    })
  })

  describe('height prop', () => {
    it('should apply numeric height as pixels', () => {
      const { container } = render(<DataTable data={mockData} height={400} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should apply string height directly', () => {
      const { container } = render(<DataTable data={mockData} height="50vh" />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })
  })
})
