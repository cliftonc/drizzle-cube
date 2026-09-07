import { default as React } from 'react';
import { SimpleFilter, CubeMeta } from '../../types.js';
interface FilterValuePopoverProps {
    filter: SimpleFilter;
    schema: CubeMeta | null;
    onValuesChange: (values: any[]) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement>;
}
declare const FilterValuePopover: React.FC<FilterValuePopoverProps>;
export default FilterValuePopover;
