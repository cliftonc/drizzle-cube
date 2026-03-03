import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the Markdown chart type
 */
export const markdownConfig: ChartTypeConfig = {
  label: 'Markdown',
  description: 'Display custom markdown content with formatting',
  useCase: 'Perfect for adding documentation, notes, section headers, instructions, or formatted text to dashboards',
  skipQuery: true, // This chart doesn't require a valid query
  dropZones: [], // No drop zones needed for markdown content
  displayOptionsConfig: [
    {
      key: 'content',
      label: 'Markdown Content',
      type: 'string',
      placeholder: '# Welcome\n\nAdd your **markdown** content here:\n\n- Lists with bullets\n- [Links](https://example.com)\n- *Italic* and **bold** text\n\n---\n\nUse --- for horizontal rules.',
      description: 'Enter markdown text. Supports headers (#), bold (**text**), italic (*text*), links ([text](url)), lists (- item), and horizontal rules (---).'
    },
    {
      key: 'accentColorIndex',
      label: 'Accent Color',
      type: 'paletteColor',
      defaultValue: 0,
      description: 'Color from the dashboard palette for headers, bullets, and links'
    },
    {
      key: 'fontSize',
      label: 'Font Size',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
      ],
      description: 'Overall text size for the markdown content'
    },
    {
      key: 'alignment',
      label: 'Text Alignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' }
      ],
      description: 'Horizontal alignment of the markdown content'
    },
    {
      key: 'hideHeader',
      label: 'Hide Header',
      type: 'boolean',
      defaultValue: true,
      description: 'Hide the portlet header bar (title and action buttons)'
    },
    {
      key: 'transparentBackground',
      label: 'Transparent Background',
      type: 'boolean',
      defaultValue: false,
      description: 'Remove card background, border, and shadow for seamless integration as section headers'
    },
    {
      key: 'autoHeight',
      label: 'Auto Height',
      type: 'boolean',
      defaultValue: true,
      description: 'In row and mobile layouts, size to markdown content instead of fixed row height'
    },
    {
      key: 'accentBorder',
      label: 'Accent Border',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'left', label: 'Left' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' }
      ],
      description: 'Add an accent-colored border on one side of the content'
    }
  ]
}
