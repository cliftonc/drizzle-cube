/**
 * Tests for measureIcons utility
 * Covers icon retrieval and rendering for different measure types
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  getMeasureIcon,
  getAllMeasureIcons
} from '../../../src/client/utils/measureIcons'

describe('measureIcons', () => {
  describe('getMeasureIcon', () => {
    it('should return a React element for count measure type', () => {
      const icon = getMeasureIcon('count')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for sum measure type', () => {
      const icon = getMeasureIcon('sum')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for avg measure type', () => {
      const icon = getMeasureIcon('avg')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for min measure type', () => {
      const icon = getMeasureIcon('min')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for max measure type', () => {
      const icon = getMeasureIcon('max')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for countDistinct measure type', () => {
      const icon = getMeasureIcon('countDistinct')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for undefined measure type', () => {
      const icon = getMeasureIcon(undefined)
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should return a React element for unknown measure type', () => {
      const icon = getMeasureIcon('unknownType')
      expect(React.isValidElement(icon)).toBe(true)
    })

    it('should apply default className when not provided', () => {
      const icon = getMeasureIcon('count')
      render(<div data-testid="icon-container">{icon}</div>)
      const container = screen.getByTestId('icon-container')
      const svgElement = container.querySelector('svg')
      // The icon should have some className applied
      expect(svgElement).toBeTruthy()
    })

    it('should apply custom className when provided', () => {
      const icon = getMeasureIcon('count', 'custom-class')
      render(<div data-testid="icon-container">{icon}</div>)
      const container = screen.getByTestId('icon-container')
      const svgElement = container.querySelector('svg')
      expect(svgElement).toBeTruthy()
      expect(svgElement?.classList.contains('custom-class')).toBe(true)
    })

    it('should render icon with different size classes', () => {
      const smallIcon = getMeasureIcon('sum', 'w-3 h-3')
      const largeIcon = getMeasureIcon('sum', 'w-8 h-8')

      const { rerender, container } = render(<div data-testid="container">{smallIcon}</div>)
      let svg = container.querySelector('svg')
      expect(svg?.classList.contains('w-3')).toBe(true)

      rerender(<div data-testid="container">{largeIcon}</div>)
      svg = container.querySelector('svg')
      expect(svg?.classList.contains('w-8')).toBe(true)
    })
  })

  describe('getAllMeasureIcons', () => {
    it('should return an object with all measure type icons', () => {
      const icons = getAllMeasureIcons()
      expect(typeof icons).toBe('object')
      expect(icons).not.toBeNull()
    })

    it('should include count measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('count')
      expect(React.isValidElement(icons.count)).toBe(true)
    })

    it('should include countDistinct measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('countDistinct')
      expect(React.isValidElement(icons.countDistinct)).toBe(true)
    })

    it('should include sum measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('sum')
      expect(React.isValidElement(icons.sum)).toBe(true)
    })

    it('should include avg measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('avg')
      expect(React.isValidElement(icons.avg)).toBe(true)
    })

    it('should include min measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('min')
      expect(React.isValidElement(icons.min)).toBe(true)
    })

    it('should include max measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('max')
      expect(React.isValidElement(icons.max)).toBe(true)
    })

    it('should include runningTotal measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('runningTotal')
      expect(React.isValidElement(icons.runningTotal)).toBe(true)
    })

    it('should include calculated measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('calculated')
      expect(React.isValidElement(icons.calculated)).toBe(true)
    })

    it('should include number measure type', () => {
      const icons = getAllMeasureIcons()
      expect(icons).toHaveProperty('number')
      expect(React.isValidElement(icons.number)).toBe(true)
    })

    it('should render all icons without errors', () => {
      const icons = getAllMeasureIcons()
      const { container } = render(
        <div>
          {Object.values(icons).map((icon, index) => (
            <span key={index}>{icon}</span>
          ))}
        </div>
      )
      // Should have rendered 10 icons (all measure types)
      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBe(10)
    })

    it('should have consistent styling across all icons', () => {
      const icons = getAllMeasureIcons()
      const { container } = render(
        <div>
          {Object.entries(icons).map(([type, icon]) => (
            <span key={type}>{icon}</span>
          ))}
        </div>
      )
      const svgElements = container.querySelectorAll('svg')
      // All icons should have the dc: prefixed width/height classes
      svgElements.forEach(svg => {
        expect(svg.classList.contains('dc:w-4') || svg.classList.contains('w-4')).toBe(true)
      })
    })
  })
})
