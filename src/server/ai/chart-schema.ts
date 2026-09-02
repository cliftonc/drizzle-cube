/**
 * Chart Configuration Schema — shared by the MCP and Agent tools
 *
 * The chart-side sibling of `QUERY_PARAMS_SCHEMA`. Used by BOTH:
 * - MCP `chart` tool (adapters/mcp-transport.ts)
 * - Agent `add_portlet` / `save_as_dashboard` tools (server/agent/tools.ts)
 *
 * Most charts need nothing here — their axes are inferred from the query. The
 * records table is the exception: it lays out `columns` rather than axes, and a
 * column renders as plain text unless the caller says what it is. Formats are
 * never guessed from the data, so a model that cannot see this shape produces a
 * listing of unformatted strings.
 */

/**
 * `chartConfig` fields for the charts whose mandatory drop zones are not the
 * usual axes. Without these the model cannot state them at all: `heatmap` needs
 * a `valueField` to colour its cells, and `activityGrid` lays itself out from a
 * date field plus a value field. Both were only ever filled by inference.
 */
export const FIELD_ZONE_CHART_CONFIG_SCHEMA = {
  valueField: {
    type: 'array',
    items: { type: 'string' },
    description: 'heatmap and activityGrid: single measure driving cell colour intensity. Required for both — the chart renders empty without it.'
  },
  dateField: {
    type: 'array',
    items: { type: 'string' },
    description: 'activityGrid only: single time dimension laying out the grid. Query it with day granularity over several months, or the grid has nothing to show.'
  }
} as const

/** `displayConfig` fields for charts that need an explicit scale or template. */
export const SCALE_DISPLAY_CONFIG_SCHEMA = {
  minValue: {
    type: 'number',
    description: 'gauge only: scale minimum (defaults to 0).'
  },
  maxValue: {
    type: 'number',
    description: 'gauge only: scale maximum. ALWAYS set this — without it the gauge scales to the data it was given, so a single value always reads as 100%.'
  },
  template: {
    type: 'string',
    description: 'kpiText only: sentence template around the value, e.g. "${fieldLabel}: ${value}". Defaults to that if omitted.'
  }
} as const

/** `chartConfig` fields specific to the records table. */
export const RECORDS_TABLE_CHART_CONFIG_SCHEMA = {
  columns: {
    type: 'array',
    items: { type: 'string' },
    description: 'recordsTable only: fields to render as columns, in this order. Omit to show every field the query returns, in query order.'
  },
  hiddenColumns: {
    type: 'array',
    items: { type: 'string' },
    description: 'recordsTable only: fields fetched for row context or rowLink tokens but never displayed (e.g. an id used in the URL template). Leave empty unless a field is genuinely only needed behind the scenes — anything listed here disappears from the table.'
  }
} as const

/** `displayConfig` fields specific to the records table. */
export const RECORDS_TABLE_DISPLAY_CONFIG_SCHEMA = {
  columnFormats: {
    type: 'object',
    description: 'recordsTable only: how each column renders, keyed by field name (e.g. "Employees.salary"). Formats are never inferred from the data — a column is plain text unless you say otherwise, so set this for any numeric, date, status or ratio column.',
    additionalProperties: {
      type: 'object',
      required: ['kind'],
      properties: {
        kind: {
          type: 'string',
          enum: ['text', 'number', 'date', 'badge', 'progress'],
          description: 'Required on every entry. text: as-is. number: formatted numeric. date: formatted date. badge: coloured pill for statuses/categories. progress: bar or ring for a bounded value. Use "text" when you only want to set a label.'
        },
        numberFormat: {
          type: 'object',
          description: 'kind "number": { unit: "currency"|"percent"|"number"|"custom", decimals, abbreviate (K/M/B), currencyCode, customPrefix, customSuffix }.'
        },
        dateGranularity: {
          type: 'string',
          description: 'kind "date": granularity to render at (e.g. "day", "month", "year").'
        },
        badgeColors: {
          type: 'array',
          description: 'kind "badge": an ARRAY of { value, colorIndex } entries, not an object keyed by value. colorIndex is a number index into the dashboard palette (0, 1, 2, …), never a colour name like "green" — the palette is themed, so names would not follow it. A value with no entry renders neutral rather than being assigned a guessed colour.',
          items: {
            type: 'object',
            required: ['value', 'colorIndex'],
            properties: {
              value: { type: 'string', description: 'Cell value to colour, matched exactly' },
              colorIndex: { type: 'number', description: 'Index into the dashboard colour palette' }
            }
          }
        },
        progressMin: { type: 'number', description: 'kind "progress": lower bound (default 0). Values are clamped.' },
        progressMax: { type: 'number', description: 'kind "progress": upper bound (default 100). Values are clamped.' },
        progressStyle: { type: 'string', enum: ['bar', 'circle'], description: 'kind "progress": full-width bar, or a compact ring for narrow columns.' },
        label: { type: 'string', description: 'Header override; defaults to the field title from the cube metadata.' },
        align: { type: 'string', enum: ['left', 'right'], description: 'Cell alignment. Numbers usually read better right-aligned.' }
      }
    }
  },
  rowLink: {
    type: 'object',
    description: 'recordsTable only: makes each row a link.',
    required: ['urlTemplate'],
    properties: {
      urlTemplate: {
        type: 'string',
        description: 'URL with {Cube.field} tokens substituted from the row, including hidden columns (e.g. "/employees/{Employees.id}"). Relative paths and http(s) URLs only.'
      },
      target: { type: 'string', enum: ['self', 'blank'], description: 'Open in the same tab (default) or a new one.' }
    }
  },
  pageSize: { type: 'number', enum: [25, 50, 100], description: 'recordsTable only: rows per page (default 25).' }
} as const
