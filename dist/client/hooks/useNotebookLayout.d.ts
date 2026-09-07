import { RefCallback } from 'react';
export type NotebookLayoutMode = 'wide' | 'narrow';
export interface UseNotebookLayoutResult {
    containerRef: RefCallback<HTMLDivElement>;
    layoutMode: NotebookLayoutMode;
    containerWidth: number;
}
export declare function useNotebookLayout(): UseNotebookLayoutResult;
