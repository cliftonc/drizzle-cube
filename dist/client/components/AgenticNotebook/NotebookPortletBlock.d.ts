import { default as React } from 'react';
import { PortletBlock } from '../../stores/notebookStore.js';
import { ColorPalette } from '../../utils/colorPalettes.js';
interface NotebookPortletBlockProps {
    block: PortletBlock;
    colorPalette?: ColorPalette;
    onRemove: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onEdit: (block: PortletBlock) => void;
    isFirst: boolean;
    isLast: boolean;
}
declare const NotebookPortletBlock: React.MemoExoticComponent<({ block, colorPalette, onRemove, onMoveUp, onMoveDown, onEdit, isFirst, isLast, }: NotebookPortletBlockProps) => React.JSX.Element>;
export default NotebookPortletBlock;
