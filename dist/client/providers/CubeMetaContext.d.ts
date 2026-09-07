import { CubeMeta, FieldLabelMap } from '../types.js';
export interface CubeMetaContextValue {
    meta: CubeMeta | null;
    labelMap: FieldLabelMap;
    metaLoading: boolean;
    metaError: string | null;
    getFieldLabel: (fieldName: string) => string;
    refetchMeta: () => void;
}
export declare const CubeMetaContext: import('react').Context<CubeMetaContextValue | null>;
export declare function useCubeMeta(): CubeMetaContextValue;
