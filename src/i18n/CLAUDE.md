# Internationalization (i18n)

All user-visible text in drizzle-cube must go through the translation system. **Never add bare user-facing strings.**

## Architecture

```
src/i18n/
├── runtime.ts           Core: t(), loadLocale(), createTranslator()
├── types.ts             TranslationKey union (derived from en.json)
├── index.ts             Barrel export
└── locales/
    ├── en.json          Source of truth (en-GB, ~1600 keys)
    ├── en-US.json       American spelling overrides (~30 keys)
    └── nl-NL.json       Dutch translation (full coverage)
```

- **Default locale**: `en-GB` (statically bundled, always available)
- **Other locales**: lazy-loaded via dynamic `import()` as separate chunks
- **Type safety**: `TranslationKey` is a union of all keys in `en.json` — typos fail at compile time
- **Crowdin**: `npm run i18n:push` / `npm run i18n:pull` for translation management

## Key Rule: Configs Store Keys, Components Resolve

Chart configs and other configuration objects store **translation keys** (plain strings like `'chart.bar.label'`), NOT resolved text. Translation happens at **render time** in React components via `useTranslation()`.

```ts
// Config file — store keys, NO import of t()
export const barChartConfig: ChartTypeConfig = {
  label: 'chart.bar.label',
  dropZones: [{ emptyText: 'chart.bar.dropZone.xAxis.empty', ... }]
}

// Component — resolve at render time
const { t } = useTranslation()
return <span>{t(config.label)}</span>
```

**Why**: Calling `t()` at module load time freezes translations to the initial locale. Storing keys and resolving at render time ensures locale changes are reflected immediately.

## How to Add New User-Visible Text

1. Add the English string to `src/i18n/locales/en.json` with a descriptive dot-path key
2. Add the Dutch translation to `nl-NL.json` (or note as follow-up)
3. If the string uses British spelling (colour, visualise), add an American override to `en-US.json`
4. Reference the key in code — never the raw string
5. In React components, resolve via `const { t } = useTranslation()` then `t('your.key')`
6. In configs (chart configs, display options), store the key string directly

## Key Naming Conventions

| Context | Pattern | Example |
|---------|---------|---------|
| Chart metadata | `chart.{type}.{prop}` | `chart.bar.label` |
| Drop zone empty text | `chart.{type}.dropZone.{zone}.empty` | `chart.bar.dropZone.xAxis.empty` |
| Validation messages | `chart.{type}.validation.{desc}` | `chart.heatmap.validation.xAxisRequired` |
| Display options | `chart.option.{option}.{prop}` | `chart.option.stacking.label` |
| Config descriptions | `chart.configText.{desc}` | `chart.configText.measures_for_bar_heights` |
| Common actions | `common.actions.{verb}` | `common.actions.save` |
| Server errors | `server.errors.{desc}` | `server.errors.cubeNotFound` |

## What Counts as User-Visible

Must use `t()`: labels, descriptions, button text, tooltips, error messages, warnings, empty states, hints, validation messages, placeholder text.

Bare strings OK: object keys, IDs, enum values, database fields, route paths, CSS classes, internal diagnostics, test fixtures.

## Locale Propagation (Server)

Client sends `X-DC-Locale` header on API requests. Adapters extract it via `resolveRequestLocale()` (`src/adapters/locale.ts`) and merge into `SecurityContext`. Server code accesses via `securityContext.locale`.

## Testing

- `tests/i18n/runtime.test.ts` — runtime function tests
- `tests/i18n/locales.test.ts` — key parity across locales + chart config key validation
- `tests/adapters/locale.test.ts` — server-side locale resolution
- The chart config key validation test **automatically catches missing translation keys** in any chart config
