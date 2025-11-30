import { ReactElement, useState, useRef, useLayoutEffect } from 'react'
import { ResponsiveContainer } from 'recharts'

interface ChartContainerProps {
  children: ReactElement
  height?: string | number
}

export default function ChartContainer({ children, height = "100%" }: ChartContainerProps) {
  // Track if container is ready to render ResponsiveContainer
  // We need to wait for the container to be in the DOM with valid dimensions
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Use useLayoutEffect to measure before paint
  useLayoutEffect(() => {
    let mounted = true
    let resizeObserver: ResizeObserver | null = null

    const measureAndSetReady = () => {
      if (!mounted || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      // Check both clientWidth/Height AND getBoundingClientRect for robustness
      const width = Math.max(containerRef.current.clientWidth, rect.width)
      const height = Math.max(containerRef.current.clientHeight, rect.height)

      if (width > 0 && height > 0) {
        setContainerSize({ width, height })
        setIsReady(true)
      }
    }

    // Set up ResizeObserver to detect when container gets valid dimensions
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setContainerSize({ width, height })
          if (!isReady) {
            setIsReady(true)
          }
        }
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
      // Also try immediate measurement
      measureAndSetReady()
    }

    return () => {
      mounted = false
      resizeObserver?.disconnect()
    }
  }, [isReady])

  try {
    if (height === "100%") {
      // For 100% height, make the container fill the available flex space with proper sizing
      return (
        <div
          ref={containerRef}
          className="w-full h-full flex-1 flex flex-col relative"
          style={{ minHeight: '250px', minWidth: '100px', overflow: 'hidden' }}
        >
          {isReady && containerSize.width > 0 && containerSize.height > 0 ? (
            <ResponsiveContainer
              width={containerSize.width}
              height={containerSize.height - 16}
              debounce={100}
              style={{ marginTop: '16px' }}
            >
              {children}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      )
    }

    // For specific heights, use them directly
    const containerStyle = {
      height: typeof height === 'number' ? `${height}px` : height,
      width: '100%',
      minHeight: '200px',
      minWidth: '100px'
    }

    return (
      <div
        ref={containerRef}
        className="w-full flex flex-col relative"
        style={{ ...containerStyle, overflow: 'hidden' }}
      >
        {isReady && containerSize.width > 0 && containerSize.height > 0 ? (
          <ResponsiveContainer
            width={containerSize.width}
            height={containerSize.height - 16}
            debounce={100}
            style={{ marginTop: '16px' }}
          >
            {children}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    // ChartContainer ResponsiveContainer error

    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full p-4 text-center border border-dashed rounded-lg"
        style={{ height, borderColor: 'var(--dc-border)', backgroundColor: 'var(--dc-surface)' }}
      >
        <div className="text-sm font-semibold mb-1 text-dc-text-muted">Unable to display chart</div>
        <div className="text-xs text-dc-text-secondary">
          {error instanceof Error ? error.message : 'Failed to create responsive container'}
        </div>
      </div>
    )
  }
}