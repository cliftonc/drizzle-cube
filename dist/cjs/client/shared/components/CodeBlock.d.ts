import { default as React } from 'react';
interface CodeBlockProps {
    code: string;
    language: 'json' | 'sql';
    title?: string;
    maxHeight?: string;
    height?: string;
    className?: string;
    /** Additional content to render on the right side of the header (before Copy button) */
    headerRight?: React.ReactNode;
}
export declare const CodeBlock: React.FC<CodeBlockProps>;
export default CodeBlock;
