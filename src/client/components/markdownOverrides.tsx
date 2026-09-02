/**
 * Shared markdown-to-jsx overrides.
 *
 * Two static themes for the two places that render agent-authored markdown:
 * the notebook canvas block and the agent chat bubble. They differ only in
 * scale — chat bubbles are narrow, so headings collapse to the body size and
 * block margins tighten.
 *
 * `MarkdownChart` deliberately does NOT use these: its overrides are
 * parameterised by the portlet's accent colour and font size and are rebuilt in
 * a `useMemo`, so it cannot share a static object.
 */

import React from 'react'

/** Scrollable table wrapper so wide tables don't overflow their container */
export function ScrollableTable({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="dc:overflow-x-auto dc:my-2">
      <table {...props}>{children}</table>
    </div>
  )
}

/** Table/code overrides shared by both themes — identical at either scale. */
const sharedOverrides = {
  code: { props: { className: 'dc:px-1 dc:py-0.5 dc:rounded-sm dc:text-xs bg-dc-surface-secondary text-dc-accent dc:font-mono' } },
  pre: { props: { className: 'dc:rounded-lg dc:p-3 dc:my-2 dc:overflow-x-auto dc:text-xs bg-dc-surface-secondary text-dc-text dc:font-mono' } },
  a: { props: { className: 'text-dc-accent dc:hover:underline', target: '_blank', rel: 'noopener noreferrer' } },
  table: { component: ScrollableTable, props: { className: 'dc:w-full dc:border-collapse dc:text-sm' } },
  thead: { props: { className: 'bg-dc-surface-secondary' } },
  th: { props: { className: 'dc:px-3 dc:py-2 dc:text-left dc:font-semibold dc:text-xs text-dc-text-secondary dc:uppercase dc:tracking-wider border-dc-border dc:border-b' } },
  td: { props: { className: 'dc:px-3 dc:py-2 dc:text-sm text-dc-text border-dc-border dc:border-b' } },
  tr: { props: { className: 'dc:hover:opacity-80' } },
}

/** Notebook canvas blocks — roomy, distinct heading sizes. */
export const NOTEBOOK_MARKDOWN_OPTIONS = {
  overrides: {
    h1: { props: { className: 'dc:text-lg dc:font-bold text-dc-text dc:mb-2 dc:mt-3' } },
    h2: { props: { className: 'dc:text-base dc:font-semibold text-dc-text dc:mb-2 dc:mt-3' } },
    h3: { props: { className: 'dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:mt-3' } },
    p: { props: { className: 'dc:text-sm dc:leading-relaxed text-dc-text dc:mb-2' } },
    strong: { props: { className: 'dc:font-semibold' } },
    ul: { props: { className: 'dc:list-disc dc:ml-5 dc:mb-2 dc:text-sm text-dc-text dc:space-y-1' } },
    ol: { props: { className: 'dc:list-decimal dc:ml-5 dc:mb-2 dc:text-sm text-dc-text dc:space-y-1' } },
    li: { props: { className: 'dc:text-sm text-dc-text' } },
    hr: { props: { className: 'dc:my-3 border-dc-border' } },
    blockquote: { props: { className: 'dc:border-l-4 border-dc-accent dc:pl-3 dc:my-2 dc:italic text-dc-text-secondary dc:text-sm' } },
    ...sharedOverrides,
  },
}

/**
 * Chat bubbles — the bubble already sets the font size, so headings only carry
 * weight, and every block margin is tighter to suit an ~85%-width bubble.
 */
export const CHAT_MARKDOWN_OPTIONS = {
  overrides: {
    h1: { props: { className: 'dc:font-semibold text-dc-text dc:mt-2 dc:mb-1 dc:first:mt-0' } },
    h2: { props: { className: 'dc:font-semibold text-dc-text dc:mt-2 dc:mb-1 dc:first:mt-0' } },
    h3: { props: { className: 'dc:font-semibold text-dc-text dc:mt-2 dc:mb-1 dc:first:mt-0' } },
    p: { props: { className: 'dc:leading-snug dc:mb-1.5 dc:last:mb-0' } },
    strong: { props: { className: 'dc:font-semibold' } },
    ul: { props: { className: 'dc:list-disc dc:ml-4 dc:mb-1.5 dc:last:mb-0 dc:space-y-0.5' } },
    ol: { props: { className: 'dc:list-decimal dc:ml-4 dc:mb-1.5 dc:last:mb-0 dc:space-y-0.5' } },
    li: { props: { className: 'dc:leading-snug' } },
    hr: { props: { className: 'dc:my-2 border-dc-border' } },
    blockquote: { props: { className: 'dc:border-l-2 border-dc-accent dc:pl-2 dc:my-1.5 dc:italic text-dc-text-secondary' } },
    ...sharedOverrides,
  },
}
