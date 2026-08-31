/**
 * ColumnFormatsEditor
 *
 * Editor for the records table's `columnFormats` display option — one
 * collapsible row per assigned column, each choosing how that column renders.
 *
 * Unlike every other display option, this one is keyed by column, so it needs
 * to know which columns the chart config assigns. It follows the
 * `ThresholdBandsOption` contract: it owns the whole `Record` and always writes
 * a complete replacement value back, never a partial patch.
 */

import { useState } from 'react'
import { AxisFormatControls } from '../charts/AxisFormatControls.js'
import { useCubeMeta } from '../../providers/CubeMetaContext.js'
import type {
  ChartAxisConfig,
  ColorPalette,
  ColumnFormatConfig,
  ColumnFormatKind,
  TimeGranularity
} from '../../types.js'

const KINDS: ColumnFormatKind[] = ['text', 'number', 'date', 'badge', 'progress']

type ProgressStyle = NonNullable<ColumnFormatConfig['progressStyle']>

const PROGRESS_STYLES: ProgressStyle[] = ['bar', 'circle']

const GRANULARITIES: TimeGranularity[] = ['hour', 'day', 'week', 'month', 'quarter', 'year']

interface ColumnFormatsEditorProps {
  value: Record<string, ColumnFormatConfig>
  chartConfig?: ChartAxisConfig
  colorPalette?: ColorPalette
  onChange: (value: Record<string, ColumnFormatConfig> | undefined) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export default function ColumnFormatsEditor({
  value,
  chartConfig,
  colorPalette,
  onChange,
  t
}: ColumnFormatsEditorProps) {
  const { getFieldLabel } = useCubeMeta()
  const [expanded, setExpanded] = useState<string | null>(null)

  const columns = chartConfig?.columns ?? []

  if (columns.length === 0) {
    return (
      <p className="dc:text-xs text-dc-text-muted">
        {t('chart.recordsTable.columnFormats.noColumns')}
      </p>
    )
  }

  const commit = (column: string, format: ColumnFormatConfig | undefined) => {
    const next = { ...value }
    // 'text' is the default, so an explicit text format is just noise in the
    // saved config.
    if (!format || (format.kind === 'text' && !format.label && !format.align)) {
      delete next[column]
    } else {
      next[column] = format
    }
    onChange(Object.keys(next).length > 0 ? next : undefined)
  }

  return (
    <div className="dc:space-y-1">
      {columns.map(column => (
        <ColumnFormatRow
          key={column}
          column={column}
          format={value[column] ?? { kind: 'text' }}
          fallbackLabel={getFieldLabel(column)}
          isOpen={expanded === column}
          colorPalette={colorPalette}
          onToggle={() => setExpanded(expanded === column ? null : column)}
          onChange={(format) => commit(column, format)}
          t={t}
        />
      ))}
    </div>
  )
}

interface ColumnFormatRowProps {
  column: string
  format: ColumnFormatConfig
  fallbackLabel: string
  isOpen: boolean
  colorPalette?: ColorPalette
  onToggle: () => void
  onChange: (format: ColumnFormatConfig) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

/** One collapsible column, with the controls its chosen kind needs. */
function ColumnFormatRow({
  format,
  fallbackLabel,
  isOpen,
  colorPalette,
  onToggle,
  onChange,
  t
}: ColumnFormatRowProps) {
  return (
    <div className="dc:border border-dc-border dc:rounded-sm">
      <button
        type="button"
        onClick={onToggle}
        className="dc:w-full dc:flex dc:items-center dc:justify-between dc:gap-2 dc:px-2 dc:py-1.5 dc:text-sm text-dc-text hover:bg-dc-surface-secondary dc:cursor-pointer"
      >
        <span className="dc:truncate">{format.label || fallbackLabel}</span>
        <span className="dc:text-xs text-dc-text-muted dc:shrink-0">
          {t(`chart.recordsTable.columnFormats.kind.${format.kind}`)}
        </span>
      </button>

      {isOpen && (
        <div className="dc:px-2 dc:py-2 dc:space-y-2 dc:border-t border-dc-border">
          <KindSelector kind={format.kind} onSelect={(kind) => onChange({ ...format, kind })} t={t} />

          <KindControls format={format} colorPalette={colorPalette} onChange={onChange} t={t} />

          <label className="dc:block dc:space-y-1">
            <span className="dc:text-xs text-dc-text-secondary">
              {t('chart.recordsTable.columnFormats.header')}
            </span>
            <input
              type="text"
              value={format.label ?? ''}
              onChange={(e) => onChange({ ...format, label: e.target.value || undefined })}
              placeholder={fallbackLabel}
              className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
            />
          </label>
        </div>
      )}
    </div>
  )
}

/** The controls specific to a format kind. `text` needs none. */
function KindControls({
  format,
  colorPalette,
  onChange,
  t
}: {
  format: ColumnFormatConfig
  colorPalette?: ColorPalette
  onChange: (format: ColumnFormatConfig) => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  if (format.kind === 'number') {
    return (
      <AxisFormatControls
        axisLabel={t('chart.recordsTable.columnFormats.numberFormat')}
        value={format.numberFormat ?? {}}
        onChange={(numberFormat) => onChange({ ...format, numberFormat })}
        previewValue={1250}
      />
    )
  }

  if (format.kind === 'date') {
    return (
      <label className="dc:block dc:space-y-1">
        <span className="dc:text-xs text-dc-text-secondary">
          {t('chart.recordsTable.columnFormats.granularity')}
        </span>
        <select
          value={format.dateGranularity ?? 'day'}
          onChange={(e) => onChange({ ...format, dateGranularity: e.target.value as TimeGranularity })}
          className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
        >
          {GRANULARITIES.map(granularity => (
            <option key={granularity} value={granularity}>{t(`timeGranularity.${granularity}`)}</option>
          ))}
        </select>
      </label>
    )
  }

  if (format.kind === 'badge') {
    return <BadgeColorRows format={format} colorPalette={colorPalette} onChange={onChange} t={t} />
  }

  if (format.kind === 'progress') {
    return <ProgressControls format={format} onChange={onChange} t={t} />
  }

  return null
}

/** How a progress column draws, and the bounds it draws against. */
function ProgressControls({
  format,
  onChange,
  t
}: {
  format: ColumnFormatConfig
  onChange: (format: ColumnFormatConfig) => void
  t: (key: string) => string
}) {
  return (
    <div className="dc:space-y-2">
      <div className="dc:space-y-1">
        <span className="dc:block dc:text-xs text-dc-text-secondary">
          {t('chart.recordsTable.columnFormats.progressStyle')}
        </span>
        <ProgressStyleSelector
          style={format.progressStyle ?? 'bar'}
          onSelect={(progressStyle) => onChange({ ...format, progressStyle })}
          t={t}
        />
      </div>
      <div className="dc:flex dc:gap-2">
        <NumberField
          label={t('chart.recordsTable.columnFormats.progressMin')}
          value={format.progressMin ?? 0}
          onChange={(progressMin) => onChange({ ...format, progressMin })}
        />
        <NumberField
          label={t('chart.recordsTable.columnFormats.progressMax')}
          value={format.progressMax ?? 100}
          onChange={(progressMax) => onChange({ ...format, progressMax })}
        />
      </div>
    </div>
  )
}

function KindSelector({
  kind,
  onSelect,
  t
}: {
  kind: ColumnFormatKind
  onSelect: (kind: ColumnFormatKind) => void
  t: (key: string) => string
}) {
  return (
    <div className="dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden">
      {KINDS.map(candidate => (
        <button
          key={candidate}
          type="button"
          onClick={() => onSelect(candidate)}
          className={`dc:flex-1 dc:px-1 dc:py-1 dc:text-xs dc:font-medium dc:transition-colors dc:cursor-pointer ${
            kind === candidate
              ? 'bg-dc-primary text-white'
              : 'bg-dc-surface text-dc-text hover:bg-dc-border'
          }`}
        >
          {t(`chart.recordsTable.columnFormats.kind.${candidate}`)}
        </button>
      ))}
    </div>
  )
}

/** Bar or ring for a progress column — a ring lets the column stay narrow. */
function ProgressStyleSelector({
  style,
  onSelect,
  t
}: {
  style: ProgressStyle
  onSelect: (style: ProgressStyle) => void
  t: (key: string) => string
}) {
  return (
    <div className="dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden">
      {PROGRESS_STYLES.map(candidate => (
        <button
          key={candidate}
          type="button"
          onClick={() => onSelect(candidate)}
          className={`dc:flex-1 dc:px-1 dc:py-1 dc:text-xs dc:font-medium dc:transition-colors dc:cursor-pointer ${
            style === candidate
              ? 'bg-dc-primary text-white'
              : 'bg-dc-surface text-dc-text hover:bg-dc-border'
          }`}
        >
          {t(`chart.recordsTable.columnFormats.progressStyle.${candidate}`)}
        </button>
      ))}
    </div>
  )
}

/**
 * Value → colour mappings for a badge column. Colours are palette indices, not
 * hex, so badges follow the dashboard theme; a value with no row here renders
 * neutral rather than being given a guessed colour.
 */
function BadgeColorRows({
  format,
  colorPalette,
  onChange,
  t
}: {
  format: ColumnFormatConfig
  colorPalette?: ColorPalette
  onChange: (format: ColumnFormatConfig) => void
  t: (key: string) => string
}) {
  const entries = format.badgeColors ?? []
  const palette = colorPalette?.colors ?? []

  const update = (next: Array<{ value: string; colorIndex: number }>) =>
    onChange({ ...format, badgeColors: next.length > 0 ? next : undefined })

  return (
    <div className="dc:space-y-1">
      <span className="dc:text-xs text-dc-text-secondary">{t('chart.recordsTable.columnFormats.badgeColours')}</span>
      {entries.map((entry, index) => (
        <div key={index} className="dc:space-y-1 dc:border border-dc-border dc:rounded-sm dc:p-1.5">
          <div className="dc:flex dc:items-center dc:gap-2">
            <input
              type="text"
              value={entry.value}
              onChange={(e) => update(entries.map((row, i) => (i === index ? { ...row, value: e.target.value } : row)))}
              placeholder={t('chart.recordsTable.columnFormats.badgeValue')}
              aria-label={t('chart.recordsTable.columnFormats.badgeValue')}
              className="dc:flex-1 dc:min-w-0 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
            />
            <button
              type="button"
              onClick={() => update(entries.filter((_, i) => i !== index))}
              title={t('chart.recordsTable.columnFormats.badgeRemove')}
              aria-label={t('chart.recordsTable.columnFormats.badgeRemove')}
              className="dc:px-2 dc:py-1 dc:text-sm dc:shrink-0 dc:rounded-sm text-dc-danger hover:bg-dc-danger-bg dc:cursor-pointer"
            >
              &times;
            </button>
          </div>
          <div className="dc:flex dc:flex-wrap dc:gap-1">
            {palette.map((color, colorIndex) => (
              <button
                key={colorIndex}
                type="button"
                onClick={() => update(entries.map((row, i) => (i === index ? { ...row, colorIndex } : row)))}
                title={color}
                aria-label={`${t('chart.recordsTable.columnFormats.badgeColour')} ${colorIndex + 1}`}
                className={`dc:w-6 dc:h-6 dc:rounded-sm dc:border-2 dc:cursor-pointer dc:transition-transform dc:hover:scale-110 ${
                  entry.colorIndex === colorIndex ? 'dc:ring-2 dc:ring-offset-1 dc:scale-110' : ''
                }`}
                style={{
                  backgroundColor: color,
                  borderColor: entry.colorIndex === colorIndex ? 'var(--dc-primary)' : 'var(--dc-border)'
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => update([...entries, { value: '', colorIndex: entries.length % Math.max(1, palette.length) }])}
        className="dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-border text-dc-text-secondary hover:bg-dc-surface-hover dc:cursor-pointer"
      >
        {t('chart.recordsTable.columnFormats.badgeAdd')}
      </button>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="dc:flex-1 dc:space-y-1">
      <span className="dc:text-xs text-dc-text-secondary">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const parsed = Number(e.target.value)
          if (Number.isFinite(parsed)) onChange(parsed)
        }}
        aria-label={label}
        className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text"
      />
    </label>
  )
}
