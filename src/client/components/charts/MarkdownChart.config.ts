import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the Markdown chart type
 */
export const markdownConfig: ChartTypeConfig = {
  label: t('chart.markdown.label'),
  description: t('chart.markdown.description'),
  useCase: t('chart.markdown.useCase'),
  skipQuery: true, // This chart doesn't require a valid query
  dropZones: [], // No drop zones needed for markdown content
  displayOptionsConfig: [
    {
      key: 'content',
      label: t('chart.configText.markdown_content'),
      type: 'string',
      placeholder: '# Welcome\n\nAdd your **markdown** content here:\n\n- Lists with bullets\n- [Links](https://example.com)\n- *Italic* and **bold** text\n\n---\n\nUse --- for horizontal rules.',
      description: t('chart.configText.enter_markdown_text_supports_headers_bold_text_italic_text_links_text_ur')
    },
    {
      key: 'accentColorIndex',
      label: t('chart.configText.accent_color'),
      type: 'paletteColor',
      defaultValue: 0,
      description: t('chart.configText.color_from_the_dashboard_palette_for_headers_bullets_and_links')
    },
    {
      key: 'fontSize',
      label: t('chart.option.fontSize.label'),
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'small', label: t('chart.option.fontSize.small') },
        { value: 'medium', label: t('chart.option.fontSize.medium') },
        { value: 'large', label: t('chart.option.fontSize.large') }
      ],
      description: t('chart.configText.overall_text_size_for_the_markdown_content')
    },
    {
      key: 'alignment',
      label: t('chart.option.alignment.label'),
      type: 'select',
      defaultValue: 'left',
      options: [
        { value: 'left', label: t('chart.option.accentBorder.left') },
        { value: 'center', label: t('chart.option.alignment.center') },
        { value: 'right', label: t('chart.option.alignment.right') }
      ],
      description: t('chart.configText.horizontal_alignment_of_the_markdown_content')
    },
    {
      key: 'hideHeader',
      label: t('chart.option.hideHeader.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.hideHeader.description')
    },
    {
      key: 'transparentBackground',
      label: t('chart.option.transparentBackground.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.transparentBackground.description')
    },
    {
      key: 'autoHeight',
      label: t('chart.option.autoHeight.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.autoHeight.description')
    },
    {
      key: 'accentBorder',
      label: t('chart.option.accentBorder.label'),
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: t('chart.option.accentBorder.none') },
        { value: 'left', label: t('chart.option.accentBorder.left') },
        { value: 'top', label: t('chart.option.accentBorder.top') },
        { value: 'bottom', label: t('chart.option.accentBorder.bottom') }
      ],
      description: t('chart.configText.add_an_accent_colored_border_on_one_side_of_the_content')
    }
  ]
}
