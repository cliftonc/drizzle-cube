
import { useTranslation } from '../hooks/useTranslation.js'

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
 * Distribute values into histogram buckets and derive summary stats.
 */
function buildHistogram(values: number[], min: number, max: number, bucketCount: number) {
  const buckets = new Array(bucketCount).fill(0)
  const range = max - min

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

  const maxBucketCount = Math.max(...buckets)
  const average = values.reduce((sum, val) => sum + val, 0) / values.length
  const averagePosition = range === 0 ? 50 : ((average - min) / range) * 100

  return { buckets, range, maxBucketCount, average, averagePosition }
}

interface IndicatorLineProps {
  position: number
  clamp?: boolean
  color: string
  zIndex: number
  title: string
}

/** Vertical indicator line (average / target) with a small triangle marker. */
function IndicatorLine({ position, clamp = false, color, zIndex, title }: IndicatorLineProps) {
  const left = clamp ? Math.max(0, Math.min(100, position)) : position
  return (
    <div
      className="dc:absolute dc:top-0 dc:bottom-0 dc:pointer-events-none"
      style={{
        left: `${left}%`,
        transform: 'translateX(-50%)',
        width: '2px',
        backgroundColor: color,
        opacity: 0.8,
        zIndex
      }}
      title={title}
    >
      <div
        className="dc:absolute dc:-top-1"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `6px solid ${color}`
        }}
      />
    </div>
  )
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
  const { t } = useTranslation()

  const { buckets, range, maxBucketCount, average, averagePosition } = buildHistogram(
    values,
    min,
    max,
    bucketCount
  )

  // Calculate target position if target value is provided
  const targetPosition = targetValue !== undefined && range > 0
    ? ((targetValue - min) / range) * 100
    : null

  const sizingStyle = {
    width: width ? `${width}px` : '200px',
    minWidth: '200px'
  }

  return (
    <div className="dc:flex dc:flex-col dc:items-center">
      {/* Horizontal bars representing actual data distribution */}
      <div
        className="dc:relative dc:flex dc:items-end dc:justify-center dc:space-x-0.5"
        style={{ height: `${height}px`, ...sizingStyle }}
      >
        {buckets.map((count, i) => {
          // Normalize height based on actual data frequency
          const normalizedHeight = maxBucketCount > 0 ? count / maxBucketCount : 0
          const minHeight = 0.1 // minimum height for empty buckets
          const displayHeight = count > 0 ? Math.max(minHeight, normalizedHeight) : minHeight

          return (
            <div
              key={i}
              className="dc:flex-1 dc:rounded-t-sm dc:transition-all dc:duration-300 dc:ease-out"
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
          <IndicatorLine
            position={averagePosition}
            color="#ef4444"
            zIndex={10}
            title={`Average: ${formatValue(average)}`}
          />
        )}

        {/* Target indicator line */}
        {targetPosition !== null && targetValue !== undefined && (
          <IndicatorLine
            position={targetPosition}
            clamp
            color="#10b981"
            zIndex={11}
            title={`Target: ${formatValue(targetValue)}`}
          />
        )}
      </div>

      {/* Min/Max values aligned with histogram width */}
      <div
        className="dc:flex dc:justify-between dc:mt-2 dc:text-xs text-dc-text-muted"
        style={sizingStyle}
      >
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>

      {/* Average indicator */}
      <div className="dc:text-center dc:mt-1 dc:text-xs text-dc-text-muted">
        {t('dataHistogram.average', { count: values.length })}
      </div>
    </div>
  )
}
