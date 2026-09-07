import { default as React } from 'react';
interface ScaledGridWrapperProps {
    scaleFactor: number;
    designWidth: number;
    children: React.ReactNode;
}
/**
 * Wrapper component that scales the grid using CSS transform
 * Handles height compensation to prevent overflow/whitespace issues
 */
export default function ScaledGridWrapper({ scaleFactor, designWidth, children }: ScaledGridWrapperProps): React.JSX.Element;
export {};
