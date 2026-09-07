import { default as React } from 'react';
interface DatePresetChipsProps {
    activePreset: string | null;
    onPresetSelect: (presetValue: string) => void;
    disabled?: boolean;
}
declare const DatePresetChips: React.FC<DatePresetChipsProps>;
export default DatePresetChips;
