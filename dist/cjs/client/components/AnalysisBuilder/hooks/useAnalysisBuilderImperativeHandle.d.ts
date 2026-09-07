import { Ref } from 'react';
import { StoreApi } from 'zustand';
import { AnalysisBuilderRef } from '../types.js';
import { AnalysisBuilderStore } from '../../../stores/analysisBuilderStore.js';
interface ImperativeHandleDeps {
    getQueryConfig: AnalysisBuilderRef['getQueryConfig'];
    getChartConfig: AnalysisBuilderRef['getChartConfig'];
    getAnalysisType: AnalysisBuilderRef['getAnalysisType'];
    clearQuery: AnalysisBuilderRef['clearQuery'];
    storeApi: StoreApi<AnalysisBuilderStore>;
}
export declare function useAnalysisBuilderImperativeHandle(ref: Ref<AnalysisBuilderRef>, deps: ImperativeHandleDeps): void;
export {};
