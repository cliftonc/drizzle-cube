import { CubeMetaCube } from '../../types.js';
interface CubeNodeData {
    cube: CubeMetaCube;
    onFieldClick?: (cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension', pos?: {
        x: number;
        y: number;
    }) => void;
    onCubeClick?: (cubeName: string, pos?: {
        x: number;
        y: number;
    }) => void;
    isHighlighted: boolean;
    highlightedFields: string[];
    searchTerm?: string;
    selectedField?: {
        cubeName: string;
        fieldName: string | null;
    } | null;
    [key: string]: unknown;
}
interface CubeNodeProps {
    data: CubeNodeData;
}
export declare function CubeNode({ data }: CubeNodeProps): import("react").JSX.Element;
export {};
