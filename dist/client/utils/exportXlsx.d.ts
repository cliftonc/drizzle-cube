import { XlsExportFeatureConfig } from '../types.js';
import { PortletDebugDataEntry } from '../stores/dashboardStore.js';
/**
 * Check if XLSX export is available (ExcelJS installed)
 */
export declare function isExportAvailable(): Promise<boolean>;
declare global {
    interface Window {
        __drizzle_cube_xls_export_warning__?: boolean;
    }
}
/**
 * Log a development-mode warning when xlsExport feature is enabled but exceljs is missing
 */
export declare function warnIfExcelJsMissing(xlsExportConfig: XlsExportFeatureConfig | undefined): void;
/**
 * Export portlet data as a formatted XLSX file.
 * Returns true on success, false on failure.
 */
export declare function exportPortletToXlsx(portletTitle: string, debugData: PortletDebugDataEntry): Promise<boolean>;
