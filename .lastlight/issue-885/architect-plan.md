# Architect Plan for #885

## Problem Statement

The Data Browser currently exposes only the structured filter panel: `DataBrowserInner` reads `filters` from the store and passes them to `AnalysisFilterSection`, but there is no free-text search state or input in the main toolbar/filter area (`src/client/components/DataBrowser/index.tsx:41`, `src/client/components/DataBrowser/index.tsx:150`). Query construction forwards only the structured `filters` array into `CubeQuery.filters`, so there is no way to OR a search term across string fields before `useCubeLoadQuery` runs (`src/client/hooks/useDataBrowser.ts:112`, `src/client/hooks/useDataBrowser.ts:128`). The store tracks selected cube, visible columns, pagination, sorting, and structured filters, but has no `searchText` field/action and cube switches only clear structured filters (`src/client/stores/dataBrowserStore.tsx:20`, `src/client/stores/dataBrowserStore.tsx:109`).

## Summary of what needs to change

Add Data Browser quick-search state, render a translated search input with a clear button at the top of the filter panel, and combine the search term with existing structured filters when building the query. The derived search filter should target string/text dimensions for the selected cube only, use `contains` for case-insensitive includes behavior, and OR the per-field predicates together. Add tests covering UI behavior, query construction, page reset, clearing, and text-only field selection.

## Files to modify

- `src/client/stores/dataBrowserStore.tsx:20-58`
  - Add `searchText: string` to `DataBrowserStore` and `setSearchText(searchText: string): void` to actions.
- `src/client/stores/dataBrowserStore.tsx:94-119`
  - Initialize `searchText` to `''` and reset it in `selectCube` along with filters/page state.
- `src/client/stores/dataBrowserStore.tsx:153-162`
  - Implement `setSearchText` so changing the term resets `page` to `0`.
- `src/client/hooks/useDataBrowser.ts:29-42`
  - Add a helper such as `getSearchableTextFields(cubeName, meta)` that returns only selected cube dimensions with text-like types (`string` initially; optionally include any metadata type the project treats as text).
- `src/client/hooks/useDataBrowser.ts:65-90`
  - Read `searchText` from the store and expose `setSearchText` through the returned actions.
- `src/client/hooks/useDataBrowser.ts:112-133`
  - Trim the search term, build an OR `GroupFilter` of `{ member, operator: 'contains', values: [term] }` for searchable text fields, and combine it with existing structured filters as follows:
    - no structured filters + search filters => `q.filters = [searchGroupOrSingleFilter]`
    - structured filters + search filters => `q.filters = [{ type: 'and', filters: [...filters, searchGroupOrSingleFilter] }]`
    - no text fields or blank term => keep existing behavior.
  - Include `searchText` in the `useMemo` dependency list.
- `src/client/hooks/useDataBrowser.ts:171-190`
  - Return `searchText` with state and `setSearchText` with actions.
- `src/client/components/DataBrowser/DataBrowserToolbar.tsx:7-16`
  - Add `SearchIcon` and `CloseIcon` from `getIcon('search')` / `getIcon('close')`.
- `src/client/components/DataBrowser/DataBrowserToolbar.tsx:16-37`
  - Add props: `searchText`, `onSearchTextChange`, and optional `searchDisabled`/`hasSearchableTextFields` if the executor wants to communicate no text columns.
- `src/client/components/DataBrowser/DataBrowserToolbar.tsx:55-86`
  - Render a compact search input before or just after the filter button, with translated placeholder/aria-label and a clear button visible when `searchText` is non-empty.
  - Keep `dc:`-prefixed Tailwind classes and use theme colors.
- `src/client/components/DataBrowser/index.tsx:41-68`
  - Destructure `searchText` and `setSearchText` from `useDataBrowser()`.
- `src/client/components/DataBrowser/index.tsx:132-147`
  - Pass `searchText` and `setSearchText` to `DataBrowserToolbar`.
- `src/i18n/locales/en.json:947-957`
  - Add keys such as `dataBrowser.toolbar.searchPlaceholder`, `dataBrowser.toolbar.searchAriaLabel`, and `dataBrowser.toolbar.clearSearch`.
- `src/i18n/locales/nl-NL.json:907-917`
  - Add Dutch equivalents for the new keys.
- `src/i18n/locales/en-US.json`
  - Add overrides only if wording differs from `en.json`; otherwise no override is needed based on the current locale-file pattern.
- `tests/client/components/DataBrowser/DataBrowser.test.tsx:12-25`
  - Keep the mock metadata with both numeric and string dimensions; optionally add a time/boolean dimension to prove non-text fields are ignored.
- `tests/client/components/DataBrowser/DataBrowser.test.tsx:91-107`
  - Import/use the mocked `useCubeLoadQuery` so tests can inspect the query argument.
- `tests/client/components/DataBrowser/DataBrowser.test.tsx:109-305`
  - Add tests for rendering the quick search, typing a term, clear button behavior, and generated `CubeQuery.filters` shape.
- `tests/client/components/DataBrowser/dataBrowserStore.test.ts:20-58`
  - Add initial-state and action tests for `searchText`.
- `tests/client/components/DataBrowser/dataBrowserStore.test.ts:72-119`
  - Update cube-switch reset test to assert `searchText` is cleared.

## Implementation approach

1. Extend the Data Browser store with `searchText` and `setSearchText`, ensuring search changes and cube switches reset pagination to the first page.
2. In `useDataBrowser`, derive the list of searchable fields from `meta.cubes[].dimensions` for the selected cube, filtering to text fields only. Do not use `visibleColumns` for this list so hidden text columns are still searched when they are part of the cube.
3. Build the search filter only when `searchText.trim()` is non-empty and at least one searchable text dimension exists:
   - one text field: `{ member, operator: 'contains', values: [term] }`
   - multiple text fields: `{ type: 'or', filters: [...] }`
4. Combine the search filter with structured filters using an outer AND group so quick search narrows the structured filter result rather than replacing it. Keep existing `contains` because server adapters already implement case-insensitive matching for this operator (`src/server/adapters/base-adapter.ts:310`, `src/server/adapters/base-adapter.ts:341`).
5. Update `DataBrowserToolbar` to render the search UI with translations and a clear button. The input should call `onSearchTextChange(e.target.value)` on every change; the clear button should call `onSearchTextChange('')`.
6. Wire the toolbar props from `DataBrowserInner`.
7. Add i18n keys in `en.json` and `nl-NL.json` (and only `en-US.json` if wording needs a US override).
8. Add component/store tests, then run targeted client tests and quality checks.

## Risks and edge cases

- If a selected cube has no string dimensions, the search box should not create an empty OR group; the query should behave exactly as it does today.
- Existing structured filters must remain intact and be ANDed with quick search, otherwise search could unexpectedly broaden precise filters.
- Searching hidden text dimensions may return rows that do not visibly show the matching value; this matches the issue wording (“all the text columns at once”) but should be considered in review. If maintainers interpret “columns” as visible columns only, switch the helper to intersect with `visibleColumns`.
- Server-side `contains` is case-insensitive per the adapters, but matching semantics may vary slightly by database collation and text type.
- The input must use translated strings; avoid adding bare `title="Refresh"`-style strings while touching toolbar code. Consider replacing the existing bare refresh title with a translation opportunistically.
- Debounced query fetching already exists (`useCubeLoadQuery` debounce), so the UI can update instantly without adding a separate debounce layer.

## Test strategy

- Targeted component tests: `npm run test:client -- tests/client/components/DataBrowser/DataBrowser.test.tsx tests/client/components/DataBrowser/dataBrowserStore.test.ts`
- Full client tests: `npm run test:client`
- Type checking: `npm run typecheck`
- Linting: `npm run lint`
- Avoid `npm test` unless test databases are running; guardrails report notes default PostgreSQL tests fail locally without `npm run test:setup`.

## Estimated complexity

Medium
