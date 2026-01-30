import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './msw-server'

// Mock ResizeObserver (needed for Recharts)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver (used by many React components)
const intersectionObserverMock = () => ({
  observe: () => null,
  disconnect: () => null,
  unobserve: () => null,
})

window.IntersectionObserver = vi.fn().mockImplementation(intersectionObserverMock)

// Mock matchMedia (used by responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock HTMLCanvasElement.getContext (needed for chart libraries)
// Mock scrollIntoView (used by keyboard navigation)
Element.prototype.scrollIntoView = vi.fn()

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})) as any

// Suppress console errors during tests (optional)
const originalError = console.error

// MSW and console setup
beforeAll(() => {
  // Start MSW server - intercept network requests
  server.listen({ onUnhandledRequest: 'warn' })
  // Suppress console errors
  console.error = vi.fn()
})

// Reset MSW handlers after each test to ensure clean state
afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  // Stop MSW server
  server.close()
  // Restore console.error
  console.error = originalError
})