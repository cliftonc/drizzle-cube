import { default as React } from 'react';
/** Scrollable table wrapper so wide tables don't overflow their container */
export declare function ScrollableTable({ children, ...props }: React.HTMLAttributes<HTMLTableElement>): React.JSX.Element;
/** Notebook canvas blocks — roomy, distinct heading sizes. */
export declare const NOTEBOOK_MARKDOWN_OPTIONS: {
    overrides: {
        code: {
            props: {
                className: string;
            };
        };
        pre: {
            props: {
                className: string;
            };
        };
        a: {
            props: {
                className: string;
                target: string;
                rel: string;
            };
        };
        table: {
            component: typeof ScrollableTable;
            props: {
                className: string;
            };
        };
        thead: {
            props: {
                className: string;
            };
        };
        th: {
            props: {
                className: string;
            };
        };
        td: {
            props: {
                className: string;
            };
        };
        tr: {
            props: {
                className: string;
            };
        };
        h1: {
            props: {
                className: string;
            };
        };
        h2: {
            props: {
                className: string;
            };
        };
        h3: {
            props: {
                className: string;
            };
        };
        p: {
            props: {
                className: string;
            };
        };
        strong: {
            props: {
                className: string;
            };
        };
        ul: {
            props: {
                className: string;
            };
        };
        ol: {
            props: {
                className: string;
            };
        };
        li: {
            props: {
                className: string;
            };
        };
        hr: {
            props: {
                className: string;
            };
        };
        blockquote: {
            props: {
                className: string;
            };
        };
    };
};
/**
 * Chat bubbles — the bubble already sets the font size, so headings only carry
 * weight, and every block margin is tighter to suit an ~85%-width bubble.
 */
export declare const CHAT_MARKDOWN_OPTIONS: {
    overrides: {
        code: {
            props: {
                className: string;
            };
        };
        pre: {
            props: {
                className: string;
            };
        };
        a: {
            props: {
                className: string;
                target: string;
                rel: string;
            };
        };
        table: {
            component: typeof ScrollableTable;
            props: {
                className: string;
            };
        };
        thead: {
            props: {
                className: string;
            };
        };
        th: {
            props: {
                className: string;
            };
        };
        td: {
            props: {
                className: string;
            };
        };
        tr: {
            props: {
                className: string;
            };
        };
        h1: {
            props: {
                className: string;
            };
        };
        h2: {
            props: {
                className: string;
            };
        };
        h3: {
            props: {
                className: string;
            };
        };
        p: {
            props: {
                className: string;
            };
        };
        strong: {
            props: {
                className: string;
            };
        };
        ul: {
            props: {
                className: string;
            };
        };
        ol: {
            props: {
                className: string;
            };
        };
        li: {
            props: {
                className: string;
            };
        };
        hr: {
            props: {
                className: string;
            };
        };
        blockquote: {
            props: {
                className: string;
            };
        };
    };
};
