import { CubeMetaCube } from '../../types.js';
export interface FieldSelection {
    cubeName: string;
    fieldName: string | null;
    fieldType: 'measure' | 'dimension' | 'cube';
}
interface FieldDetailPanelProps {
    selection: FieldSelection;
    meta: {
        cubes: CubeMetaCube[];
    };
    onClose: () => void;
}
export declare function FieldDetailPanel({ selection, meta, onClose }: FieldDetailPanelProps): import("react").JSX.Element | null;
export {};
