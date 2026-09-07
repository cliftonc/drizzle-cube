import { FieldSearchItemProps } from './types.js';
declare function FieldSearchItem({ field, isSelected, isFocused, onClick, onMouseEnter, ...props }: FieldSearchItemProps & {
    'data-field-index'?: number;
}): import("react").JSX.Element;
declare const _default: import('react').MemoExoticComponent<typeof FieldSearchItem>;
export default _default;
