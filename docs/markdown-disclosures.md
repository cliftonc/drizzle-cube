# Markdown disclosures

Markdown portlets support `<details>` and `<summary>` in their `content` field.
The summary labels a section that starts closed and opens in place.

```markdown
<details><summary>About this data</summary>

The full explanation supports **Markdown**, lists, links, tables, and code blocks.

</details>
```

Start a line with `<details>`, indented by at most three spaces.
Put `<summary>` on the same line or on the next non-blank line, and keep the summary on one line.
End the section with `</details>` on its own line.
A short section fits on one line: `<details><summary>Note</summary>Short text</details>`.
The summary supports inline Markdown, such as bold text and links.

Sections can nest, and one portlet can hold many sections.
Each section keeps its open state through rerenders and query loading.
The state follows the summary text, so an open section stays open when a filter adds or removes sections around it.
Sections with the same summary text are matched by their order.
Reloading the dashboard starts each section closed.
The text editor, export, and import keep the content and never store the reader's state.

The renderer discards the attributes of both tags, including `open`, `style`, and event handlers.
Markdown is still parsed with raw HTML disabled, so other tags, HTML comments, and unmatched disclosure tags render as text.
Tags inside fenced or indented code blocks also render as text.
Each run of text between two section tags is parsed separately.
A reference-style link or a footnote works only when its definition is in the same run.
Notebook and chat Markdown keep their existing HTML restrictions.

In a rows dashboard, a row grows with an open section when every card in the row is an auto-height Markdown card.
A row that holds another card, or a Markdown card with auto height off, keeps its fixed height.
In such a row, the Markdown card fills the row and scrolls.
Template errors and unresolved-reference warnings stay visible outside the collapsible content.
