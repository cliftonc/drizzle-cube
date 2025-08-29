
interface DataHistogramProps {
  /** Array of numeric values to create histogram from */
  values: number[]
  /** Minimum value in the dataset */
  min: number
  /** Maximum value in the dataset */
  max: number
  /** Color for the histogram bars */
  color?: string
  /** Number of buckets/bars to create (default: 12) */
  bucketCount?: number
  /** Height of the histogram in pixels (default: 32) */
  height?: number
  /** Format function for min/max labels */
  formatValue?: (value: number) => string
  /** Width of the histogram to match text above */
  width?: number
  /** Whether to show average indicator line (default: true) */
  showAverageIndicator?: boolean
  /** Target value to show as green line */
  targetValue?: number
}

/**
 * Reusable histogram component that shows the distribution of actual data values
 */
export default function DataHistogram({
  values,
  min,
  max,
  color = '#1f2937',
  bucketCount = 12,
  height = 32,
  formatValue = (val) => val.toString(),
  width,
  showAverageIndicator = true,
  targetValue
}: DataHistogramProps) {
  // Create histogram buckets from actual data
  const buckets = new Array(bucketCount).fill(0)
  const range = max - min
  
  // Distribute actual values into buckets
  values.forEach(value => {
    if (range === 0) {
      // All values are the same, put everything in middle bucket
      buckets[Math.floor(bucketCount / 2)]++
    } else {
      // Calculate which bucket this value belongs to
      let bucketIndex = Math.floor(((value - min) / range) * (bucketCount - 1))
      // Clamp to valid bucket range
      bucketIndex = Math.max(0, Math.min(bucketCount - 1, bucketIndex))
      buckets[bucketIndex]++
    }
  })
  
  // Find max bucket count for normalization
  const maxBucketCount = Math.max(...buckets)
  
  // Calculate average for indicator positioning
  const average = values.reduce((sum, val) => sum + val, 0) / values.length
  
  // Calculate average position as percentage of histogram width
  const averagePosition = range === 0 ? 50 : ((average - min) / range) * 100
  
  // Calculate target position if target value is provided
  const targetPosition = targetValue !== undefined && range > 0 
    ? ((targetValue - min) / range) * 100 
    : null

  return (
    <div className="flex flex-col items-center">
      {/* Horizontal bars representing actual data distribution */}
      <div 
        className="relative flex items-end justify-center space-x-0.5" 
        style={{ 
          height: `${height}px`,
          width: width ? `${width}px` : '200px',
          minWidth: '200px'
        }}
      >
        {buckets.map((count, i) => {
          // Normalize height based on actual data frequency
          const normalizedHeight = maxBucketCount > 0 ? count / maxBucketCount : 0
          const minHeight = 0.1 // minimum height for empty buckets
          const displayHeight = count > 0 ? Math.max(minHeight, normalizedHeight) : minHeight
          
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-300 ease-out"
              style={{
                height: `${displayHeight * height}px`,
                backgroundColor: color,
                opacity: count > 0 ? 0.7 + (normalizedHeight * 0.3) : 0.2 // higher opacity for buckets with data
              }}
              title={`${count} values in this range`} // tooltip showing actual count
            />
          )
        })}
        
        {/* Average indicator line */}
        {showAverageIndicator && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${averagePosition}%`,
              transform: 'translateX(-50%)',
              width: '2px',
              backgroundColor: '#ef4444',
              opacity: 0.8,
              zIndex: 10
            }}
            title={`Average: ${formatValue(average)}`}
          >
            {/* Small triangle at top to indicate average */}
            <div
              className="absolute -top-1"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '6px solid #ef4444'
              }}
            />
          </div>
        )}
        
        {/* Target indicator line */}
        {targetPosition !== null && targetValue !== undefined && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${Math.max(0, Math.min(100, targetPosition))}%`,
              transform: 'translateX(-50%)',
              width: '2px',
              backgroundColor: '#10b981',
              opacity: 0.8,
              zIndex: 11
            }}
            title={`Target: ${formatValue(targetValue)}`}
          >
            {/* Small triangle at top to indicate target */}
            <div
              className="absolute -top-1"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '6px solid #10b981'
              }}
            />
          </div>
        )}
      </div>
      
      {/* Min/Max values aligned with histogram width */}
      <div 
        className="flex justify-between mt-2 text-xs text-gray-500"
        style={{ 
          width: width ? `${width}px` : '200px',
          minWidth: '200px'
        }}
      >
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
      
      {/* Average indicator */}
      <div className="text-center mt-1 text-xs text-gray-400">
        Average of {values.length} values
      </div>
    </div>
  )
}