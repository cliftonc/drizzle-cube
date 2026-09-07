import { default as React } from 'react';
import { DashboardLayoutMode } from '../types.js';
interface FloatingEditToolbarProps {
    /** Whether the static edit bar is visible (toolbar hidden when true) */
    isEditBarVisible: boolean;
    /** Position of the floating toolbar */
    position: 'left' | 'right';
    /** Whether currently in edit mode */
    isEditMode: boolean;
    /** Toggle edit mode on/off */
    onEditModeToggle: () => void;
    /** Current layout mode */
    layoutMode: DashboardLayoutMode;
    /** Change layout mode */
    onLayoutModeChange: (mode: DashboardLayoutMode) => void;
    /** Available layout modes */
    allowedModes: DashboardLayoutMode[];
    /** Whether layout mode can be changed */
    canChangeLayoutMode: boolean;
    /** Current color palette name */
    currentPalette: string;
    /** Change color palette */
    onPaletteChange: (palette: string) => void;
    /** Add new portlet */
    onAddPortlet: () => void;
    /** Add new text portlet */
    onAddText?: () => void;
}
export default function FloatingEditToolbar({ isEditBarVisible, position, isEditMode, onEditModeToggle, layoutMode, onLayoutModeChange, allowedModes, canChangeLayoutMode, currentPalette, onPaletteChange, onAddPortlet, onAddText }: FloatingEditToolbarProps): React.ReactPortal | null;
export {};
