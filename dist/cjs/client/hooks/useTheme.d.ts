import { Theme } from '../theme/index.js';
/**
 * Hook to access and update theme
 *
 * Returns current theme and a setter function.
 * Only components using this hook will re-render on theme changes.
 */
export declare function useTheme(): {
    theme: Theme;
    setTheme: (newTheme: Theme) => void;
};
