import { default as React } from 'react';
interface CustomDateDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onDateRangeChange: (dateRange: string | string[]) => void;
    currentDateRange?: string | string[];
    anchorRef: React.RefObject<HTMLElement>;
}
declare const CustomDateDropdown: React.FC<CustomDateDropdownProps>;
export default CustomDateDropdown;
