import { Legend } from 'recharts'

interface ChartLegendProps {
  onMouseEnter?: (o: any, i: any) => void
  onMouseLeave?: () => void
  showLegend?: boolean
}

export default function ChartLegend({ onMouseEnter, onMouseLeave, showLegend = true }: ChartLegendProps) {
  if (!showLegend) {
    return null
  }
  return (
    <Legend 
      wrapperStyle={{ 
        fontSize: '12px', 
        paddingTop: '10px',
        // backgroundColor: 'rgba(255, 0, 0, 0.1)' // Debug: red background to see legend area
      }}
      iconType="rect"
      iconSize={8}
      layout="horizontal"
      align="center"
      verticalAlign="bottom"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  )
}