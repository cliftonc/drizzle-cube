import { RefObject } from 'react';
import { ThumbnailFeatureConfig } from '../types.js';
declare global {
    interface Window {
        __drizzle_cube_thumbnail_warning__?: boolean;
    }
}
/**
 * Log a development-mode warning when thumbnail feature is enabled but modern-screenshot is missing
 */
export declare function warnIfScreenshotLibMissing(thumbnailConfig: ThumbnailFeatureConfig | undefined): void;
/**
 * Capture a thumbnail of the dashboard element
 *
 * @param elementRef - React ref to the dashboard container element
 * @param config - Thumbnail configuration (dimensions, format, quality)
 * @returns Base64 data URI of the thumbnail, or null if capture failed
 */
export declare function captureThumbnail(elementRef: RefObject<HTMLElement | null>, config: ThumbnailFeatureConfig): Promise<string | null>;
/**
 * Check if thumbnail capture is available and enabled
 */
export declare function isThumbnailCaptureAvailable(config: ThumbnailFeatureConfig | undefined): Promise<boolean>;
/**
 * Check if portlet screenshot-to-clipboard is available.
 * Requires both modern-screenshot AND Clipboard API with image support.
 */
export declare function isPortletCopyAvailable(): Promise<boolean>;
/**
 * Capture a portlet element and copy to clipboard as PNG.
 * Returns true on success, false on failure.
 *
 * @param element - The HTML element to capture
 * @returns Promise<boolean> - true if successfully copied to clipboard
 */
export declare function copyPortletToClipboard(element: HTMLElement): Promise<boolean>;
