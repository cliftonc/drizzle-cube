import { ReactNode } from 'react';
interface SectionHeadingProps {
    children: ReactNode;
    /** Optional className to add additional styles */
    className?: string;
}
/**
 * Consistent section heading style for Analysis Builder panels.
 * Change the styles here to update all section headings at once.
 */
export default function SectionHeading({ children, className }: SectionHeadingProps): import("react").JSX.Element;
export {};
