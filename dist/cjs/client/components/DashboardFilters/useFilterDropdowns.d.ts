/**
 * useFilterDropdowns
 *
 * Owns the open/closed state of the three mutually-exclusive popover dropdowns
 * (operator, value, date-range) plus the click-outside effect that closes them
 * all. This is the single "which dropdown is open" concern; it exposes the
 * container ref the effect watches and the individual open flags/setters.
 *
 * Behaviour is identical to the previous inline implementation — same effect,
 * same dependency array, same setters.
 */
export declare function useFilterDropdowns(): {
    containerRef: import('react').RefObject<HTMLDivElement>;
    isOperatorDropdownOpen: boolean;
    setIsOperatorDropdownOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    isValueDropdownOpen: boolean;
    setIsValueDropdownOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    isDateRangeDropdownOpen: boolean;
    setIsDateRangeDropdownOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
};
export type UseFilterDropdowns = ReturnType<typeof useFilterDropdowns>;
