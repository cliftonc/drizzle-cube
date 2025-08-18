import { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

interface ChartContainerProps {
  children: ReactElement
  height?: string | number
}

export default function ChartContainer({ children, height = "100%" }: ChartContainerProps) {
  try {
    return (
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    )
  } catch (error) {
    console.error('ChartContainer ResponsiveContainer error:', error)
    
    return (
      <div 
        className="flex flex-col items-center justify-center w-full h-full p-4 text-center border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50"
        style={{ height }}
      >
        <div className="text-sm font-semibold text-yellow-600 mb-1">Chart Container Error</div>
        <div className="text-xs text-gray-600">
          {error instanceof Error ? error.message : 'Failed to create responsive container'}
        </div>
      </div>
    )
  }
}