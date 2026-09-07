import { CSSProperties, ComponentType } from 'react';
import { EffectiveFilterField } from './filterField.js';
interface FilterFieldChipProps {
    field: EffectiveFilterField;
    FilterIcon: ComponentType<{
        className?: string;
        style?: CSSProperties;
    }>;
    onOpenFilterConfig: () => void;
}
export default function FilterFieldChip({ field, FilterIcon, onOpenFilterConfig }: FilterFieldChipProps): import("react").JSX.Element;
export {};
