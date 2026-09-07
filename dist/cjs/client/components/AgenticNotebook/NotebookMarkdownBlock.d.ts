import { default as React } from 'react';
import { MarkdownBlock } from '../../stores/notebookStore.js';
interface NotebookMarkdownBlockProps {
    block: MarkdownBlock;
    onRemove: (id: string) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    isFirst: boolean;
    isLast: boolean;
}
declare const NotebookMarkdownBlock: React.MemoExoticComponent<({ block, onRemove, onMoveUp, onMoveDown, isFirst, isLast, }: NotebookMarkdownBlockProps) => React.JSX.Element>;
export default NotebookMarkdownBlock;
