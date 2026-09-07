import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { useCubeApi } from './CubeApiProvider.js';
import { useCubeMeta } from './CubeMetaContext.js';
import { useCubeFeatures } from './CubeFeaturesProvider.js';
import { CubeQueryOptions, CubeApiOptions, FeaturesConfig, DashboardLayoutMode, CubeMeta, FieldLabelMap } from '../types.js';
import { CubeClient } from '../client/CubeClient.js';
import { BatchCoordinator } from '../client/BatchCoordinator.js';
import { ChartDefinition } from '../charts/chartPlugin.js';
export declare const createCubeQueryClient: () => QueryClient;
export declare const queryClient: QueryClient;
interface CubeContextValue {
    cubeApi: CubeClient;
    options?: CubeQueryOptions;
    meta: CubeMeta | null;
    labelMap: FieldLabelMap;
    metaLoading: boolean;
    metaError: string | null;
    getFieldLabel: (fieldName: string) => string;
    refetchMeta: () => void;
    updateApiConfig: (apiOptions: CubeApiOptions, token?: string) => void;
    features: FeaturesConfig;
    batchCoordinator: BatchCoordinator | null;
    enableBatching: boolean;
    dashboardModes: DashboardLayoutMode[];
}
interface CubeProviderProps {
    cubeApi?: CubeClient;
    apiOptions?: CubeApiOptions;
    token?: string;
    options?: CubeQueryOptions;
    features?: FeaturesConfig;
    dashboardModes?: DashboardLayoutMode[];
    enableBatching?: boolean;
    batchDelayMs?: number;
    queryClient?: QueryClient;
    /** Custom chart definitions to register. Overrides built-in charts when `type` matches. */
    customCharts?: ChartDefinition[];
    /** Locale code for i18n (default: 'en-GB'). Bundled locales are loaded via dynamic import. */
    locale?: string;
    /** Optional translation overrides merged on top of the loaded locale. */
    translations?: Record<string, string>;
    /** Enable i18n debug mode — logs console warnings for missing translation keys. */
    debugI18n?: boolean;
    children: ReactNode;
}
/**
 * CubeProvider - Three-layer context wrapper
 *
 * Wraps children in three isolated context providers for optimal performance:
 * 1. CubeApiProvider - Stable API layer (changes only on auth)
 * 2. CubeMetaProvider - Metadata layer (changes on metadata load)
 * 3. CubeFeaturesProvider - Feature flags layer (changes on feature updates)
 */
export declare function CubeProvider({ cubeApi: _initialCubeApi, // Intentionally unused - for backward compatibility
apiOptions, token, options, features, dashboardModes, enableBatching, batchDelayMs, queryClient: providedQueryClient, customCharts, locale, translations, debugI18n, children }: CubeProviderProps): import("react").JSX.Element;
/**
 * useCubeContext - Backward compatible hook
 *
 * Merges all three contexts into a single object for backward compatibility.
 * Components using this hook will re-render when ANY context changes.
 *
 * For better performance, use specialized hooks:
 * - useCubeApi() - Only re-renders on API changes
 * - useCubeMeta() - Only re-renders on metadata changes
 * - useCubeFeatures() - Only re-renders on feature changes
 */
export declare function useCubeContext(): CubeContextValue;
export { useCubeApi, useCubeMeta, useCubeFeatures };
export { createCubeQueryClient as createQueryClient };
