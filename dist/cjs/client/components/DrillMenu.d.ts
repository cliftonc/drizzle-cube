import { default as React } from 'react';
import { DrillMenuProps } from '../types/drill.js';
/**
 * DrillMenu component
 * Uses createPortal to render directly to document.body, avoiding stacking context issues
 */
export declare function DrillMenu({ options, position, onSelect, onClose }: DrillMenuProps): React.ReactPortal | null;
export default DrillMenu;
