import { default as React } from 'react';
interface XTDDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (xtdValue: string) => void;
    currentXTD?: string | null;
    anchorRef: React.RefObject<HTMLElement>;
}
declare const XTDDropdown: React.FC<XTDDropdownProps>;
export default XTDDropdown;
