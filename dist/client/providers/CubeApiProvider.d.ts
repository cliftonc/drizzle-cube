import { ReactNode } from 'react';
import { CubeClient } from '../client/CubeClient.js';
import { CubeQueryOptions, CubeApiOptions } from '../types.js';
import { BatchCoordinator } from '../client/BatchCoordinator.js';
interface CubeApiContextValue {
    cubeApi: CubeClient;
    options?: CubeQueryOptions;
    apiOptions: CubeApiOptions;
    updateApiConfig: (apiOptions: CubeApiOptions, token?: string) => void;
    batchCoordinator: BatchCoordinator | null;
    enableBatching: boolean;
}
interface CubeApiProviderProps {
    apiOptions: CubeApiOptions;
    token?: string;
    options?: CubeQueryOptions;
    locale?: string;
    enableBatching?: boolean;
    batchDelayMs?: number;
    children: ReactNode;
}
export declare function CubeApiProvider({ apiOptions: initialApiOptions, token: initialToken, options, locale, enableBatching, batchDelayMs, children }: CubeApiProviderProps): import("react").JSX.Element;
export declare function useCubeApi(): CubeApiContextValue;
export {};
