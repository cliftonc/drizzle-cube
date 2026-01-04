import React from 'react'
import { Tooltip } from 'recharts'
import { formatNumericValue } from '../../utils/chartUtils'

interface ChartTooltipProps {
  formatter?: (value: any, name: any, props: any) => [React.ReactText, React.ReactText]
  labelFormatter?: (label: any, payload?: readonly any[]) => React.ReactText
}

// Default formatter that rounds numeric values to at most 2 decimal places
const defaultFormatter = (value: any, name: any): [React.ReactText, React.ReactText] => {
  if (value === null || value === undefined) {
    return ['No data', name]
  }
  return [formatNumericValue(value), name]
}

export default function ChartTooltip({ formatter, labelFormatter }: ChartTooltipProps) {
  return (
    <Tooltip
      formatter={formatter || defaultFormatter}
      labelFormatter={labelFormatter}
      contentStyle={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        color: '#1f2937',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '8px 12px'
      }}
    />
  )
}