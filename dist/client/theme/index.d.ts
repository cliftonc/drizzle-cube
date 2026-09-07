/**
 * Theme utilities and TypeScript types for drizzle-cube theming system
 */
/**
 * Semantic color tokens used throughout drizzle-cube components
 */
export interface ThemeColorTokens {
    surface: string;
    surfaceSecondary: string;
    surfaceTertiary: string;
    surfaceHover: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textDisabled: string;
    border: string;
    borderSecondary: string;
    borderHover: string;
    primary: string;
    primaryHover: string;
    primaryContent: string;
    success: string;
    successBg: string;
    successBorder: string;
    warning: string;
    warningBg: string;
    warningBorder: string;
    error: string;
    errorBg: string;
    errorBorder: string;
    info: string;
    infoBg: string;
    infoBorder: string;
    danger: string;
    dangerHover: string;
    dangerBg: string;
    overlay: string;
    overlayLight: string;
}
/**
 * Theme configuration interface
 */
export interface ThemeConfig {
    name: string;
    colors: Partial<ThemeColorTokens>;
}
/**
 * Get the current value of a theme CSS variable
 */
export declare function getThemeVariable(variableName: string): string;
/**
 * Set a theme CSS variable
 */
export declare function setThemeVariable(variableName: string, value: string): void;
/**
 * Apply a complete theme configuration
 */
export declare function applyTheme(theme: ThemeConfig): void;
/**
 * Reset theme to defaults by removing custom properties
 */
export declare function resetTheme(): void;
/**
 * Theme type definition
 */
export type Theme = 'light' | 'dark' | 'neon';
/**
 * Get the current theme
 */
export declare function getTheme(): Theme;
/**
 * Set the theme
 */
export declare function setTheme(theme: Theme): void;
/**
 * Detect if dark mode is currently active (backwards compatibility)
 * @deprecated Use getTheme() instead
 */
export declare function isDarkMode(): boolean;
/**
 * Watch for theme changes
 */
export declare function watchThemeChanges(callback: (theme: Theme) => void): () => void;
/**
 * Example theme configurations
 */
export declare const THEME_PRESETS: {
    readonly light: {
        readonly name: "light";
        readonly colors: {
            readonly surface: "#ffffff";
            readonly surfaceSecondary: "#f9fafb";
            readonly text: "#111827";
            readonly textSecondary: "#374151";
            readonly textMuted: "#6b7280";
            readonly border: "#e5e7eb";
            readonly primary: "#3b82f6";
            readonly primaryHover: "#2563eb";
        };
    };
    readonly dark: {
        readonly name: "dark";
        readonly colors: {
            readonly surface: "#1e293b";
            readonly surfaceSecondary: "#334155";
            readonly text: "#f1f5f9";
            readonly textSecondary: "#e2e8f0";
            readonly textMuted: "#cbd5e1";
            readonly border: "#475569";
            readonly primary: "#60a5fa";
            readonly primaryHover: "#3b82f6";
        };
    };
    readonly neon: {
        readonly name: "neon";
        readonly colors: {
            readonly surface: "#0a0118";
            readonly surfaceSecondary: "#1a0f2e";
            readonly surfaceTertiary: "#2a1f3e";
            readonly text: "#ffffff";
            readonly textSecondary: "#e0e0ff";
            readonly textMuted: "#b0b0d0";
            readonly border: "#ff00ff";
            readonly borderSecondary: "#00ffff";
            readonly primary: "#00ffff";
            readonly primaryHover: "#00cccc";
            readonly primaryContent: "#000000";
            readonly success: "#00ff00";
            readonly warning: "#ffff00";
            readonly error: "#ff0066";
            readonly info: "#00ffff";
            readonly danger: "#ff1493";
        };
    };
};
