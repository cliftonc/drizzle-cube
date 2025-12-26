# Row-Managed Dashboard Layout Spec

## Goal
Add an alternative dashboard layout mode that uses managed rows instead of freeform `react-grid-layout` placement. In row mode, all portlets in a row share the same height, and widths are controlled by splitters with snapping to the existing grid system. This must coexist with the current grid mode and use the same saved config file.

## Non-Goals
- Replace or remove the existing `react-grid-layout` mode.
- Change existing layout behavior in grid mode.
- Introduce new visual styling conventions beyond what is needed for resize handles and drag affordances.

## Key Requirements
- Two layout modes: `grid` (current) and `rows` (new).
- Same grid rules in both modes: `cols = 12`, `rowHeight = 80`, `minW = 2`, `minH = 2`.
- Row mode uses implicit row creation when dragging a portlet below the last row.
- When a portlet is dropped into a row, widths in that row are equalized by default.
- Row heights are independently resizable with snapping to `rowHeight`.
- Column widths are resizable via splitters with snapping to the 12-column grid.
- Layout mode and row layout data must be saved and loaded alongside existing portlet layout data.

## Data Model
Additive fields to the existing dashboard config:

```
layoutMode: 'grid' | 'rows'  // default: 'grid'
grid: {
  cols: 12
  rowHeight: 80
  minW: 2
  minH: 2
}
rows: Array<{
  id: string
  h: number                 // row height in grid units
  columns: Array<{
    portletId: string
    w: number               // width in grid columns; sum per row = cols
  }>
}>
```

Notes:
- `rows` are only required when `layoutMode === 'rows'`.
- `grid` may be omitted if it matches defaults; it can be inferred from current RGL settings.
- `portlets[]` (current `x/y/w/h`) remains the source of truth for grid mode.

## Behavior: Row Mode
### Rendering
- The layout is a vertical stack of rows.
- Each row height is `row.h * rowHeight`.
- Each row contains portlets laid out horizontally by column width (`w`).

### Dragging
- Dragging within a row reorders columns.
- Dragging between rows moves the portlet into the target row.
- Dragging below the last row creates a new row (`h = minH`) and inserts the portlet.
- After any drag into a row, widths are equalized across all columns in that row (respecting `minW`).

### Resizing
- Row resize: vertical splitter between rows adjusts row heights; snap to grid unit and enforce `minH`.
- Column resize: horizontal splitter between columns adjusts widths; snap to grid unit and enforce `minW`.
- When resizing a column, adjacent columns are adjusted to preserve `sum(w) = cols`.

### Equalization Rule
- For `n` portlets in a row, base width is `floor(cols / n)`.
- Distribute remainder from left to right.
- Enforce `minW`; if enforcement violates `cols`, clamp and redistribute the remainder.

## Conversion Rules
### Grid → Rows
Used when switching to row mode or importing dashboards without `rows`.

1. Sort portlets by `y` then `x`.
2. Group portlets by shared `y` (treat same `y` as a row).
3. Row height = max `h` within the group (snap to `minH`).
4. Equalize widths across the row (respect `minW`).

### Rows → Grid
Used to generate `x/y/w/h` for compatibility or preview.

1. Walk rows in order.
2. For each row, set `y` to cumulative height offset.
3. Set each portlet `h = row.h`.
4. Assign `x` sequentially from `columns[]`, with `w` as stored.

## UI Controls
- A layout mode toggle in the dashboard editor: `Grid` | `Rows`.
- Row mode uses visible splitters (vertical between rows, horizontal between columns).
- Drag handles remain consistent with existing edit mode affordances.
- The existing edit-mode gate still applies (no drag/resize when not editable).
- Switching modes triggers immediate conversion and updates the in-memory layout; if the user does not save, the view reverts to the previously saved layout on reload.

## Persistence & Compatibility
- When saving:
  - If `layoutMode = grid`, persist `portlets[]` (current behavior); `rows` can be retained but ignored.
  - If `layoutMode = rows`, persist `rows[]`; also regenerate `portlets[]` for backward compatibility and preview.
- When loading:
  - If `layoutMode` is missing, default to `grid`.
  - If `layoutMode = rows` but `rows` missing, derive from `portlets[]` using Grid → Rows.
  - If the user switches modes but does not save, discard the converted layout and load the last saved layout on refresh.

## Edge Cases
- Single portlet row: `w = cols`.
- `minW` conflicts (too many columns): clamp to `minW` and allow overflow detection; user must move portlets to a new row.
- Mixed row heights: allowed; row resizing should not impact adjacent row portlets beyond height adjustments.

## Implementation Notes
- This mode should be a separate layout path in the dashboard grid component, not a modification of `react-grid-layout`.
- Suggested libs: `react-resizable-panels` (splitters) + `@dnd-kit` (drag/drop).
- Keep grid parameters centralized so both modes reference the same values.
