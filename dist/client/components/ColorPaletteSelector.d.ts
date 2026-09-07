/**
 * Color Palette Selector Component
 * Allows users to select from predefined color palettes for their dashboard
 */
interface ColorPaletteSelectorProps {
    currentPalette?: string;
    onPaletteChange: (paletteName: string) => void;
    className?: string;
}
export default function ColorPaletteSelector({ currentPalette, onPaletteChange, className }: ColorPaletteSelectorProps): import("react").JSX.Element;
export {};
