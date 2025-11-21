import React, { useState, useEffect, useRef } from 'react'
import Modal from './Modal'
import QueryBuilder from './QueryBuilder'
import ChartConfigPanel from './ChartConfigPanel'
import ChartTypeSelector from './ChartTypeSelector'
import { useCubeContext } from '../providers/CubeProvider'
import { chartConfigRegistry } from '../charts/chartConfigRegistry'
import { getChartConfig } from '../charts/chartConfigs'
import type { PortletConfig, ChartAxisConfig, ChartDisplayConfig, ChartType, ColorPalette } from '../types'

interface PortletEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void
  portlet?: PortletConfig | null
  title: string
  submitText: string
  colorPalette?: ColorPalette
}


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
  colorPalette
}: PortletEditModalProps) {
  // Get cube client from context
  const { cubeApi } = useCubeContext()
  const [formTitle, setFormTitle] = useState('')
  const [query, setQuery] = useState('')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [dashboardFilterMapping, setDashboardFilterMapping] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null)
  const [lastValidatedQuery, setLastValidatedQuery] = useState<string>('')
  const [dryRunData, setDryRunData] = useState<any>(null)
  const [chartConfig, setChartConfig] = useState<ChartAxisConfig>({ xAxis: [], yAxis: [], series: [] })
  const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>({ showLegend: true, showGrid: true, showTooltip: true, stacked: false })
  const [showQueryBuilder, setShowQueryBuilder] = useState(false)
  const [queryBuilderInitialQuery, setQueryBuilderInitialQuery] = useState<any>(null)
  const queryBuilderRef = useRef<any>(null)

  // Check if current chart type skips queries
  const chartTypeConfig = getChartConfig(chartType, chartConfigRegistry)
  const shouldSkipQuery = chartTypeConfig.skipQuery === true

  // Validation only - no automatic chart config changes
  const autoPopulateChartConfig = (_result: any) => {
    // Do nothing - let the chart configuration panel handle all axis assignments manually
    // This preserves any existing user configuration and doesn't auto-assign fields
  }
  
  // Sensible defaults: slightly larger than 1/3 width with good aspect ratio
  const defaultWidth = 5
  const defaultHeight = 4


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
        setDisplayConfig(portlet.displayConfig || {})
        setDashboardFilterMapping(portlet.dashboardFilterMapping || [])
        setLastValidatedQuery(formattedQuery)
        setValidationResult({ isValid: true, message: 'Loaded query (assumed valid)' })
        setDryRunData(null)

        // Auto-run dry-run validation for edit mode to enable chart configuration (skip for skipQuery charts)
        if (!shouldSkipQuery) {
          setTimeout(() => {
            runDryRunValidation(formattedQuery, true, true)
          }, 100)
        }
      } else {
        // Create mode - clear form
        setFormTitle('')
        setQuery('')
        setChartType('bar')
        setChartConfig({ xAxis: [], yAxis: [], series: [] })
        setDisplayConfig({ showLegend: true, showGrid: true, showTooltip: true, stacked: false })
        setDashboardFilterMapping([])
        setLastValidatedQuery('')
        setValidationResult(null)
        setDryRunData(null)
      }
      setIsValidating(false)
    }
  }, [isOpen, portlet])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // For skipQuery charts, only validate title
    if (shouldSkipQuery) {
      if (!formTitle.trim()) {
        return
      }
    } else {
      // For normal charts, validate both title and query
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
    }

    // Prepare query - use minimal query for skipQuery charts
    const queryToSave = shouldSkipQuery ? '{"measures":[]}' : query.trim()

    if (portlet) {
      // Edit mode - return full portlet config
      onSave({
        ...portlet,
        title: formTitle.trim(),
        query: queryToSave,
        chartType,
        chartConfig: Object.keys(chartConfig).length > 0 ? chartConfig : undefined,
        displayConfig: displayConfig,
        dashboardFilterMapping: dashboardFilterMapping.length > 0 ? dashboardFilterMapping : undefined,
        w: portlet.w || defaultWidth,
        h: portlet.h || defaultHeight
      })
    } else {
      // Create mode - return partial config
      onSave({
        title: formTitle.trim(),
        query: queryToSave,
        chartType,
        chartConfig: Object.keys(chartConfig).length > 0 ? chartConfig : undefined,
        displayConfig: displayConfig,
        dashboardFilterMapping: dashboardFilterMapping.length > 0 ? dashboardFilterMapping : undefined,
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
    // Sample queries always clear chart config since they're completely different
    setChartConfig({ xAxis: [], yAxis: [], series: [] })
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setValidationResult(null)
    setDryRunData(null)
    // Only clear chart config for new portlets, preserve existing config for edits
    if (!portlet) {
      setChartConfig({ xAxis: [], yAxis: [], series: [] })
    }
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
      const result = await cubeApi.dryRun(parsedQuery)

      // Check if validation is successful:
      // 1. Must have queryType (always present in successful Cube.js responses)  
      // 2. Must not have an error
      const isValid = !result.error && result.queryType
      
      if (isValid) {
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
        if (!isEditModeLoad) {
          autoPopulateChartConfig(result)
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

  const handleOpenQueryBuilder = () => {
    // Parse the current query and set it as the initial query for QueryBuilder
    const initialQuery = query ? (() => {
      try {
        return JSON.parse(query)
      } catch {
        return {}
      }
    })() : {}
    
    setQueryBuilderInitialQuery(initialQuery)
    setShowQueryBuilder(true)
  }


  const handleApplyQueryBuilderQuery = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    if (!queryBuilderRef.current) return
    
    // Get current query and validation state from QueryBuilder
    const currentQuery = queryBuilderRef.current.getCurrentQuery()
    const validationState = queryBuilderRef.current.getValidationState()
    const validationResult = queryBuilderRef.current.getValidationResult()
    
    // Apply the query to the form
    const formattedQuery = JSON.stringify(currentQuery, null, 2)
    setQuery(formattedQuery)
    
    // If QueryBuilder had a valid query, transfer the validation state and dry-run data
    if (validationState?.status === 'valid' && validationResult) {
      setValidationResult({ 
        isValid: true, 
        message: 'Query validated in Query Builder' 
      })
      setLastValidatedQuery(formattedQuery)
      
      // Transfer the dry-run data from QueryBuilder validation result
      setDryRunData(validationResult)
      
      // Auto-populate chart config using the same logic as form validation
      autoPopulateChartConfig(validationResult)
    } else {
      // Reset validation state if query wasn't validated in QueryBuilder
      setValidationResult(null)
      setLastValidatedQuery('')
      setDryRunData(null)
    }
    
    // Return to form view to continue editing
    setShowQueryBuilder(false)
  }

  const handleBackToForm = () => {
    setShowQueryBuilder(false)
    setQueryBuilderInitialQuery(null)
  }

  const handleClose = () => {
    setFormTitle('')
    setQuery('')
    setChartType('bar')
    setChartConfig({ xAxis: [], yAxis: [], series: [] })
    setDisplayConfig({ showLegend: true, showGrid: true, showTooltip: true, stacked: false })
    setValidationResult(null)
    setIsValidating(false)
    setLastValidatedQuery('')
    setDryRunData(null)
    setShowQueryBuilder(false)
    setQueryBuilderInitialQuery(null)
    onClose()
  }

  const isEditMode = !!portlet
  const hasQueryChanged = query.trim() !== lastValidatedQuery.trim() && lastValidatedQuery !== ''
  const isQueryValidAndCurrent = validationResult?.isValid && query.trim() === lastValidatedQuery.trim()


  const availableFields = dryRunData?.pivotQuery?.query ? {
    dimensions: dryRunData.pivotQuery.query.dimensions || [],
    timeDimensions: dryRunData.pivotQuery.query.timeDimensions?.map((td: any) => td.dimension) || [],
    measures: dryRunData.pivotQuery.query.measures || []
  } : null


  const footer = showQueryBuilder ? (
    <>
      <button
        type="button"
        onClick={handleBackToForm}
        className="px-4 py-2 text-sm font-medium text-dc-text-secondary bg-dc-surface border border-dc-border rounded-md hover:bg-dc-surface-hover focus:outline-none focus:ring-2 focus:ring-dc-primary"
      >
        Back to Form
      </button>
      <button
        type="button"
        onClick={handleApplyQueryBuilderQuery}
        className="px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ backgroundColor: 'var(--dc-primary)', color: '#ffffff' }}
        title="Apply query to form"
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-primary-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-primary)'}
      >
        Apply Query
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-dc-text-secondary bg-dc-surface border border-dc-border rounded-md hover:bg-dc-surface-hover focus:outline-none focus:ring-2 focus:ring-dc-primary"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="portlet-form"
        className="px-4 py-2 text-sm font-medium border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ backgroundColor: 'var(--dc-primary)', color: '#ffffff' }}
        disabled={shouldSkipQuery ? !formTitle.trim() : (!formTitle.trim() || !query.trim() || (hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== '')))}
        title={!shouldSkipQuery && (hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== '')) ? "Please validate your query before saving" : ""}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-primary-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-primary)'}
      >
        {submitText}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showQueryBuilder ? "Query Builder" : title}
      size="fullscreen-mobile"
      footer={footer}
      noPadding={showQueryBuilder}
    >
      {showQueryBuilder ? (
        <QueryBuilder
          ref={queryBuilderRef}
          initialQuery={queryBuilderInitialQuery}
          disableLocalStorage={true}
          hideSettings={true}
          className="flex-1 w-full"
        />
      ) : (
        <form id="portlet-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Main layout - Responsive: single column on mobile, two columns on desktop */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left side - Title, Chart Type, Query */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-dc-text-secondary mb-1">
                Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 border border-dc-border rounded-md bg-dc-surface text-dc-text focus:outline-none focus:ring-2 focus:ring-dc-primary focus:border-dc-primary"
                placeholder="Enter portlet title..."
                required
              />
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm font-semibold text-dc-text-secondary mb-3">
                Chart Type
              </label>
              <ChartTypeSelector
                selectedType={chartType}
                onTypeChange={setChartType}
              />
            </div>


            {/* Query Editor - Hidden for skipQuery charts */}
            {!shouldSkipQuery && (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-dc-text-secondary">
                    Cube.js Query (JSON)
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleOpenQueryBuilder}
                      className="text-xs px-2 py-1 text-purple-600 dark:text-purple-300 bg-dc-surface hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-sm border border-purple-600 dark:border-purple-700 hover:border-purple-700 dark:hover:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      Edit in Query Builder
                    </button>
                  </div>
                </div>
                <textarea
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  className="flex-1 w-full min-h-64 px-3 py-2 border border-dc-border rounded-md bg-dc-surface text-dc-text focus:outline-none focus:ring-2 focus:ring-dc-primary focus:border-dc-primary font-mono text-xs resize-y"
                  placeholder={`{
  "measures": ["People.count"],
  "dimensions": ["People.active"]
}`}
                  required
                />
              </div>
            )}
          </div>

          {/* Right side - Chart Configuration */}
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-semibold text-dc-text-secondary mb-1">
              {shouldSkipQuery ? 'Chart Configuration' : 'Chart Axis Configuration'}
            </label>

            {shouldSkipQuery ? (
              <div className="rounded-lg bg-dc-surface p-3 border border-dc-border">
                <ChartConfigPanel
                  chartType={chartType}
                  chartConfig={chartConfig}
                  displayConfig={displayConfig}
                  availableFields={null}
                  colorPalette={colorPalette}
                  onChartConfigChange={setChartConfig}
                  onDisplayConfigChange={setDisplayConfig}
                />
              </div>
            ) : (!dryRunData || !isQueryValidAndCurrent) ? (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-dc-border rounded-lg bg-dc-surface-secondary">
                <div className="text-center text-dc-text-muted">
                  <svg className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <p className="text-sm">Validate query first to configure chart axes</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-dc-surface p-3 border border-dc-border">
                <ChartConfigPanel
                  chartType={chartType}
                  chartConfig={chartConfig}
                  displayConfig={displayConfig}
                  availableFields={availableFields}
                  colorPalette={colorPalette}
                  onChartConfigChange={setChartConfig}
                  onDisplayConfigChange={setDisplayConfig}
                />
              </div>
            )}
          </div>
        </div>

        {/* Validation section - Hidden for skipQuery charts */}
        {!shouldSkipQuery && (hasQueryChanged || (lastValidatedQuery === '' && query.trim() !== '') || (validationResult && query.trim() === lastValidatedQuery.trim() && validationResult.message !== 'Loaded query (assumed valid)')) && (
          <div className={`rounded-lg p-4 ${
            validationResult?.isValid && query.trim() === lastValidatedQuery.trim()
              ? 'bg-green-50 dark:bg-green-900/30'
              : validationResult && !validationResult.isValid
              ? 'bg-red-50 dark:bg-red-900/30'
              : hasQueryChanged
              ? 'bg-amber-50 dark:bg-amber-900/30'
              : 'bg-dc-surface-secondary'
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
                      ? 'text-green-800 dark:text-green-300'
                      : validationResult && !validationResult.isValid
                      ? 'text-red-800 dark:text-red-300'
                      : hasQueryChanged
                      ? 'text-amber-800 dark:text-amber-300'
                      : 'text-dc-text-secondary'
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
                      validationResult.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
                    : 'bg-dc-primary text-white hover:bg-dc-primary-hover'
                } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dc-primary`}
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
            <label className="block text-sm text-dc-text-muted mb-2">Sample Queries (click to use)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SAMPLE_QUERIES.map((sample, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSampleQuery(sample.query)}
                  className="px-2 py-1 text-xs text-dc-text-secondary bg-dc-surface-secondary border border-dc-border rounded-sm cursor-pointer transition-all duration-200 ease-in-out hover:bg-dc-surface-hover hover:border-dc-border m-0.5"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        )}
        </form>
      )}
    </Modal>
  )
}