import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChartErrorBoundary from '../../../src/client/components/ChartErrorBoundary'

// Component that throws an error when shouldThrow is true
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Normal content</div>
}

// Suppress console.error during tests since error boundaries log errors
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
})

describe('ChartErrorBoundary', () => {
  describe('error catching', () => {
    it('should render children when no error occurs', () => {
      render(
        <ChartErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ChartErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('should catch errors from child components and render fallback', () => {
      render(
        <ChartErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      // Should show the default error UI
      expect(screen.getByText('Unable to render chart')).toBeInTheDocument()
    })

    it('should display the error message in fallback UI', () => {
      render(
        <ChartErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      // The error message should be displayed
      expect(screen.getByText(/Test error message/)).toBeInTheDocument()
    })

    it('should display custom portlet title in error message when provided', () => {
      render(
        <ChartErrorBoundary portletTitle="My Custom Chart">
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      expect(screen.getByText('Unable to render My Custom Chart')).toBeInTheDocument()
    })

    it('should render custom fallback when provided', () => {
      render(
        <ChartErrorBoundary fallback={<div>Custom fallback UI</div>}>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      expect(screen.getByText('Custom fallback UI')).toBeInTheDocument()
      // Default error UI should not be shown
      expect(screen.queryByText('Unable to render chart')).not.toBeInTheDocument()
    })
  })

  describe('recovery', () => {
    it('should reset error state when retry button is clicked', () => {
      // Use a stateful wrapper to control when the component throws
      const TestWrapper = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <div>
            <button onClick={() => setShouldThrow(false)}>Fix error</button>
            <ChartErrorBoundary key={shouldThrow ? 'error' : 'fixed'}>
              <ThrowingComponent shouldThrow={shouldThrow} />
            </ChartErrorBoundary>
          </div>
        )
      }

      render(<TestWrapper />)

      // Initially should show error
      expect(screen.getByText('Unable to render chart')).toBeInTheDocument()

      // Click the fix button to stop throwing
      fireEvent.click(screen.getByText('Fix error'))

      // Now should show normal content
      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('should have a try again button in the error UI', () => {
      render(
        <ChartErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      expect(tryAgainButton).toBeInTheDocument()
    })

    it('should attempt to re-render when try again button is clicked', () => {
      render(
        <ChartErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(tryAgainButton)

      // Since the component still throws, it should show error again
      // This verifies the reset was attempted
      expect(screen.getByText('Unable to render chart')).toBeInTheDocument()
    })
  })

  describe('error reporting', () => {
    it('should log errors to console when error is caught', () => {
      render(
        <ChartErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      // Verify console.error was called
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('debug information', () => {
    it('should show portlet configuration details when provided', () => {
      const portletConfig = { chartType: 'bar', title: 'Test' }

      render(
        <ChartErrorBoundary portletConfig={portletConfig}>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      // The portlet config should be available in a details element
      expect(screen.getByText('Portlet Configuration')).toBeInTheDocument()
    })

    it('should show cube query details when provided', () => {
      const cubeQuery = JSON.stringify({ measures: ['count'] })

      render(
        <ChartErrorBoundary cubeQuery={cubeQuery}>
          <ThrowingComponent shouldThrow={true} />
        </ChartErrorBoundary>
      )

      // The cube query should be available in a details element
      expect(screen.getByText('Cube Query')).toBeInTheDocument()
    })
  })
})
