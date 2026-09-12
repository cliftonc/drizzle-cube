import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

/**
 * Configuration for the Markdown chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const markdownConfig: ChartTypeConfig = {
  // Does not *require* a query. It may still carry one: a markdown portlet with
  // a query renders its content as a Knap template over the result rows. See
  // `markdownTemplate.ts` and `hasRunnableQuery` in `parsePortletQuery.ts`.
  skipQuery: true,
  dropZones: [], // No axes to map — the template addresses fields by name
  displayOptionsConfig: [
    {
      key: 'content',
      label: 'chart.configText.markdown_content',
      type: 'string',
      // The content is this chart's entire substance, so it belongs on the
      // Chart tab where the drop zones would be — that tab is otherwise empty
      // for markdown, and the editor deserves better than a sidebar box.
      placement: 'chart',
      rows: 18,
      syntax: 'markdownTemplate',
      placeholder: 'chart.markdown.contentPlaceholder',
      description: 'chart.markdown.contentDescription',
      // The variable and filter syntax is Knap's, and restating it in help text
      // only ever gets a fraction of it across. Link to the reference instead.
      docsUrl: 'https://knap.md/variables',
      docsLabel: 'chart.markdown.contentDocsLabel'
    },
    {
      key: 'accentColorIndex',
      label: 'chart.configText.accent_color',
      type: 'paletteColor',
      defaultValue: 0,
      description: 'chart.configText.color_from_the_dashboard_palette_for_headers_bullets_and_links'
    },
    {
      key: 'fontSize',
      label: 'chart.option.fontSize.label',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'small', label: 'chart.option.fontSize.small' },
        { value: 'medium', label: 'chart.option.fontSize.medium' },
        { value: 'large', label: 'chart.option.fontSize.large' }
      ],
      description: 'chart.configText.overall_text_size_for_the_markdown_content'
    },
    {
      key: 'alignment',
      label: 'chart.option.alignment.label',
      type: 'select',
      defaultValue: 'left',
      options: [
        { value: 'left', label: 'chart.option.accentBorder.left' },
        { value: 'center', label: 'chart.option.alignment.center' },
        { value: 'right', label: 'chart.option.alignment.right' }
      ],
      description: 'chart.configText.horizontal_alignment_of_the_markdown_content'
    },
    {
      key: 'hideHeader',
      label: 'chart.option.hideHeader.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.hideHeader.description'
    },
    {
      key: 'transparentBackground',
      label: 'chart.option.transparentBackground.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.transparentBackground.description'
    },
    {
      key: 'autoHeight',
      label: 'chart.option.autoHeight.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.autoHeight.description'
    },
    {
      key: 'accentBorder',
      label: 'chart.option.accentBorder.label',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'chart.option.accentBorder.none' },
        { value: 'left', label: 'chart.option.accentBorder.left' },
        { value: 'top', label: 'chart.option.accentBorder.top' },
        { value: 'bottom', label: 'chart.option.accentBorder.bottom' }
      ],
      description: 'chart.configText.add_an_accent_colored_border_on_one_side_of_the_content'
    }
  ]
}
