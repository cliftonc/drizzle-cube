import { NotebookConfig } from '../../stores/notebookStore.js';
interface UseNotebookAutosaveParams {
    blockCount: number;
    messageCount: number;
    isStreaming: boolean;
    save: () => NotebookConfig;
    onSave?: (config: NotebookConfig) => void | Promise<void>;
}
export declare function useNotebookAutosave({ blockCount, messageCount, isStreaming, save, onSave, }: UseNotebookAutosaveParams): {
    clearSave: () => void;
};
export {};
