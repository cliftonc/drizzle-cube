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
 * Crop an image to the specified dimensions (from top-left corner)
 * Uses Canvas API to extract just the top portion of the image
 */
function cropImage(
  dataUri: string,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Draw only the top portion of the source image
      ctx.drawImage(
        img,
        0, 0, width, height,  // Source: top-left crop at target size
        0, 0, width, height   // Destination: full canvas
      )

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
      resolve(canvas.toDataURL(mimeType, quality))
    }
    img.onerror = () => reject(new Error('Failed to load image for cropping'))
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
    const targetWidth = config.width ?? 800   // Default 800px wide
    const targetHeight = config.height ?? 600 // Default 600px tall (4:3 aspect)
    const format = config.format ?? 'png'
    const quality = config.quality ?? 0.9

    const element = elementRef.current
    const elementRect = element.getBoundingClientRect()
    const elementWidth = elementRect.width

    // Calculate scale factor to get target width
    const scale = targetWidth / elementWidth

    // Capture full element at scaled width
    const fullDataUri = await screenshot.domToPng(element, { scale, quality })

    // Crop to target dimensions (takes top portion only)
    const croppedDataUri = await cropImage(fullDataUri, targetWidth, targetHeight, format, quality)

    return croppedDataUri
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
