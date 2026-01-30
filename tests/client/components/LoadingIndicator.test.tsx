import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingIndicator from '../../../src/client/components/LoadingIndicator'

describe('LoadingIndicator', () => {
  describe('rendering', () => {
    it('should render a spinner element', () => {
      render(<LoadingIndicator />)

      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
    })

    it('should render with default size (md)', () => {
      render(<LoadingIndicator />)

      const spinner = screen.getByRole('status')
      // Default md size has dc:h-8 dc:w-8 classes
      expect(spinner.className).toContain('dc:h-8')
      expect(spinner.className).toContain('dc:w-8')
    })

    it('should render with small size when size="sm"', () => {
      render(<LoadingIndicator size="sm" />)

      const spinner = screen.getByRole('status')
      // Small size has dc:h-6 dc:w-6 classes
      expect(spinner.className).toContain('dc:h-6')
      expect(spinner.className).toContain('dc:w-6')
    })

    it('should render with large size when size="lg"', () => {
      render(<LoadingIndicator size="lg" />)

      const spinner = screen.getByRole('status')
      // Large size has dc:h-12 dc:w-12 classes
      expect(spinner.className).toContain('dc:h-12')
      expect(spinner.className).toContain('dc:w-12')
    })
  })

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<LoadingIndicator />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('role', 'status')
    })

    it('should have aria-label for screen readers', () => {
      render(<LoadingIndicator />)

      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })
  })

  describe('customization', () => {
    it('should apply custom className', () => {
      render(<LoadingIndicator className="custom-class" />)

      const spinner = screen.getByRole('status')
      expect(spinner.className).toContain('custom-class')
    })

    it('should preserve default classes when custom className is added', () => {
      render(<LoadingIndicator className="custom-class" />)

      const spinner = screen.getByRole('status')
      // Should still have animation class
      expect(spinner.className).toContain('dc:animate-spin')
      expect(spinner.className).toContain('custom-class')
    })
  })
})
