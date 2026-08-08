# Architect Plan for #890

## Problem Statement

The Data Browser already keeps structured filters in Zustand and passes them directly into the generated `CubeQuery`, but there is no separate quick-search state; only `filters` are selected in `useDataBrowser()` (`src/client/hooks/useDataBrowser.ts:73`) and only those structured filters are assigned to `q.filters` (`src/client/hooks/useDataBrowser.ts:128-129`). The collapsible filter panel currently renders only `AnalysisFilterSection`, so there is no UI at the top of that panel for a free-text row search (`src/client/components/DataBrowser/index.tsx:150-157`). The toolbar exposes a filter toggle and column picker (`src/client/components/DataBrowser/DataBrowserToolbar.tsx:57-68`), while existing Data Browser i18n keys stop at filters/columns/rows/sidebar labels (`src/i18n/locales/en.json:949-957`).

## Summary of what needs to change

Add a Data Browser quick search value to the Data Browser store, render a translated search input with a clear button at the top of the filter panel, and merge that value into the server-side query as an OR group of case-insensitive `contains` filters across all text dimensions for the selected cube. Keep structured filters working as-is by AND-ing them with the quick-search OR group when both are present. Add client/store tests and i18n keys.

## Files to modify

- `src/client/stores/dataBrowserStore.tsx:35-40`, `src/client/stores/dataBrowserStore.tsx:157-160`
  - Add `searchText: string` plus `setSearchText(searchText: string)` and `clearSearchText()` actions.
  - Reset `searchText` and `page` on cube switch, and reset `page` when search changes/clears.
- `src/client/hooks/useDataBrowser.ts:73-88`, `src/client/hooks/useDataBrowser.ts:118-133`
  - Select `searchText` and expose search actions from the store.
  - Add a helper such as `getTextDimensions(cubeName, meta): string[]` that returns fields with metadata type `string` only.
  - Build the quick-search filter as `{ type: 'or', filters: textDimensions.map(member => ({ member, operator: 'contains', values: [trimmedSearch] })) }`.
  - Combine with structured filters as:
    - no filters: omit `q.filters`
    - structured only: current `filters`
    - search only: `[quickSearchGroup]`
    - both: `[{ type: 'and', filters: [...filters, quickSearchGroup] }]`
  - Include `searchText` and text-field metadata dependencies in the query memo so TanStack Query refetches automatically.
- `src/client/components/DataBrowser/index.tsx:37-60`, `src/client/components/DataBrowser/index.tsx:150-157`
  - Pull `searchText`, `setSearchText`, and `clearSearchText` from `useDataBrowser()`.
  - Insert the new quick-search UI before `AnalysisFilterSection` inside the collapsible filter panel.
  - Keep structured filters below the search box.
- New component: `src/client/components/DataBrowser/DataBrowserQuickSearch.tsx`
  - Render a `SearchIcon` input styled with `dc:` utilities and a clear `x` button when non-empty.
  - Use `useTranslation()` for placeholder/clear label/title; do not add bare user-facing strings.
  - Reuse icon registry patterns already used by sidebar search (`src/client/components/DataBrowser/DataBrowserSidebar.tsx:12-13`) and toolbar actions (`src/client/components/DataBrowser/DataBrowserToolbar.tsx:10-14`).
- `src/i18n/locales/en.json:949-957`, `src/i18n/locales/nl-NL.json:907-917`, and any generated/pseudo locale that already contains Data Browser keys (for example `src/i18n/locales/af-ZA.json:843-853`)
  - Add keys such as `dataBrowser.search.placeholder` and `dataBrowser.search.clear`.
  - `en-US.json` appears to be an override-only file with no Data Browser keys; add entries there only if wording differs from `en.json`.
- `tests/client/components/DataBrowser/dataBrowserStore.test.ts:79-100`
  - Add coverage that search text updates reset `page`, clear search resets `page`, and cube switching clears search.
- `tests/client/components/DataBrowser/DataBrowser.test.tsx:12-33`
  - Extend component tests to assert the search UI appears in the filter panel, typing search updates the mocked query filters, clear removes the quick-search filters, only string fields are searched, and numeric fields like `Employees.id` are excluded.

## Implementation approach

1. **Store state**
   - Extend `DataBrowserStore` with `searchText`, `setSearchText`, and `clearSearchText`.
   - Initialize `searchText` to `''` and clear it in `selectCube()` alongside structured `filters`.
   - Implement `setSearchText` so it resets `page` to `0` only when the value changes.
2. **Query filter construction**
   - Add a small pure helper in `useDataBrowser.ts` to find searchable members: selected cube dimensions whose metadata `type` is exactly `string`.
   - Trim the search text before building filters. If the trimmed value is empty or the cube has no text dimensions, do not add a quick-search filter.
   - Use the existing `contains` operator because server adapters implement `contains` as case-insensitive LIKE/ILIKE (`src/server/adapters/base-adapter.ts:310-346`). This satisfies the issue requirement without adding new server operators.
   - Merge structured filters and the quick-search filter group carefully so structured filtering remains AND-ed with the global search.
3. **UI**
   - Create `DataBrowserQuickSearch.tsx` with props `{ value, onChange, onClear }`.
   - Place it as the first child of the existing filter panel container, above `AnalysisFilterSection`.
   - Add a compact clear button (`x` icon if available from `getIcon`, otherwise an icon already present in the registry) that is hidden/disabled when the input is empty.
4. **i18n**
   - Add translated keys for placeholder and clear action to locale files that already define Data Browser strings.
   - Avoid `title="Refresh"`-style bare strings in new code; use `t(...)` for aria-label/title/placeholder.
5. **Tests**
   - Update store tests first for state behavior.
   - Update component tests by capturing the `_query` argument passed to the `useCubeLoadQuery` mock and asserting `query.filters` shape after search input changes.
   - Use the existing `Employees.id` numeric and `Employees.name`/`Employees.email` string fields to verify text-only search.

## Risks and edge cases

- **Filter semantics**: The quick search must be OR within text fields but AND with existing structured filters. Accidentally appending the OR group directly to an array interpreted as AND/OR differently could change query behavior.
- **No text dimensions**: If a selected cube has no `string` dimensions, typing search should not create an empty OR group that filters out all rows or produces invalid SQL.
- **Hidden vs all text columns**: The issue says all text columns, not only visible columns. Use cube metadata dimensions, not `visibleColumns`, so hidden text columns still participate.
- **Whitespace search**: Whitespace-only input should behave like empty search and clear the quick-search query contribution.
- **Pagination**: Search changes must reset to page 0 to avoid showing later-page offsets for a narrower result set.
- **Server load**: Searching many text dimensions creates an OR group over all text columns; acceptable for a quick-search feature but can be expensive on very wide cubes.

## Test strategy

- `npm run test:client -- tests/client/components/DataBrowser/DataBrowser.test.tsx tests/client/components/DataBrowser/dataBrowserStore.test.ts`
- `npm run typecheck`
- `npm run lint`
- Optional broader no-Docker guardrail if time permits: `npm run test:sqlite` (guardrails report says full `npm test` requires local PostgreSQL at `127.0.0.1:54333`).

## Estimated complexity

medium
