import React, { useState, useEffect } from 'react'
import { ChartBarIcon, ChartPieIcon, CalendarIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'
import type { PortletConfig, ChartAxisConfig, ChartDisplayConfig, ChartType } from '../types'

interface PortletEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void
  portlet?: PortletConfig | null
  title: string
  submitText: string
  apiUrl?: string
}

const CHART_TYPES = [
  { value: 'line' as const, label: 'Line Chart', description: 'Best for trends over time' },
  { value: 'bar' as const, label: 'Bar Chart', description: 'Best for comparing categories' },
  { value: 'area' as const, label: 'Area Chart', description: 'Best for cumulative trends' },
  { value: 'pie' as const, label: 'Pie Chart', description: 'Best for showing proportions' },
  { value: 'scatter' as const, label: 'Scatter Plot', description: 'Best for correlations between measures' },
  { value: 'radar' as const, label: 'Radar Chart', description: 'Best for multi-dimensional comparisons' },
  { value: 'radialBar' as const, label: 'Radial Bar Chart', description: 'Best for circular progress visualization' },
  { value: 'treemap' as const, label: 'TreeMap', description: 'Best for hierarchical data visualization' },
  { value: 'table' as const, label: 'Data Table', description: 'Best for detailed data view' }
]

const SAMPLE_QUERIES = [
  {
    name: 'Employee Count by Department',
    query: JSON.stringify({
      "measures": ["Employees.count"],
      "dimensions": ["Departments.name"],
      "order": { "Employees.count": "desc" }
    }, null, 2)
  },
  {
    name: 'Employee Hiring Trends',
    query: JSON.stringify({
      "measures": ["Employees.count"],
      "timeDimensions": [{
        "dimension": "Employees.createdAt",
        "granularity": "month"
      }],
      "order": { "Employees.createdAt": "asc" }
    }, null, 2)
  },
  {
    name: 'Department Budget Analysis',
    query: JSON.stringify({
      "measures": ["Departments.totalBudget", "Departments.avgBudget"],
      "dimensions": ["Departments.name"],
      "order": { "Departments.totalBudget": "desc" }
    }, null, 2)
  },
  {
    name: 'Daily Productivity Trends',
    query: JSON.stringify({
      "measures": ["Productivity.avgLinesOfCode", "Productivity.totalPullRequests"],
      "timeDimensions": [{
        "dimension": "Productivity.date",
        "granularity": "day"
      }],
      "order": { "Productivity.date": "asc" }
    }, null, 2)
  },
  {
    name: 'Happiness by Department',
    query: JSON.stringify({
      "measures": ["Productivity.avgHappinessIndex", "Productivity.workingDaysCount"],
      "dimensions": ["Departments.name"],
      "order": { "Productivity.avgHappinessIndex": "desc" }
    }, null, 2)
  },
  {
    name: 'Employee Salary Overview',
    query: JSON.stringify({
      "measures": ["Employees.count", "Employees.avgSalary", "Employees.totalSalary"],
      "dimensions": ["Employees.isActive"],
      "order": { "Employees.avgSalary": "desc" }
    }, null, 2)
  }
]

export default function PortletEditModal({
  isOpen,
  onClose,
  onSave,
  portlet,
  title,
  submitText,
  apiUrl = '/cubejs-api/v1'
}: PortletEditModalProps) {
  const [formTitle, setFormTitle] = useState('')
  const [query, setQuery] = useState('')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null)
  const [lastValidatedQuery, setLastValidatedQuery] = useState<string>('')
  const [dryRunData, setDryRunData] = useState<any>(null)
  const [chartConfig, setChartConfig] = useState<ChartAxisConfig>({ xAxis: [], yAxis: [], series: [] })
  const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>({ showLegend: true, stackedBarChart: false })
  const [originalQuery, setOriginalQuery] = useState<string>('')
  
  // Sensible defaults: slightly larger than 1/3 width with good aspect ratio
  const defaultWidth = 5
  const defaultHeight = 4

  // Helper function to get field styling based on type
  const getFieldStyling = (field: string) => {
    const isTimeDimension = availableFields?.timeDimensions?.includes(field) || false
    const isDimension = availableFields?.dimensions?.includes(field) || false
    const isMeasure = availableFields?.measures?.includes(field) || false

    if (isTimeDimension) {
      return {
        IconComponent: CalendarIcon,
        bgStyle: { backgroundColor: '#dbeafe', color: '#1e40af' },
        hoverBgColor: '#bfdbfe'
      }
    } else if (isDimension) {
      return {
        IconComponent: ChartBarIcon,
        bgStyle: { backgroundColor: '#fef3c7', color: '#92400e' },
        hoverBgColor: '#fde68a'
      }
    } else if (isMeasure) {
      return {
        IconComponent: ChartPieIcon,
        bgStyle: { backgroundColor: '#dcfce7', color: '#166534' },
        hoverBgColor: '#bbf7d0'
      }
    }
    
    // Default fallback
    return {
      IconComponent: ChartBarIcon,
      bgStyle: { backgroundColor: '#f3f4f6', color: '#374151' },
      hoverBgColor: '#e5e7eb'
    }
  }

  // Initialize form values when modal opens or portlet changes
  useEffect(() => {
    if (isOpen) {
      if (portlet) {
        // Edit mode - populate with existing data
        setFormTitle(portlet.title)
        const formattedQuery = (() => {
          try {
            return JSON.stringify(JSON.parse(portlet.query), null, 2)
          } catch {
            return portlet.query
          }
        })()
        setQuery(formattedQuery)
        setChartType(portlet.chartType)
        setChartConfig(portlet.chartConfig || { xAxis: [], yAxis: [], series: [] })
        setDisplayConfig({
          showLegend: portlet.displayConfig?.showLegend ?? true,
          stackedBarChart: portlet.displayConfig?.stackedBarChart ?? false
        })
        setOriginalQuery(formattedQuery)
        setLastValidatedQuery(formattedQuery)
        setValidationResult({ isValid: true, message: 'Loaded query (assumed valid)' })
        setDryRunData(null)
        
        // Auto-run dry-run validation for edit mode to enable chart configuration
        setTimeout(() => {
          runDryRunValidation(formattedQuery, true, true)
        }, 100)
      } else {
        // Create mode - clear form
        setFormTitle('')
        setQuery('')
        setChartType('bar')
        setChartConfig({ xAxis: [], yAxis: [], series: [] })
        setDisplayConfig({ showLegend: true, stackedBarChart: false })
        setOriginalQuery('')
        setLastValidatedQuery('')
        setValidationResult(null)
        setDryRunData(null)
      }
      setIsValidating(false)
    }
  }, [isOpen, portlet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formTitle.trim() || !query.trim()) {
      return
    }

    // Require validation before saving only if query has changed
    if (hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== '')) {
      alert('Please validate your query before saving.')
      return
    }

    // Validate JSON
    try {
      JSON.parse(query)
    } catch (e) {
      alert('Invalid JSON in query. Please check your syntax.')
      return
    }

    if (portlet) {
      // Edit mode - return full portlet config
      onSave({
        ...portlet,
        title: formTitle.trim(),
        query: query.trim(),
        chartType,
        chartConfig: (chartConfig.xAxis?.length ?? 0) > 0 || (chartConfig.yAxis?.length ?? 0) > 0 || (chartConfig.series && chartConfig.series.length > 0) ? chartConfig : undefined,
        displayConfig: displayConfig,
        w: portlet.w || defaultWidth,
        h: portlet.h || defaultHeight
      })
    } else {
      // Create mode - return partial config
      onSave({
        title: formTitle.trim(),
        query: query.trim(),
        chartType,
        chartConfig: (chartConfig.xAxis?.length ?? 0) > 0 || (chartConfig.yAxis?.length ?? 0) > 0 || (chartConfig.series && chartConfig.series.length > 0) ? chartConfig : undefined,
        displayConfig: displayConfig,
        w: defaultWidth,
        h: defaultHeight
      })
    }
  }

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery)
    setValidationResult(null)
    setLastValidatedQuery('')
    setDryRunData(null)
    setChartConfig({ xAxis: [], yAxis: [], series: [] })
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setValidationResult(null)
    setDryRunData(null)
    setChartConfig({ xAxis: [], yAxis: [], series: [] })
  }

  const runDryRunValidation = async (queryToValidate: string, silent = false, isEditModeLoad = false) => {
    if (!queryToValidate.trim()) {
      if (!silent) {
        setValidationResult({ isValid: false, message: 'Query cannot be empty' })
      }
      return
    }

    let parsedQuery
    try {
      parsedQuery = JSON.parse(queryToValidate)
    } catch (e) {
      if (!silent) {
        setValidationResult({ isValid: false, message: 'Invalid JSON syntax' })
      }
      return
    }

    if (!silent) {
      setIsValidating(true)
      setValidationResult(null)
    }

    try {
      const response = await fetch(`${apiUrl}/dry-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: parsedQuery
        })
      })

      const result = await response.json()

      if (response.ok && !result.error) {
        setDryRunData(result)
        
        if (!silent) {
          const details = []
          
          if (result.pivotQuery?.query) {
            if (result.pivotQuery.query.measures?.length > 0) {
              details.push(`${result.pivotQuery.query.measures.length} measure${result.pivotQuery.query.measures.length > 1 ? 's' : ''}`)
            }
            if (result.pivotQuery.query.dimensions?.length > 0) {
              details.push(`${result.pivotQuery.query.dimensions.length} dimension${result.pivotQuery.query.dimensions.length > 1 ? 's' : ''}`)
            }
            if (result.pivotQuery.query.filters?.length > 0) {
              details.push(`${result.pivotQuery.query.filters.length} filter${result.pivotQuery.query.filters.length > 1 ? 's' : ''}`)
            }
            if (result.pivotQuery.query.timeDimensions?.length > 0) {
              details.push(`${result.pivotQuery.query.timeDimensions.length} time dimension${result.pivotQuery.query.timeDimensions.length > 1 ? 's' : ''}`)
            }
          }

          if (result.complexity) {
            details.push(`${result.complexity} complexity`)
          }
          if (result.sql?.sql) {
            details.push('SQL generated')
          }
          if (result.cubesUsed?.length > 0) {
            details.push(`Cubes: ${result.cubesUsed.join(', ')}`)
          }
          
          const message = details.length > 0 ? `Query validated successfully (${details.join(', ')})` : 'Query validated successfully'
          setValidationResult({ isValid: true, message })
          setLastValidatedQuery(queryToValidate)
        }

        // Auto-populate chart config with sensible defaults on successful validation
        const queryHasChanged = queryToValidate.trim() !== originalQuery.trim()
        const shouldOverrideConfig = queryHasChanged || (!isEditModeLoad && ((chartConfig.xAxis?.length ?? 0) === 0 && (chartConfig.yAxis?.length ?? 0) === 0 && (!chartConfig.series || chartConfig.series.length === 0)))
        
        if (result.pivotQuery?.query && shouldOverrideConfig) {
          const timeDimensions = result.pivotQuery.query.timeDimensions?.map((td: any) => td.dimension) || []
          const regularDimensions = result.pivotQuery.query.dimensions || []
          const allMeasures = result.pivotQuery.query.measures || []
          
          const isDateLikeDimension = (dim: string) => {
            const lowerDim = dim.toLowerCase()
            return lowerDim.includes('date') || 
                   lowerDim.includes('time') || 
                   lowerDim.includes('created') || 
                   lowerDim.includes('updated') ||
                   lowerDim.includes('month') ||
                   lowerDim.includes('year') ||
                   lowerDim.includes('quarter') ||
                   lowerDim.includes('day') ||
                   lowerDim.includes('period')
          }
          
          const dateLikeDimensions = regularDimensions.filter(isDateLikeDimension)
          const nonDateDimensions = regularDimensions.filter((dim: string) => !isDateLikeDimension(dim))
          const allTimeDimensions = [...timeDimensions, ...dateLikeDimensions]
          
          let xAxisFields: string[] = []
          let seriesFields: string[] = []
          
          if (allTimeDimensions.length > 0) {
            xAxisFields = allTimeDimensions
            seriesFields = nonDateDimensions
          } else if (nonDateDimensions.length > 0) {
            xAxisFields = [nonDateDimensions[0]]
            seriesFields = nonDateDimensions.slice(1)
          }
          
          const newConfig = {
            xAxis: xAxisFields,
            yAxis: allMeasures,
            series: seriesFields
          }
          
          setChartConfig(newConfig)
        }
      } else {
        if (!silent) {
          const errorMsg = result.error || 'Query validation failed'
          const details = result.details ? ` - ${Array.isArray(result.details) ? result.details.join(', ') : result.details}` : ''
          setValidationResult({ 
            isValid: false, 
            message: errorMsg + details
          })
          setLastValidatedQuery(queryToValidate)
        }
      }
    } catch (error) {
      if (!silent) {
        setValidationResult({ 
          isValid: false, 
          message: error instanceof Error ? error.message : 'Network error during validation' 
        })
        setLastValidatedQuery(queryToValidate)
      }
    } finally {
      if (!silent) {
        setIsValidating(false)
      }
    }
  }

  const handleValidateQuery = async () => {
    await runDryRunValidation(query)
  }

  const handleClose = () => {
    setFormTitle('')
    setQuery('')
    setChartType('bar')
    setChartConfig({ xAxis: [], yAxis: [], series: [] })
    setDisplayConfig({ showLegend: true, stackedBarChart: false })
    setOriginalQuery('')
    setValidationResult(null)
    setIsValidating(false)
    setLastValidatedQuery('')
    setDryRunData(null)
    onClose()
  }

  const isEditMode = !!portlet
  const hasQueryChanged = query.trim() !== lastValidatedQuery.trim() && lastValidatedQuery !== ''
  const isQueryValidAndCurrent = validationResult?.isValid && query.trim() === lastValidatedQuery.trim()

  // Drag and drop handlers for chart configuration
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, field: string, fromAxis: 'xAxis' | 'yAxis' | 'series' | 'available') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ field, fromAxis }))
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toAxis: 'xAxis' | 'yAxis' | 'series') => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { field, fromAxis } = data

    setChartConfig(prev => {
      const newConfig = { ...prev }
      
      if (fromAxis === 'xAxis') {
        newConfig.xAxis = (newConfig.xAxis || []).filter(f => f !== field)
      } else if (fromAxis === 'yAxis') {
        newConfig.yAxis = (newConfig.yAxis || []).filter(f => f !== field)
      } else if (fromAxis === 'series' && newConfig.series) {
        newConfig.series = newConfig.series.filter(f => f !== field)
      }
      
      if (toAxis === 'xAxis' && !(newConfig.xAxis || []).includes(field)) {
        newConfig.xAxis = [...(newConfig.xAxis || []), field]
      } else if (toAxis === 'yAxis' && !(newConfig.yAxis || []).includes(field)) {
        newConfig.yAxis = [...(newConfig.yAxis || []), field]
      } else if (toAxis === 'series') {
        if (!newConfig.series) newConfig.series = []
        if (!newConfig.series.includes(field)) {
          newConfig.series = [...newConfig.series, field]
        }
      }
      
      return newConfig
    })
  }

  const handleRemoveFromAxis = (field: string, fromAxis: 'xAxis' | 'yAxis' | 'series') => {
    setChartConfig(prev => {
      if (fromAxis === 'series') {
        return {
          ...prev,
          series: prev.series ? prev.series.filter(f => f !== field) : []
        }
      }
      return {
        ...prev,
        [fromAxis]: (prev[fromAxis] || []).filter((f: string) => f !== field)
      }
    })
  }

  const availableFields = dryRunData?.pivotQuery?.query ? {
    dimensions: dryRunData.pivotQuery.query.dimensions || [],
    timeDimensions: dryRunData.pivotQuery.query.timeDimensions?.map((td: any) => td.dimension) || [],
    measures: dryRunData.pivotQuery.query.measures || []
  } : null

  const unassignedFields = availableFields ? {
    dimensions: availableFields.dimensions.filter((dim: string) => 
      !(chartConfig.xAxis || []).includes(dim) && !(chartConfig.yAxis || []).includes(dim) && !(chartConfig.series && chartConfig.series.includes(dim))
    ),
    timeDimensions: availableFields.timeDimensions.filter((dim: string) => 
      !(chartConfig.xAxis || []).includes(dim) && !(chartConfig.yAxis || []).includes(dim) && !(chartConfig.series && chartConfig.series.includes(dim))
    ),
    measures: availableFields.measures.filter((measure: string) => 
      !(chartConfig.xAxis || []).includes(measure) && !(chartConfig.yAxis || []).includes(measure) && !(chartConfig.series && chartConfig.series.includes(measure))
    )
  } : null

  const footer = (
    <>
      <button
        type="button"
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="portlet-form"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={!formTitle.trim() || !query.trim() || (hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== ''))}
        title={(hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== '')) ? "Please validate your query before saving" : ""}
      >
        {submitText}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="xl"
      footer={footer}
    >
      <form id="portlet-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Main layout - Split into left and right */}
        <div style={{ display: 'flex', gap: '1rem', height: '550px' }}>
          {/* Left side - Title, Chart Type, Query */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter portlet title..."
                required
                autoFocus
              />
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Chart Type
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CHART_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>


            {/* Query Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Cube.js Query (JSON)
                </label>
                <a
                  href="/cubejs-api/v1/meta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View Cube Meta →
                </a>
              </div>
              <textarea
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                style={{ flex: 1, width: '100%' }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs resize-none"
                placeholder={`{
  "measures": ["People.count"],
  "dimensions": ["People.active"]
}`}
                required
              />
            </div>
          </div>

          {/* Right side - Chart Configuration */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Chart Axis Configuration
            </label>
            
            {!dryRunData || !isQueryValidAndCurrent ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="text-center text-gray-500">
                  <svg className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <p className="text-sm">Validate query first to configure chart axes</p>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }} className="rounded-lg bg-white p-3">
                {/* Available Fields */}
                {unassignedFields && (unassignedFields.dimensions.length > 0 || unassignedFields.timeDimensions.length > 0 || unassignedFields.measures.length > 0) && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Available Fields</h4>
                    <div className="space-y-1">
                      {unassignedFields.dimensions.map((dim: string) => (
                        <div
                          key={dim}
                          draggable
                          onDragStart={(e) => handleDragStart(e, dim, 'available')}
                          className="rounded text-xs cursor-move border"
                          style={{ padding: '8px 12px', backgroundColor: '#fef3c7', color: '#92400e' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                        >
                          <span className="flex items-center"><ChartBarIcon style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} /><span>{dim}</span></span>
                        </div>
                      ))}
                      {unassignedFields.timeDimensions.map((dim: string) => (
                        <div
                          key={dim}
                          draggable
                          onDragStart={(e) => handleDragStart(e, dim, 'available')}
                          className="rounded text-xs cursor-move border"
                          style={{ padding: '8px 12px', backgroundColor: '#dbeafe', color: '#1e40af' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bfdbfe'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                        >
                          <span className="flex items-center"><CalendarIcon style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} /><span>{dim}</span></span>
                        </div>
                      ))}
                      {unassignedFields.measures.map((measure: string) => (
                        <div
                          key={measure}
                          draggable
                          onDragStart={(e) => handleDragStart(e, measure, 'available')}
                          className="rounded text-xs cursor-move border"
                          style={{ padding: '8px 12px', backgroundColor: '#dcfce7', color: '#166534' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bbf7d0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'}
                        >
                          <span className="flex items-center"><ChartPieIcon style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} /><span>{measure}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* X-Axis */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold mb-2">X-Axis (Categories)</h4>
                  <div
                    className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'xAxis')}
                  >
                    {(chartConfig.xAxis?.length ?? 0) === 0 ? (
                      <div className="text-xs text-gray-500 text-center">Drop dimensions & time dimensions here</div>
                    ) : (
                      <div className="space-y-1">
                        {(chartConfig.xAxis || []).map((field) => {
                          const { IconComponent, bgStyle, hoverBgColor } = getFieldStyling(field)
                          return (
                            <div
                              key={field}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field, 'xAxis')}
                              className="rounded text-xs cursor-move border flex items-center justify-between"
                              style={{ padding: '8px 12px', ...bgStyle }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgColor}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgStyle.backgroundColor}
                            >
                              <span className="flex items-center"><IconComponent style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} /><span>{field}</span></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromAxis(field, 'xAxis')}
                                className="text-blue-700 hover:text-red-600 ml-2"
                                title="Remove from X-axis"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Y-Axis */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold mb-2">Y-Axis (Values & Series)</h4>
                  <div className="text-xs text-gray-600 mb-2">
                    <span className="flex items-center"><ChartPieIcon style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} />Measures = numeric values • <ChartBarIcon style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} />Dimensions = separate series</span>
                  </div>
                  <div
                    className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'yAxis')}
                  >
                    {(chartConfig.yAxis?.length ?? 0) === 0 ? (
                      <div className="text-xs text-gray-500 text-center">Drop measures or dimensions here</div>
                    ) : (
                      <div className="space-y-1">
                        {(chartConfig.yAxis || []).map((field) => {
                          const { IconComponent, bgStyle, hoverBgColor } = getFieldStyling(field)
                          
                          return (
                            <div
                              key={field}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field, 'yAxis')}
                              className="rounded text-xs cursor-move border flex items-center justify-between"
                              style={{ padding: '8px 12px', ...bgStyle }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgColor}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgStyle.backgroundColor}
                            >
                              <span className="flex items-center"><IconComponent style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} /><span>{field}</span></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromAxis(field, 'yAxis')}
                                className="text-gray-600 hover:text-red-600 ml-2"
                                title="Remove from Y-axis"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Series */}
                <div className="mb-3">
                  <h4 className="text-xs font-semibold mb-2">Series (Split into Multiple Series)</h4>
                  <div className="text-xs text-gray-600 mb-2">
                    <span className="flex items-center"><ChartBarIcon style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} />Drop dimensions here to create separate data series</span>
                  </div>
                  <div
                    className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'series')}
                  >
                    {!chartConfig.series || chartConfig.series.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center">Drop dimensions here to split data into series</div>
                    ) : (
                      <div className="space-y-1">
                        {chartConfig.series.map((field) => {
                          const { IconComponent, bgStyle, hoverBgColor } = getFieldStyling(field)
                          return (
                            <div
                              key={field}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field, 'series')}
                              className="rounded text-xs cursor-move border flex items-center justify-between"
                              style={{ padding: '8px 12px', ...bgStyle }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgColor}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgStyle.backgroundColor}
                            >
                              <span className="flex items-center"><IconComponent style={{ width: '14px', height: '14px', marginRight: '4px', flexShrink: 0 }} /><span>{field}</span></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromAxis(field, 'series')}
                                className="text-orange-700 hover:text-red-600 ml-2"
                                title="Remove from Series"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Display Options */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Display Options</h4>
                  <div className="rounded-lg bg-gray-50 p-2 space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={displayConfig.showLegend}
                        onChange={(e) => setDisplayConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
                      />
                      <span className="ml-2 text-xs text-gray-700">Show Legend</span> 
                    </label>
                    {chartType === 'bar' && (
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={displayConfig.stackedBarChart || false}
                          onChange={(e) => setDisplayConfig(prev => ({ ...prev, stackedBarChart: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
                        />
                        <span className="ml-2 text-xs text-gray-700">Stacked Bar Chart</span> 
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Validation section */}
        {(hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== '') || (validationResult && query.trim() === lastValidatedQuery.trim() && validationResult.message !== 'Loaded query (assumed valid)')) && (
          <div className={`rounded-lg p-4 ${
            validationResult?.isValid && query.trim() === lastValidatedQuery.trim()
              ? 'bg-green-50'
              : validationResult && !validationResult.isValid
              ? 'bg-red-50'
              : hasQueryChanged
              ? 'bg-amber-50'
              : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  validationResult?.isValid && query.trim() === lastValidatedQuery.trim()
                    ? 'bg-green-500'
                    : validationResult && !validationResult.isValid
                    ? 'bg-red-500'
                    : hasQueryChanged
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                }`}></div>
                <div>
                  <h3 className={`text-sm font-medium ${
                    validationResult?.isValid && query.trim() === lastValidatedQuery.trim()
                      ? 'text-green-800'
                      : validationResult && !validationResult.isValid
                      ? 'text-red-800'
                      : hasQueryChanged
                      ? 'text-amber-800'
                      : 'text-gray-700'
                  }`}>
                    {validationResult?.isValid && query.trim() === lastValidatedQuery.trim()
                      ? 'Query validated successfully'
                      : validationResult && !validationResult.isValid
                      ? 'Query validation failed'
                      : hasQueryChanged
                      ? 'Query modified - validation required'
                      : 'Query validation required'
                    }
                  </h3>
                  {validationResult && (
                    <p className={`text-xs mt-1 ${
                      validationResult.isValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {validationResult.message}
                    </p>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleValidateQuery}
                disabled={isValidating || !query.trim()}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-1.5 ${
                  validationResult?.isValid && query.trim() === lastValidatedQuery.trim()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : validationResult && !validationResult.isValid
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isValidating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Validating</span>
                  </>
                ) : validationResult?.isValid && query.trim() === lastValidatedQuery.trim() ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Validated</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Validate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sample Queries - only show for create mode */}
        {!isEditMode && (
          <div>
            <label className="block text-sm text-gray-600 mb-2">Sample Queries (click to use)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {SAMPLE_QUERIES.map((sample, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSampleQuery(sample.query)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    margin: '2px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}