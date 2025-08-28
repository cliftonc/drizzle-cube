import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import documentTextIcon from '@iconify-icons/tabler/file-text'

/**
 * Configuration for the Markdown chart type
 */
export const markdownConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={documentTextIcon} className={className} />,
  description: 'Display custom markdown content with formatting',
  useCase: 'Perfect for adding documentation, notes, instructions, or formatted text to dashboards',
  skipQuery: true, // This chart doesn't require a valid query
  dropZones: [], // No drop zones needed for markdown content
  displayOptionsConfig: [
    {
      key: 'content',
      label: 'Markdown Content',
      type: 'string',
      placeholder: '# Welcome\n\nAdd your **markdown** content here:\n\n- Lists with bullets\n- [Links](https://example.com)\n- *Italic* and **bold** text',
      description: 'Enter markdown text. Supports headers (#), bold (**text**), italic (*text*), links ([text](url)), and lists (- item).'
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
    }
  ],
  displayOptions: ['hideHeader']
}