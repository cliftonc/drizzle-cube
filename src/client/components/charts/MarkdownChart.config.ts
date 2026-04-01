import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the Markdown chart type
 */
export const markdownConfig: ChartTypeConfig = {
  label: 'chart.markdown.label',
  description: 'chart.markdown.description',
  useCase: 'chart.markdown.useCase',
  skipQuery: true, // This chart doesn't require a valid query
  dropZones: [], // No drop zones needed for markdown content
  displayOptionsConfig: [
    {
      key: 'content',
      label: 'chart.configText.markdown_content',
      type: 'string',
      placeholder: '# Welcome\n\nAdd your **markdown** content here:\n\n- Lists with bullets\n- [Links](https://example.com)\n- *Italic* and **bold** text\n\n---\n\nUse --- for horizontal rules.',
      description: 'chart.configText.enter_markdown_text_supports_headers_bold_text_italic_text_links_text_ur'
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
