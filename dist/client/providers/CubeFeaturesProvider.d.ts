import { ReactNode } from 'react';
import { FeaturesConfig, DashboardLayoutMode } from '../types.js';
interface CubeFeaturesContextValue {
    features: FeaturesConfig;
    dashboardModes: DashboardLayoutMode[];
    updateFeatures: (newFeatures: Partial<FeaturesConfig>) => void;
}
interface CubeFeaturesProviderProps {
    features?: FeaturesConfig;
    dashboardModes?: DashboardLayoutMode[];
    children: ReactNode;
}
export declare function CubeFeaturesProvider({ features: initialFeatures, dashboardModes, children }: CubeFeaturesProviderProps): import("react").JSX.Element;
/**
 * Hook to access cube features context.
 * Returns default values if used outside CubeFeaturesProvider (graceful fallback).
 */
export declare function useCubeFeatures(): CubeFeaturesContextValue;
export {};
