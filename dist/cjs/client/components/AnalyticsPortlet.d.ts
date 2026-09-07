import { default as React } from 'react';
import { AnalyticsPortletProps } from '../types.js';
interface RefreshOptions {
    bustCache?: boolean;
}
interface AnalyticsPortletRef {
    refresh: (options?: RefreshOptions) => void;
}
declare const AnalyticsPortlet: React.MemoExoticComponent<React.ForwardRefExoticComponent<AnalyticsPortletProps & React.RefAttributes<AnalyticsPortletRef>>>;
export default AnalyticsPortlet;
