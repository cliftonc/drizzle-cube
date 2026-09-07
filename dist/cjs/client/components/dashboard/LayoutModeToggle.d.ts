/**
 * Grid / Rows layout-mode toggle used inside the dashboard edit bar.
 */
interface LayoutModeToggleProps {
    layoutMode: string;
    canChangeLayoutMode: boolean;
    onLayoutModeChange: (mode: 'grid' | 'rows') => void;
}
export default function LayoutModeToggle({ layoutMode, canChangeLayoutMode, onLayoutModeChange }: LayoutModeToggleProps): import("react").JSX.Element;
export {};
