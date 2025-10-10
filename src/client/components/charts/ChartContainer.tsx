import { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

interface ChartContainerProps {
  children: ReactElement
  height?: string | number
}

export default function ChartContainer({ children, height = "100%" }: ChartContainerProps) {
  try {
    if (height === "100%") {
      // For 100% height, make the container fill the available flex space with proper sizing
      return (
        <div className="w-full h-full flex-1 flex flex-col relative" style={{ minHeight: '250px', overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%" debounce={50} style={{ marginTop: '16px' }}>
            {children}
          </ResponsiveContainer>
        </div>
      )
    }
    
    // For specific heights, use them directly
    const containerStyle = {
      height: typeof height === 'number' ? `${height}px` : height,
      width: '100%',
      minHeight: '200px'
    }
    
    return (
      <div className="w-full flex flex-col relative" style={{ ...containerStyle, overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50} style={{ marginTop: '16px' }}>
          {children}
        </ResponsiveContainer>
      </div>
    )
  } catch (error) {
    // ChartContainer ResponsiveContainer error
    
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full p-4 text-center border-2 border-dashed rounded-lg"
        style={{ height, borderColor: 'var(--dc-warning-border)', backgroundColor: 'var(--dc-warning-bg)' }}
      >
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--dc-warning)' }}>Chart Container Error</div>
        <div className="text-xs text-dc-text-muted">
          {error instanceof Error ? error.message : 'Failed to create responsive container'}
        </div>
      </div>
    )
  }
}