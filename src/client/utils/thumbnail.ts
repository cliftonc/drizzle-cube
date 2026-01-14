/**
 * Dashboard Thumbnail Capture Utility
 *
 * Provides optional screenshot functionality for dashboard thumbnails.
 * Requires modern-screenshot as an optional peer dependency.
 *
 * Usage:
 * 1. Install the optional dependency: npm install modern-screenshot
 * 2. Enable in CubeProvider: features={{ thumbnail: { enabled: true } }}
 * 3. Thumbnails are automatically captured on dashboard save
 */

import type { RefObject } from 'react'
import type { ThumbnailFeatureConfig } from '../types'

// Type definition for modern-screenshot (optional dependency)
type ModernScreenshotModule = {
  domToPng: (element: HTMLElement, options?: Record<string, unknown>) => Promise<string>
  domToJpeg: (element: HTMLElement, options?: Record<string, unknown>) => Promise<string>
}

// Cache the import result to avoid repeated dynamic imports
let screenshotModule: ModernScreenshotModule | null = null
let moduleChecked = false

/**
 * Resize an image to the specified dimensions while maintaining quality.
 * This takes a high-resolution source and scales it down to target dimensions,
 * which produces better results than capturing at low resolution directly.
 *
 * Uses Canvas imageSmoothingQuality for best downscaling results.
 */
function resizeImage(
  dataUri: string,
  targetWidth: number,
  targetHeight: number,
  format: 'png' | 'jpeg',
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Enable high-quality image smoothing for downscaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Calculate aspect-ratio-preserving dimensions
      const sourceAspect = img.width / img.height
      const targetAspect = targetWidth / targetHeight

      let sourceX = 0
      let sourceY = 0
      let sourceWidth = img.width
      let sourceHeight = img.height

      // Crop source to match target aspect ratio (center crop)
      if (sourceAspect > targetAspect) {
        // Source is wider - crop horizontally
        sourceWidth = img.height * targetAspect
        sourceX = (img.width - sourceWidth) / 2
      } else if (sourceAspect < targetAspect) {
        // Source is taller - crop vertically (take from top)
        sourceHeight = img.width / targetAspect
        // Don't center - take from top for dashboard previews
        sourceY = 0
      }

      // Draw the scaled and cropped image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,  // Source region
        0, 0, targetWidth, targetHeight               // Destination (full canvas)
      )

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
      resolve(canvas.toDataURL(mimeType, quality))
    }
    img.onerror = () => reject(new Error('Failed to load image for resizing'))
    img.src = dataUri
  })
}

/**
 * Check if modern-screenshot is available (installed as peer dependency)
 */
async function getScreenshotModule(): Promise<ModernScreenshotModule | null> {
  if (moduleChecked) {
    return screenshotModule
  }

  try {
    // Dynamic import - modern-screenshot is an optional peer dependency
    // @ts-ignore - modern-screenshot may not be installed
    screenshotModule = await import('modern-screenshot') as ModernScreenshotModule
    moduleChecked = true
    return screenshotModule
  } catch {
    moduleChecked = true
    screenshotModule = null
    return null
  }
}

// Extend Window interface for our warning flag
declare global {
  interface Window {
    __drizzle_cube_thumbnail_warning__?: boolean
  }
}

/**
 * Log a development-mode warning when thumbnail feature is enabled but modern-screenshot is missing
 */
export function warnIfScreenshotLibMissing(thumbnailConfig: ThumbnailFeatureConfig | undefined): void {
  if (typeof window === 'undefined') return
  if (!thumbnailConfig?.enabled) return

  // Only warn once per session
  if (window.__drizzle_cube_thumbnail_warning__) return

  getScreenshotModule().then((mod) => {
    if (!mod && process.env.NODE_ENV === 'development') {
      console.warn(
        '[drizzle-cube] Thumbnail feature enabled but modern-screenshot not installed. ' +
        'Run: npm install modern-screenshot'
      )
      window.__drizzle_cube_thumbnail_warning__ = true
    }
  })
}

/**
 * Capture a thumbnail of the dashboard element
 *
 * @param elementRef - React ref to the dashboard container element
 * @param config - Thumbnail configuration (dimensions, format, quality)
 * @returns Base64 data URI of the thumbnail, or null if capture failed
 */
export async function captureThumbnail(
  elementRef: RefObject<HTMLElement | null>,
  config: ThumbnailFeatureConfig
): Promise<string | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null
  }

  // Check if the element ref is valid
  if (!elementRef.current) {
    return null
  }

  // Try to load modern-screenshot
  const screenshot = await getScreenshotModule()
  if (!screenshot) {
    return null
  }

  try {
    // Higher default dimensions for crisp thumbnails on retina displays
    // 1600x1200 provides good quality while keeping file size reasonable
    const targetWidth = config.width ?? 1600
    const targetHeight = config.height ?? 1200
    const format = config.format ?? 'png'
    const quality = config.quality ?? 0.95    // Higher default quality

    const element = elementRef.current

    // Always capture at 2x scale for high quality (like copy-to-clipboard)
    // This produces a sharp image that we then resize down
    const captureScale = 2

    // Get theme-aware background color (walks DOM tree to find effective bg)
    const backgroundColor = getEffectiveBackgroundColor(element)

    // Capture at high resolution with proper background
    const fullDataUri = await screenshot.domToPng(element, {
      scale: captureScale,
      backgroundColor,
    })

    // Resize to target dimensions (high-quality downscaling)
    const resizedDataUri = await resizeImage(
      fullDataUri,
      targetWidth,
      targetHeight,
      format,
      quality
    )

    return resizedDataUri
  } catch (error) {
    console.error('[drizzle-cube] Failed to capture thumbnail:', error)
    return null
  }
}

/**
 * Check if thumbnail capture is available and enabled
 */
export async function isThumbnailCaptureAvailable(
  config: ThumbnailFeatureConfig | undefined
): Promise<boolean> {
  if (!config?.enabled) {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  const screenshot = await getScreenshotModule()
  return screenshot !== null
}

/**
 * Check if portlet screenshot-to-clipboard is available.
 * Requires both modern-screenshot AND Clipboard API with image support.
 */
export async function isPortletCopyAvailable(): Promise<boolean> {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return false
  }

  // Check modern-screenshot is installed
  const screenshot = await getScreenshotModule()
  if (!screenshot) {
    return false
  }

  // Check Clipboard API supports writing images (ClipboardItem with image/png blob)
  return (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator?.clipboard?.write === 'function'
  )
}

/**
 * Check if a background color is transparent or effectively invisible
 */
function isTransparentBackground(color: string): boolean {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return true
  }
  // Check for rgba with 0 alpha
  const rgbaMatch = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)
  if (rgbaMatch && parseFloat(rgbaMatch[1]) === 0) {
    return true
  }
  return false
}

/**
 * Find the effective background color by walking up the DOM tree
 */
function getEffectiveBackgroundColor(element: HTMLElement): string {
  let current: HTMLElement | null = element

  while (current) {
    const bg = getComputedStyle(current).backgroundColor
    if (!isTransparentBackground(bg)) {
      return bg
    }
    current = current.parentElement
  }

  // Fallback to theme variable or white
  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--dc-surface')
    .trim()

  return themeColor || '#ffffff'
}

/**
 * Capture a portlet element and copy to clipboard as PNG.
 * Returns true on success, false on failure.
 *
 * @param element - The HTML element to capture
 * @returns Promise<boolean> - true if successfully copied to clipboard
 */
export async function copyPortletToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const screenshot = await getScreenshotModule()
    if (!screenshot) {
      console.warn('[drizzle-cube] Cannot copy portlet: modern-screenshot not available')
      return false
    }

    // Get theme-aware background color by walking up the DOM tree
    const backgroundColor = getEffectiveBackgroundColor(element)

    // Capture as PNG data URL at 2x scale for retina quality
    const dataUrl = await screenshot.domToPng(element, {
      scale: 2,
      backgroundColor,
    })

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Write to clipboard
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])

    return true
  } catch (error) {
    console.warn('[drizzle-cube] Failed to copy portlet to clipboard:', error)
    return false
  }
}
