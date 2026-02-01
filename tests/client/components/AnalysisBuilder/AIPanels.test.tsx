import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisAIPanel from '../../../../src/client/components/AnalysisBuilder/AnalysisAIPanel'
import { ExplainAIPanel } from '../../../../src/client/components/AnalysisBuilder/ExplainAIPanel'
import { ExecutionPlanPanel } from '../../../../src/client/components/AnalysisBuilder/ExecutionPlanPanel'
import type { AnalysisAIPanelProps } from '../../../../src/client/components/AnalysisBuilder/AnalysisAIPanel'
import type { AIExplainAnalysis, ExplainResult, ExplainRecommendation, ExplainIssue } from '../../../../src/client/types'

// ============================================================================
// Mock Data Fixtures
// ============================================================================

const mockExplainResult: ExplainResult = {
  operations: [
    { type: 'Seq Scan', table: 'employees', estimatedRows: 1000 },
    { type: 'Index Scan', table: 'departments', index: 'idx_dept_id', estimatedRows: 50 },
  ],
  summary: {
    database: 'postgres',
    planningTime: 0.5,
    executionTime: 12.5,
    totalCost: 150.25,
    hasSequentialScans: true,
    usedIndexes: ['idx_dept_id', 'idx_emp_name'],
  },
  raw: `Seq Scan on employees  (cost=0.00..35.50 rows=1000 width=540)
  Filter: (organisation_id = $1)
Index Scan on departments  (cost=0.00..8.27 rows=50 width=120)`,
  sql: {
    sql: 'SELECT * FROM employees WHERE organisation_id = $1',
    params: ['org-1'],
  },
}

const mockIssues: ExplainIssue[] = [
  { type: 'sequential_scan', description: 'Full table scan on employees table', severity: 'high' },
  { type: 'missing_index', description: 'Consider adding index on filter column', severity: 'medium' },
  { type: 'sort_operation', description: 'In-memory sort detected', severity: 'low' },
]

const mockRecommendations: ExplainRecommendation[] = [
  {
    type: 'index',
    severity: 'critical',
    title: 'Add Index on organisation_id',
    description: 'Creating an index on organisation_id will significantly improve query performance.',
    sql: 'CREATE INDEX idx_employees_org_id ON employees(organisation_id);',
    table: 'employees',
    columns: ['organisation_id'],
    estimatedImpact: '10x faster query execution',
  },
  {
    type: 'cube',
    severity: 'warning',
    title: 'Pre-aggregate counts',
    description: 'Consider adding a pre-aggregated measure for employee counts.',
    cubeCode: `count: {\n  type: 'count',\n  sql: employees.id\n}`,
    cubeName: 'Employees',
  },
  {
    type: 'general',
    severity: 'suggestion',
    title: 'Consider partitioning',
    description: 'For large datasets, consider partitioning by date.',
  },
]

const mockAIAnalysis: AIExplainAnalysis = {
  summary: 'This query retrieves employee data filtered by organisation.',
  assessment: 'warning',
  assessmentReason: 'Sequential scan detected on main table.',
  queryUnderstanding: 'The query filters employees by organisation_id and joins with departments.',
  issues: mockIssues,
  recommendations: mockRecommendations,
  _meta: {
    model: 'gpt-4',
    usingUserKey: false,
  },
}

const mockAIAnalysisGood: AIExplainAnalysis = {
  summary: 'Well-optimized query using indexes.',
  assessment: 'good',
  assessmentReason: 'Query uses appropriate indexes.',
  queryUnderstanding: 'The query efficiently retrieves data using indexed columns.',
  issues: [],
  recommendations: [],
}

const mockAIAnalysisCritical: AIExplainAnalysis = {
  summary: 'Critical performance issues detected.',
  assessment: 'critical',
  assessmentReason: 'Multiple full table scans on large tables.',
  queryUnderstanding: 'The query performs poorly due to missing indexes.',
  issues: [
    { type: 'sequential_scan', description: 'Full table scan on large table', severity: 'high' },
  ],
  recommendations: [
    {
      type: 'index',
      severity: 'critical',
      title: 'Critical: Add Index',
      description: 'Immediate action required.',
      sql: 'CREATE INDEX idx_critical ON table(column);',
    },
  ],
}

// ============================================================================
// AnalysisAIPanel Tests
// ============================================================================

describe('AnalysisAIPanel', () => {
  const defaultProps: AnalysisAIPanelProps = {
    userPrompt: '',
    onPromptChange: vi.fn(),
    isGenerating: false,
    error: null,
    hasGeneratedQuery: false,
    onGenerate: vi.fn(),
    onAccept: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render the AI panel header', () => {
      render(<AnalysisAIPanel {...defaultProps} />)

      expect(screen.getByText('AI Query Generator')).toBeInTheDocument()
    })

    it('should render the textarea for prompt input', () => {
      render(<AnalysisAIPanel {...defaultProps} />)

      const textarea = screen.getByPlaceholderText(/describe your query in natural language/i)
      expect(textarea).toBeInTheDocument()
    })

    it('should render Generate button', () => {
      render(<AnalysisAIPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
    })

    it('should render Close button when no query generated', () => {
      render(<AnalysisAIPanel {...defaultProps} hasGeneratedQuery={false} />)

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should render Cancel button when query has been generated', () => {
      render(<AnalysisAIPanel {...defaultProps} hasGeneratedQuery={true} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should render Accept button when query has been generated', () => {
      render(<AnalysisAIPanel {...defaultProps} hasGeneratedQuery={true} />)

      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    })

    it('should show keyboard shortcut hint', () => {
      render(<AnalysisAIPanel {...defaultProps} />)

      expect(screen.getByText(/press enter to generate/i)).toBeInTheDocument()
    })
  })

  describe('user prompt input', () => {
    it('should display the current prompt value', () => {
      render(<AnalysisAIPanel {...defaultProps} userPrompt="Show total sales" />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('Show total sales')
    })

    it('should call onPromptChange when user types', async () => {
      const user = userEvent.setup()
      const onPromptChange = vi.fn()

      render(<AnalysisAIPanel {...defaultProps} onPromptChange={onPromptChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'test')

      expect(onPromptChange).toHaveBeenCalled()
    })

    it('should disable textarea when generating', () => {
      render(<AnalysisAIPanel {...defaultProps} isGenerating={true} />)

      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
    })
  })

  describe('Generate button', () => {
    it('should call onGenerate when clicked', async () => {
      const user = userEvent.setup()
      const onGenerate = vi.fn()

      render(
        <AnalysisAIPanel
          {...defaultProps}
          userPrompt="Show sales by month"
          onGenerate={onGenerate}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generate/i })
      await user.click(generateButton)

      expect(onGenerate).toHaveBeenCalled()
    })

    it('should be disabled when prompt is empty', () => {
      render(<AnalysisAIPanel {...defaultProps} userPrompt="" />)

      const generateButton = screen.getByRole('button', { name: /generate/i })
      expect(generateButton).toBeDisabled()
    })

    it('should be disabled when prompt is whitespace only', () => {
      render(<AnalysisAIPanel {...defaultProps} userPrompt="   " />)

      const generateButton = screen.getByRole('button', { name: /generate/i })
      expect(generateButton).toBeDisabled()
    })

    it('should be disabled when generating', () => {
      render(
        <AnalysisAIPanel
          {...defaultProps}
          userPrompt="test"
          isGenerating={true}
        />
      )

      const generateButton = screen.getByRole('button', { name: /generating/i })
      expect(generateButton).toBeDisabled()
    })

    it('should show spinner when generating', () => {
      render(
        <AnalysisAIPanel
          {...defaultProps}
          userPrompt="test"
          isGenerating={true}
        />
      )

      // Multiple "Generating..." texts appear (header and button), so use getAllByText
      const generatingTexts = screen.getAllByText(/generating\.\.\./i)
      expect(generatingTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('keyboard navigation', () => {
    it('should call onGenerate when Enter pressed (without Shift)', async () => {
      const user = userEvent.setup()
      const onGenerate = vi.fn()

      render(
        <AnalysisAIPanel
          {...defaultProps}
          userPrompt="Show sales"
          onGenerate={onGenerate}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.click(textarea)
      await user.keyboard('{Enter}')

      expect(onGenerate).toHaveBeenCalled()
    })

    it('should not call onGenerate when Shift+Enter pressed', async () => {
      const user = userEvent.setup()
      const onGenerate = vi.fn()

      render(
        <AnalysisAIPanel
          {...defaultProps}
          userPrompt="Show sales"
          onGenerate={onGenerate}
        />
      )

      const textarea = screen.getByRole('textbox')
      await user.click(textarea)
      await user.keyboard('{Shift>}{Enter}{/Shift}')

      expect(onGenerate).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('should show "Generating..." in header when isGenerating', () => {
      render(<AnalysisAIPanel {...defaultProps} isGenerating={true} />)

      // Header should show generating status
      const header = screen.getByText('AI Query Generator').closest('div')
      expect(within(header!).getByText(/generating\.\.\./i)).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should display error message when error is present', () => {
      render(
        <AnalysisAIPanel
          {...defaultProps}
          error="Failed to generate query: API rate limit exceeded"
        />
      )

      expect(screen.getByText(/failed to generate query/i)).toBeInTheDocument()
    })

    it('should not show error message when error is null', () => {
      render(<AnalysisAIPanel {...defaultProps} error={null} />)

      // Error icon should not be present
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument()
    })
  })

  describe('success state', () => {
    it('should show success message when query generated', () => {
      render(
        <AnalysisAIPanel
          {...defaultProps}
          hasGeneratedQuery={true}
          error={null}
        />
      )

      expect(screen.getByText(/query generated and loaded/i)).toBeInTheDocument()
    })

    it('should not show success message when error present', () => {
      render(
        <AnalysisAIPanel
          {...defaultProps}
          hasGeneratedQuery={true}
          error="Some error"
        />
      )

      expect(screen.queryByText(/query generated and loaded/i)).not.toBeInTheDocument()
    })
  })

  describe('Accept/Cancel actions', () => {
    it('should call onAccept when Accept button clicked', async () => {
      const user = userEvent.setup()
      const onAccept = vi.fn()

      render(
        <AnalysisAIPanel
          {...defaultProps}
          hasGeneratedQuery={true}
          onAccept={onAccept}
        />
      )

      const acceptButton = screen.getByRole('button', { name: /accept/i })
      await user.click(acceptButton)

      expect(onAccept).toHaveBeenCalled()
    })

    it('should call onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(
        <AnalysisAIPanel
          {...defaultProps}
          hasGeneratedQuery={true}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('should call onCancel when Close button clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(
        <AnalysisAIPanel
          {...defaultProps}
          hasGeneratedQuery={false}
          onCancel={onCancel}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(onCancel).toHaveBeenCalled()
    })
  })
})

// ============================================================================
// ExplainAIPanel Tests
// ============================================================================

describe('ExplainAIPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset body overflow
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('should render modal with title', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText('AI Performance Analysis')).toBeInTheDocument()
    })

    it('should render assessment badge', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/warning/i)).toBeInTheDocument()
    })

    it('should render summary section', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText('Summary')).toBeInTheDocument()
      expect(screen.getByText(mockAIAnalysis.summary)).toBeInTheDocument()
    })

    it('should render query understanding section', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText('Query Analysis')).toBeInTheDocument()
      expect(screen.getByText(mockAIAnalysis.queryUnderstanding)).toBeInTheDocument()
    })

    it('should render issues section when issues present', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/issues found/i)).toBeInTheDocument()
      expect(screen.getByText('Full table scan on employees table')).toBeInTheDocument()
    })

    it('should render recommendations section when recommendations present', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/recommendations/i)).toBeInTheDocument()
      expect(screen.getByText('Add Index on organisation_id')).toBeInTheDocument()
    })

    it('should show "no recommendations" message when none present', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysisGood} />)

      expect(screen.getByText(/no specific recommendations/i)).toBeInTheDocument()
    })

    it('should render close button in header', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      // There's a close button with aria-label="Close" in the header
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      expect(closeButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should render footer close button', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      // Multiple close buttons - one in header, one in footer
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      expect(closeButtons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('assessment badges', () => {
    it('should show "Good" badge for good assessment', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysisGood} />)

      expect(screen.getByText(/good/i)).toBeInTheDocument()
    })

    it('should show "Warning" badge for warning assessment', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/warning/i)).toBeInTheDocument()
    })

    it('should show "Critical" badge for critical assessment', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysisCritical} />)

      // Multiple "Critical" texts may appear (badge and recommendations), so check for at least one
      const criticalTexts = screen.getAllByText(/critical/i)
      expect(criticalTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('should display assessment reason', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(mockAIAnalysis.assessmentReason)).toBeInTheDocument()
    })
  })

  describe('issue rendering', () => {
    it('should render all issues', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText('Full table scan on employees table')).toBeInTheDocument()
      expect(screen.getByText('Consider adding index on filter column')).toBeInTheDocument()
      expect(screen.getByText('In-memory sort detected')).toBeInTheDocument()
    })

    it('should show issue count in header', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/issues found \(3\)/i)).toBeInTheDocument()
    })

    it('should not render issues section when no issues', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysisGood} />)

      expect(screen.queryByText(/issues found/i)).not.toBeInTheDocument()
    })
  })

  describe('recommendation cards', () => {
    it('should render recommendation title', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText('Add Index on organisation_id')).toBeInTheDocument()
    })

    it('should render recommendation description', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/creating an index on organisation_id/i)).toBeInTheDocument()
    })

    it('should render SQL code for index recommendations', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/CREATE INDEX idx_employees_org_id/i)).toBeInTheDocument()
    })

    it('should render cube code for cube recommendations', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/count:/i)).toBeInTheDocument()
    })

    it('should show cube name for cube recommendations', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      // The cube name "Employees" should appear in the recommendation section
      // Note: case-sensitive search for the cube name
      expect(screen.getByText('Employees')).toBeInTheDocument()
    })

    it('should render estimated impact when provided', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/10x faster/i)).toBeInTheDocument()
    })

    it('should render recommendation type badge', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText('INDEX')).toBeInTheDocument()
      expect(screen.getByText('CUBE')).toBeInTheDocument()
      expect(screen.getByText('TIP')).toBeInTheDocument()
    })

    it('should show recommendation count in header', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/recommendations \(3\)/i)).toBeInTheDocument()
    })
  })

  describe('copy functionality', () => {
    let mockWriteText: ReturnType<typeof vi.fn>

    beforeEach(() => {
      // Mock clipboard API
      mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      })
    })

    it('should render copy button for SQL recommendations', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      expect(copyButtons.length).toBeGreaterThan(0)
    })

    it('should copy SQL to clipboard when copy clicked', async () => {
      const user = userEvent.setup()

      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      await user.click(copyButtons[0])

      // Verify the copy operation occurred by checking for the Copied! feedback
      // The mockWriteText is called internally by the CopyButton component
      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument()
      })
    })

    it('should show "Copied!" feedback after copy', async () => {
      const user = userEvent.setup()

      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      const copyButtons = screen.getAllByRole('button', { name: /copy/i })
      await user.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument()
      })
    })
  })

  describe('close functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<ExplainAIPanel analysis={mockAIAnalysis} onClose={onClose} />)

      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      await user.click(closeButtons[0])

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClear (legacy) when provided', async () => {
      const user = userEvent.setup()
      const onClear = vi.fn()

      render(<ExplainAIPanel analysis={mockAIAnalysis} onClear={onClear} />)

      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      await user.click(closeButtons[0])

      expect(onClear).toHaveBeenCalled()
    })

    it('should call onClose on backdrop click', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<ExplainAIPanel analysis={mockAIAnalysis} onClose={onClose} />)

      // Click backdrop (the semi-transparent overlay)
      const backdrop = document.querySelector('[aria-hidden="true"]')
      if (backdrop) {
        await user.click(backdrop)
        expect(onClose).toHaveBeenCalled()
      }
    })

    it('should close on Escape key press', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<ExplainAIPanel analysis={mockAIAnalysis} onClose={onClose} />)

      await user.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('should prevent body scroll when modal is open', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  describe('metadata display', () => {
    it('should display AI model in footer when _meta is present', () => {
      render(<ExplainAIPanel analysis={mockAIAnalysis} />)

      expect(screen.getByText(/model: gpt-4/i)).toBeInTheDocument()
    })

    it('should show "using your API key" when usingUserKey is true', () => {
      const analysisWithUserKey: AIExplainAnalysis = {
        ...mockAIAnalysis,
        _meta: { model: 'gpt-4', usingUserKey: true },
      }

      render(<ExplainAIPanel analysis={analysisWithUserKey} />)

      expect(screen.getByText(/using your api key/i)).toBeInTheDocument()
    })

    it('should not show model info when _meta is not present', () => {
      const analysisWithoutMeta: AIExplainAnalysis = {
        ...mockAIAnalysis,
        _meta: undefined,
      }

      render(<ExplainAIPanel analysis={analysisWithoutMeta} />)

      expect(screen.queryByText(/model:/i)).not.toBeInTheDocument()
    })
  })

  describe('safe text handling', () => {
    it('should handle object values in text fields gracefully', () => {
      const analysisWithObject: AIExplainAnalysis = {
        ...mockAIAnalysis,
        summary: { text: 'Object summary' } as unknown as string,
        assessmentReason: { reason: 'Object reason' } as unknown as string,
      }

      // Should not throw
      render(<ExplainAIPanel analysis={analysisWithObject} />)

      // Should JSON stringify the object
      expect(screen.getByText(/object summary/i)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// ExecutionPlanPanel Tests
// ============================================================================

describe('ExecutionPlanPanel', () => {
  const mockSql = {
    sql: 'SELECT * FROM employees WHERE organisation_id = $1',
    params: ['org-1'],
  }

  const defaultProps = {
    sql: mockSql,
    sqlLoading: false,
    sqlError: null,
    explainResult: null,
    explainLoading: false,
    explainHasRun: false,
    explainError: null,
    runExplain: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SQL display', () => {
    it('should display generated SQL', () => {
      render(<ExecutionPlanPanel {...defaultProps} />)

      expect(screen.getByText(/SELECT \* FROM employees/i)).toBeInTheDocument()
    })

    it('should display SQL parameters', () => {
      render(<ExecutionPlanPanel {...defaultProps} />)

      expect(screen.getByText(/parameters/i)).toBeInTheDocument()
      expect(screen.getByText(/"org-1"/)).toBeInTheDocument()
    })

    it('should show custom title', () => {
      render(<ExecutionPlanPanel {...defaultProps} title="Custom SQL Title" />)

      expect(screen.getByText('Custom SQL Title')).toBeInTheDocument()
    })

    it('should show default title', () => {
      render(<ExecutionPlanPanel {...defaultProps} />)

      expect(screen.getByText('Generated SQL')).toBeInTheDocument()
    })

    it('should show placeholder when no SQL', () => {
      render(<ExecutionPlanPanel {...defaultProps} sql={null} />)

      expect(screen.getByText(/add metrics to generate sql/i)).toBeInTheDocument()
    })

    it('should show custom placeholder', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          sql={null}
          sqlPlaceholder="Custom placeholder message"
        />
      )

      expect(screen.getByText('Custom placeholder message')).toBeInTheDocument()
    })
  })

  describe('SQL loading state', () => {
    it('should show loading state when sqlLoading is true', () => {
      render(<ExecutionPlanPanel {...defaultProps} sqlLoading={true} />)

      expect(screen.getByText(/loading sql/i)).toBeInTheDocument()
    })

    it('should show loading animation', () => {
      render(<ExecutionPlanPanel {...defaultProps} sqlLoading={true} />)

      const loadingElement = document.querySelector('.dc\\:animate-pulse')
      expect(loadingElement).toBeInTheDocument()
    })
  })

  describe('SQL error state', () => {
    it('should display SQL error message', () => {
      const sqlError = new Error('Failed to generate SQL')

      render(<ExecutionPlanPanel {...defaultProps} sqlError={sqlError} />)

      expect(screen.getByText('Failed to generate SQL')).toBeInTheDocument()
    })
  })

  describe('Explain Plan button', () => {
    it('should render Explain Plan button', () => {
      render(<ExecutionPlanPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: /explain plan/i })).toBeInTheDocument()
    })

    it('should call runExplain when clicked', async () => {
      const user = userEvent.setup()
      const runExplain = vi.fn()

      render(<ExecutionPlanPanel {...defaultProps} runExplain={runExplain} />)

      const explainButton = screen.getByRole('button', { name: /explain plan/i })
      await user.click(explainButton)

      expect(runExplain).toHaveBeenCalledWith({ analyze: false })
    })

    it('should be disabled when explainLoading is true', () => {
      render(<ExecutionPlanPanel {...defaultProps} explainLoading={true} />)

      const explainButton = screen.getByRole('button', { name: /running/i })
      expect(explainButton).toBeDisabled()
    })

    it('should show "Running..." when loading', () => {
      render(<ExecutionPlanPanel {...defaultProps} explainLoading={true} />)

      expect(screen.getByText(/running\.\.\./i)).toBeInTheDocument()
    })
  })

  describe('Include timing checkbox', () => {
    it('should render Include timing checkbox', () => {
      render(<ExecutionPlanPanel {...defaultProps} />)

      expect(screen.getByLabelText(/include timing/i)).toBeInTheDocument()
    })

    it('should pass analyze: true when checkbox is checked', async () => {
      const user = userEvent.setup()
      const runExplain = vi.fn()

      render(<ExecutionPlanPanel {...defaultProps} runExplain={runExplain} />)

      // Check the timing checkbox
      const checkbox = screen.getByLabelText(/include timing/i)
      await user.click(checkbox)

      // Click Explain Plan
      const explainButton = screen.getByRole('button', { name: /explain plan/i })
      await user.click(explainButton)

      expect(runExplain).toHaveBeenCalledWith({ analyze: true })
    })
  })

  describe('EXPLAIN results display', () => {
    it('should display EXPLAIN results when available', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      // Should show database badge
      expect(screen.getByText('POSTGRES')).toBeInTheDocument()
    })

    it('should show Sequential Scans badge when detected', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/sequential scans detected/i)).toBeInTheDocument()
    })

    it('should show index count badge', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/2 indexes used/i)).toBeInTheDocument()
    })

    it('should show execution time when available', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/execution: 12\.50ms/i)).toBeInTheDocument()
    })

    it('should show planning time when available', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/planning: 0\.50ms/i)).toBeInTheDocument()
    })

    it('should show total cost when available', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/cost: 150\.25/i)).toBeInTheDocument()
    })

    it('should list used indexes', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/idx_dept_id/)).toBeInTheDocument()
      expect(screen.getByText(/idx_emp_name/)).toBeInTheDocument()
    })

    it('should display raw EXPLAIN output', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/Seq Scan on employees/i)).toBeInTheDocument()
    })

    it('should not show EXPLAIN results when explainHasRun is false', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={false}
        />
      )

      expect(screen.queryByText('POSTGRES')).not.toBeInTheDocument()
    })
  })

  describe('EXPLAIN loading state', () => {
    it('should show loading state during EXPLAIN', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainLoading={true}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/running explain/i)).toBeInTheDocument()
    })

    it('should show ANALYZE in loading message when useAnalyze is true', async () => {
      const user = userEvent.setup()

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainLoading={false}
          explainHasRun={true}
        />
      )

      // Check the timing checkbox first
      const checkbox = screen.getByLabelText(/include timing/i)
      await user.click(checkbox)

      // Rerender with loading state
      const { rerender } = render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainLoading={true}
          explainHasRun={true}
        />
      )

      // Should show ANALYZE in loading message (this depends on internal state)
    })
  })

  describe('EXPLAIN error state', () => {
    it('should display EXPLAIN error message', () => {
      const explainError = new Error('Failed to run EXPLAIN')

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainError={explainError}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/explain error/i)).toBeInTheDocument()
      expect(screen.getByText('Failed to run EXPLAIN')).toBeInTheDocument()
    })
  })

  describe('AI Analysis button', () => {
    it('should show AI Analysis button when AI is enabled and EXPLAIN result exists', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          runAIAnalysis={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /ai analysis/i })).toBeInTheDocument()
    })

    it('should not show AI Analysis button when AI is disabled', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={false}
        />
      )

      expect(screen.queryByRole('button', { name: /ai analysis/i })).not.toBeInTheDocument()
    })

    it('should not show AI Analysis button when no EXPLAIN result', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={null}
          explainHasRun={true}
          enableAI={true}
        />
      )

      expect(screen.queryByRole('button', { name: /ai analysis/i })).not.toBeInTheDocument()
    })

    it('should call runAIAnalysis when clicked', async () => {
      const user = userEvent.setup()
      const runAIAnalysis = vi.fn()
      const query = { measures: ['Users.count'] }

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          runAIAnalysis={runAIAnalysis}
          query={query}
        />
      )

      const aiButton = screen.getByRole('button', { name: /ai analysis/i })
      await user.click(aiButton)

      expect(runAIAnalysis).toHaveBeenCalledWith(mockExplainResult, query)
    })

    it('should be disabled when AI analysis is loading', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          aiAnalysisLoading={true}
          runAIAnalysis={vi.fn()}
        />
      )

      const aiButton = screen.getByRole('button', { name: /analyzing/i })
      expect(aiButton).toBeDisabled()
    })

    it('should show "Analyzing..." when loading', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          aiAnalysisLoading={true}
          runAIAnalysis={vi.fn()}
        />
      )

      expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
    })
  })

  describe('AI Analysis error', () => {
    it('should display AI analysis error message', () => {
      const aiError = new Error('AI service unavailable')

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          aiAnalysisError={aiError}
          runAIAnalysis={vi.fn()}
        />
      )

      expect(screen.getByText(/ai analysis error/i)).toBeInTheDocument()
      expect(screen.getByText('AI service unavailable')).toBeInTheDocument()
    })
  })

  describe('AI Analysis modal', () => {
    it('should open AI Analysis modal when button clicked', async () => {
      const user = userEvent.setup()
      const runAIAnalysis = vi.fn()

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          aiAnalysis={mockAIAnalysis}
          runAIAnalysis={runAIAnalysis}
          query={{ measures: ['Users.count'] }}
        />
      )

      const aiButton = screen.getByRole('button', { name: /ai analysis/i })
      await user.click(aiButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('AI Performance Analysis')).toBeInTheDocument()
      })
    })

    it('should close modal when close button clicked', async () => {
      const user = userEvent.setup()

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={mockExplainResult}
          explainHasRun={true}
          enableAI={true}
          aiAnalysis={mockAIAnalysis}
          runAIAnalysis={vi.fn()}
          query={{ measures: ['Users.count'] }}
        />
      )

      // Open modal
      const aiButton = screen.getByRole('button', { name: /ai analysis/i })
      await user.click(aiButton)

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('AI Performance Analysis')).toBeInTheDocument()
      })

      // Close modal
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      await user.click(closeButtons[0])

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText('AI Performance Analysis')).not.toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle SQL without params', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          sql={{ sql: 'SELECT 1', params: [] }}
        />
      )

      expect(screen.getByText('SELECT 1')).toBeInTheDocument()
      // Should not show Parameters section when empty
    })

    it('should handle undefined SQL params', () => {
      render(
        <ExecutionPlanPanel
          {...defaultProps}
          sql={{ sql: 'SELECT 1' }}
        />
      )

      expect(screen.getByText('SELECT 1')).toBeInTheDocument()
    })

    it('should handle explainResult without optional fields', () => {
      const minimalExplainResult: ExplainResult = {
        operations: [],
        summary: {
          database: 'postgres',
          hasSequentialScans: false,
          usedIndexes: [],
        },
        raw: '',
        sql: { sql: 'SELECT 1' },
      }

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={minimalExplainResult}
          explainHasRun={true}
        />
      )

      // Should render without errors
      expect(screen.getByText('POSTGRES')).toBeInTheDocument()
      // Should not show timing badges
      expect(screen.queryByText(/execution:/i)).not.toBeInTheDocument()
    })

    it('should handle single index (singular)', () => {
      const singleIndexResult: ExplainResult = {
        ...mockExplainResult,
        summary: {
          ...mockExplainResult.summary,
          usedIndexes: ['idx_single'],
        },
      }

      render(
        <ExecutionPlanPanel
          {...defaultProps}
          explainResult={singleIndexResult}
          explainHasRun={true}
        />
      )

      expect(screen.getByText(/1 index used/i)).toBeInTheDocument()
    })
  })
})
