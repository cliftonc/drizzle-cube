interface MissingDependencyFallbackProps {
    chartType: string;
    packageName: string;
    installCommand: string;
    height?: string | number;
}
/**
 * Fallback component shown when a chart's optional dependency is not installed.
 * Provides clear instructions on how to install the missing package.
 */
export declare function MissingDependencyFallback({ chartType, packageName, installCommand, height }: MissingDependencyFallbackProps): import("react").JSX.Element;
export {};
