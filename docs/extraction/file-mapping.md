# File Mapping Guide

This document provides exact source-to-destination mappings for all files being extracted from the Fintune React application to the `drizzle-cube` module.

## Server Files

### Semantic Layer Core

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/server-libs/semantic-layer/compiler.ts` | `/src/server/compiler.ts` | MODIFY | Remove Hono dependencies, make framework-agnostic |
| `/src/server-libs/semantic-layer/executor.ts` | `/src/server/executor.ts` | MODIFY | Replace database calls with pluggable executor |
| `/src/server-libs/semantic-layer/join-resolver.ts` | `/src/server/join-resolver.ts` | COPY | Minimal changes needed |
| `/src/server-libs/semantic-layer/yaml-loader.ts` | `/src/server/yaml-loader.ts` | COPY | Remove Node.js specific parts if any |
| `/src/server-libs/semantic-layer/yaml-types.ts` | `/src/server/yaml-types.ts` | COPY | No changes needed |
| `/src/server-libs/semantic-layer/examples.ts` | `/src/server/examples.ts` | MODIFY | Update to use new API |
| `/src/server-libs/semantic-layer/types.ts` | `/src/server/types.ts` | REPLACE | Complete rewrite for framework-agnostic types |
| NEW | `/src/server/index.ts` | CREATE | Main export file for server module |
| NEW | `/src/server/example-cubes.ts` | CREATE | Example cube definitions |

### Files NOT to Copy

| Source Path | Reason |
|-------------|--------|
| `/src/server-libs/semantic-layer/index.ts` | App-specific initialization, will create new one |
| `/src/server-libs/semantic-layer/cubes/` | App-specific cubes, will create generic examples |

## Client Files

### Analytics Components

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/pages/AnalyticsPage.tsx` | `/src/client/components/AnalyticsPage.tsx` | MODIFY | Remove app navigation, auth dependencies |
| `/src/components/analytics/AnalyticsPortlet.tsx` | `/src/client/components/AnalyticsPortlet.tsx` | MODIFY | Remove app-specific imports |
| `/src/components/analytics/PortletModal.tsx` | `/src/client/components/PortletModal.tsx` | MODIFY | Remove app-specific imports |
| `/src/components/analytics/PageModal.tsx` | `/src/client/components/PageModal.tsx` | MODIFY | Remove app-specific imports |
| `/src/components/analytics/ChartErrorBoundary.tsx` | `/src/client/components/ChartErrorBoundary.tsx` | COPY | Minimal changes |
| `/src/components/analytics/charts/` | `/src/client/components/charts/` | COPY_DIR | Copy entire charts directory |

### Analytics Charts (All files in charts/ directory)

| Source Path | Destination Path | Action |
|-------------|------------------|--------|
| `/src/components/analytics/charts/ChartContainer.tsx` | `/src/client/components/charts/ChartContainer.tsx` | COPY |
| `/src/components/analytics/charts/ChartLegend.tsx` | `/src/client/components/charts/ChartLegend.tsx` | COPY |
| `/src/components/analytics/charts/ChartTooltip.tsx` | `/src/client/components/charts/ChartTooltip.tsx` | COPY |
| `/src/components/analytics/charts/DataTable.tsx` | `/src/client/components/charts/DataTable.tsx` | COPY |
| `/src/components/analytics/charts/RechartsAreaChart.tsx` | `/src/client/components/charts/RechartsAreaChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsBarChart.tsx` | `/src/client/components/charts/RechartsBarChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsLineChart.tsx` | `/src/client/components/charts/RechartsLineChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsPieChart.tsx` | `/src/client/components/charts/RechartsPieChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsRadarChart.tsx` | `/src/client/components/charts/RechartsRadarChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsRadialBarChart.tsx` | `/src/client/components/charts/RechartsRadialBarChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsScatterChart.tsx` | `/src/client/components/charts/RechartsScatterChart.tsx` | COPY |
| `/src/components/analytics/charts/RechartsTreeMap.tsx` | `/src/client/components/charts/RechartsTreeMap.tsx` | COPY |
| `/src/components/analytics/charts/chartConstants.ts` | `/src/client/components/charts/chartConstants.ts` | COPY |
| `/src/components/analytics/charts/chartUtils.ts` | `/src/client/components/charts/chartUtils.ts` | COPY |
| `/src/components/analytics/charts/index.ts` | `/src/client/components/charts/index.ts` | COPY |

### Cube Client Replacement

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/client-libs/analytics/cube/CubeProvider.tsx` | `/src/client/cube/CubeProvider.tsx` | MODIFY | Make API endpoint configurable |
| `/src/client-libs/analytics/cube/ResultSet.ts` | `/src/client/cube/ResultSet.ts` | COPY | Minimal changes |
| `/src/client-libs/analytics/cube/client.ts` | `/src/client/cube/client.ts` | MODIFY | Remove auth assumptions, make configurable |
| `/src/client-libs/analytics/cube/index.ts` | `/src/client/cube/index.ts` | MODIFY | Update exports |
| `/src/client-libs/analytics/cube/types.ts` | `/src/client/cube/types.ts` | COPY | Minimal changes |
| `/src/client-libs/analytics/cube/useCubeQuery.ts` | `/src/client/cube/useCubeQuery.ts` | COPY | Minimal changes |

### Hooks and Types

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/hooks/useAnalyticsPages.ts` | `/src/client/hooks/useAnalyticsPages.ts` | MODIFY | Make storage pluggable |
| `/src/types/analytics.ts` | `/src/client/types/analytics.ts` | COPY | Extract relevant types only |
| NEW | `/src/client/index.ts` | CREATE | Main export file for client module |

### Files to NOT Copy

| Source Path | Reason |
|-------------|--------|
| `/src/contexts/AbilityContext.tsx` | App-specific permissions |
| `/src/hooks/useAuth.ts` | App-specific authentication |
| `/src/components/common/SubscriptionButton.tsx` | App-specific billing |
| `/src/components/common/FintuneLoader.tsx` | App-specific branding |

## Help System Files (for standalone site)

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/components/help-system/HelpPanel.tsx` | `/help-site/src/components/HelpPanel.tsx` | MODIFY | Remove app dependencies |
| `/src/components/help-system/MarkdownRenderer.tsx` | `/help-site/src/components/MarkdownRenderer.tsx` | MODIFY | Remove app dependencies |
| `/src/components/help-system/TableOfContents.tsx` | `/help-site/src/components/TableOfContents.tsx` | COPY | Minimal changes |
| `/src/components/help-system/RelatedTopics.tsx` | `/help-site/src/components/RelatedTopics.tsx` | COPY | Minimal changes |
| `/src/components/PublicHelpLayout.tsx` | `/help-site/src/components/HelpLayout.tsx` | MODIFY | Remove Fintune branding/deps |
| `/src/pages/PublicHelpPage.tsx` | `/help-site/src/components/HelpPage.tsx` | MODIFY | Remove router dependencies |
| `/src/client-libs/ui/help-content.ts` | `/help-site/src/content/help-content.ts` | MODIFY | Extract relevant content only |
| `/src/client-libs/ui/help-loader.ts` | `/help-site/src/help-loader.ts` | MODIFY | Simplify for static content |

## API Route Files

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/routes/semantic-layer.ts` | `/src/adapters/hono/index.ts` | REPLACE | Complete rewrite as adapter |

## New Files to Create

| Destination Path | Purpose |
|------------------|---------|
| `/src/server/index.ts` | Main server module export |
| `/src/client/index.ts` | Main client module export |
| `/src/adapters/hono/index.ts` | Hono framework adapter |
| `/src/adapters/types.ts` | Common adapter interfaces |
| `/src/server/example-cubes.ts` | Generic example cube definitions |
| `/examples/basic/server.ts` | Basic Node.js example |
| `/examples/basic/main.tsx` | Basic React client example |
| `/examples/hono-app/server.ts` | Hono integration example |
| `/help-site/main.tsx` | Help site entry point |
| `/help-site/App.tsx` | Help site app component |
| `/help-site/vite.config.ts` | Help site build config |
| `/help-site/src/content/getting-started.md` | Documentation content |
| `/help-site/src/content/api-reference.md` | API documentation |
| `/help-site/src/content/examples.md` | Usage examples |
| `/package.json` | Module package configuration |
| `/tsconfig.json` | TypeScript configuration |
| `/vite.config.server.ts` | Server build configuration |
| `/vite.config.client.ts` | Client build configuration |
| `/vite.config.adapters.ts` | Adapters build configuration |
| `/README.md` | Module documentation |
| `/LICENSE` | MIT license |

## Files to Ignore/Skip

These files from the source project should NOT be copied:

| Source Path | Reason |
|-------------|--------|
| `/src/worker.ts` | Cloudflare Worker specific |
| `/src/main.tsx` | App-specific entry point |
| `/src/App.tsx` | App-specific root component |
| `/src/schema.ts` | App-specific database schema |
| `/src/routes/` (except semantic-layer.ts) | App-specific API routes |
| `/src/middleware/` | App-specific middleware |
| `/src/contexts/` (except help) | App-specific contexts |
| `/src/hooks/` (except analytics) | App-specific hooks |
| `/src/pages/` (except Analytics/Help) | App-specific pages |
| `/src/components/` (except analytics/help) | App-specific components |
| `/src/stores/` | App-specific state management |
| `/src/services/` | App-specific services |
| `/wrangler.toml` | Cloudflare deployment config |
| `/vite.config.ts` | App-specific build config |

## Asset Files

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| `/src/assets/logo_small.png` | SKIP | Use generic logo for help site |
| CSS/styling files | COPY | Include necessary Tailwind/DaisyUI styles |

## Configuration Files

| Source Path | Destination Path | Action | Notes |
|-------------|------------------|--------|--------|
| NEW | `/.gitignore` | CREATE | Module-specific ignore patterns |
| NEW | `/.eslintrc.json` | CREATE | Linting configuration |
| NEW | `/tsconfig.json` | CREATE | TypeScript configuration |
| NEW | `/vitest.config.ts` | CREATE | Test configuration |

## Summary Statistics

- **Server files**: 7 files to copy/modify + 2 new files
- **Client files**: 25+ files to copy/modify + 2 new files  
- **Help site files**: 8 files to copy/modify + 5 new files
- **Configuration files**: 10+ new files to create
- **Example files**: 6+ new files to create
- **Documentation files**: 5+ new files to create

**Total estimated files**: ~65 files to handle (copy, modify, or create new)

## Validation Checklist

After completing the extraction, verify:

- [ ] All source files have been processed
- [ ] No app-specific dependencies remain in module code
- [ ] All imports resolve correctly
- [ ] Build system produces all three outputs (server, client, adapters)
- [ ] Example applications run successfully
- [ ] Help site builds and displays content
- [ ] All tests pass
- [ ] TypeScript compilation succeeds with no errors