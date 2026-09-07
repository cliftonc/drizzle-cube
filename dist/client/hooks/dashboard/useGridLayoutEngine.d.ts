import { LayoutItem } from 'react-grid-layout';
import { StoreApi } from 'zustand';
import { DashboardStore } from '../../stores/dashboardStore.js';
interface UseGridLayoutEngineOptions {
    storeApi: StoreApi<DashboardStore>;
}
export declare function useGridLayoutEngine({ storeApi }: UseGridLayoutEngineOptions): {
    hasLayoutActuallyChanged: (newLayout: LayoutItem[]) => boolean;
};
export {};
