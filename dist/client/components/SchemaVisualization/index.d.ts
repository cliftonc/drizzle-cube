export interface SchemaVisualizationProps {
    className?: string;
    onFieldClick?: (cubeName: string, fieldName: string, fieldType: 'measure' | 'dimension') => void;
    highlightedCubes?: string[];
    highlightedFields?: string[];
    searchTerm?: string;
    height?: string | number;
}
export declare function SchemaVisualization({ className, onFieldClick, highlightedCubes, highlightedFields, searchTerm, height, }: SchemaVisualizationProps): import("react").JSX.Element;
export default SchemaVisualization;
