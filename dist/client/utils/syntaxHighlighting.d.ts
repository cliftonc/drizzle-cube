/**
 * Syntax Highlighting Utility
 *
 * Lazy-loads highlight.js only when needed for syntax highlighting in debug panels.
 * This minimizes bundle size impact since syntax highlighting is not needed on initial load.
 *
 * Usage:
 *   await highlightCodeBlocks()
 */
/**
 * Lazy-loads highlight.js and registers supported languages.
 * Only loads once - subsequent calls return immediately.
 */
export declare function loadSyntaxHighlighter(): Promise<void>;
/**
 * Highlights all code blocks on the page that haven't been highlighted yet.
 * Gracefully handles cases where highlight.js fails to load.
 */
export declare function highlightCodeBlocks(): Promise<void>;
/**
 * Highlights a specific code block element.
 * Useful for dynamically added content.
 *
 * @param element - The code block element to highlight
 */
export declare function highlightCodeBlock(element: HTMLElement): Promise<void>;
/**
 * Returns whether syntax highlighting is available.
 * Useful for conditional rendering or feature detection.
 */
export declare function isSyntaxHighlightingAvailable(): boolean;
/**
 * Returns the loaded highlight.js instance, if available.
 * Useful for custom highlighting flows that need direct access.
 */
export declare function getSyntaxHighlighter(): any | null;
