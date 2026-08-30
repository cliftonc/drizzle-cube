/**
 * DisplayOptionControl Component
 *
 * Renders a single structured display option (boolean, string, number, select,
 * color, paletteColor, axisFormat, stringArray, buttonGroup, thresholdBands) for the
 * AnalysisDisplayConfigPanel. Each option type has its own small presentational
 * component so the dispatcher stays flat. Behaviour is identical to the previous
 * inline rendering.
 */

import type { ReactElement } from 'react'
import type { ChartDisplayConfig, ColorPalette, AxisFormatConfig, ThresholdBand } from '../../types.js'
import type { DisplayOptionConfig } from '../../charts/chartConfigs.js'
import { AxisFormatControls } from '../charts/AxisFormatControls.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import StringArrayInput from './StringArrayInput.js'
import { parseThresholds } from '../charts/gaugeChartHelpers.js'

/** Neutral starting colour for a newly added threshold band. */
const DEFAULT_BAND_COLOUR = '#22c55e'

type SetValue = (value: unknown) => void

interface OptionRenderProps {
  option: DisplayOptionConfig
  displayConfig: ChartDisplayConfig
  colorPalette?: ColorPalette
  setValue: SetValue
  t: (key: string) => string
}

function OptionDescription({ description, t }: { description?: string; t: (key: string) => string }) {
  if (!description) return null
  return <p className="dc:text-xs text-dc-text-muted">{t(description)}</p>
}

function BooleanOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  return (
    <label className="dc:flex dc:items-center dc:space-x-2">
      <input
        type="checkbox"
        checked={(displayConfig[key] as boolean) ?? option.defaultValue ?? false}
        onChange={(e) => setValue(e.target.checked)}
        className="dc:rounded-sm border-dc-border focus:ring-dc-accent"
        style={{ color: 'var(--dc-primary)' }}
      />
      <span className="dc:text-sm text-dc-text">{t(option.label)}</span>
    </label>
  )
}

function StringOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  const value = (displayConfig[key] as string) ?? option.defaultValue ?? ''
  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">
        {t(option.label)}
        {option.key === 'content' && (
          <span className="dc:text-xs text-dc-text-muted dc:ml-1">
            (only headers, lists and links)
          </span>
        )}
      </label>
      {option.key === 'content' ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={option.placeholder}
          rows={8}
          className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent dc:font-mono dc:resize-y bg-dc-surface text-dc-text"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={option.placeholder}
          className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
        />
      )}
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}

function PaletteColorOption({ option, displayConfig, colorPalette, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  const selectedIndex = (displayConfig[key] as number) ?? option.defaultValue ?? 0
  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{t(option.label)}</label>
      <div className="dc:flex dc:flex-wrap dc:gap-2">
        {colorPalette?.colors.map((color, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setValue(index)}
            className={`dc:w-8 dc:h-8 dc:rounded-sm dc:border-2 dc:transition-all dc:duration-200 dc:hover:scale-110 focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent dc:focus:ring-offset-1 ${
              selectedIndex === index
                ? 'dc:ring-2 dc:ring-offset-1 dc:scale-110'
                : 'hover:border-dc-text-muted'
            }`}
            style={{
              backgroundColor: color,
              borderColor: selectedIndex === index ? 'var(--dc-primary)' : 'var(--dc-border)'
            }}
            title={`Color ${index + 1}: ${color}`}
          />
        )) || [
          <button
            key={0}
            type="button"
            onClick={() => setValue(0)}
            className="dc:w-8 dc:h-8 dc:rounded-sm dc:border-2 dc:ring-2 dc:ring-offset-1"
            style={{
              backgroundColor: '#8884d8',
              borderColor: 'var(--dc-primary)',
              boxShadow: '0 0 0 2px var(--dc-primary)'
            }}
            title="Default Color"
          />
        ]}
      </div>
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}

function NumberOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{t(option.label)}</label>
      <input
        type="number"
        value={(displayConfig[key] as number) ?? option.defaultValue ?? 0}
        onChange={(e) => setValue(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder={option.placeholder}
        min={option.min}
        max={option.max}
        step={option.step}
        className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
      />
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}

function SelectOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{t(option.label)}</label>
      <select
        value={(displayConfig[key] as string) ?? option.defaultValue ?? ''}
        onChange={(e) => setValue(e.target.value)}
        className="dc:w-full dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
      >
        {option.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.label)}
          </option>
        ))}
      </select>
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}

function ColorOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  const colorValue = (displayConfig[key] as string) ?? option.defaultValue ?? '#8884d8'
  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{t(option.label)}</label>
      <div className="dc:flex dc:items-center dc:space-x-2">
        <input
          type="color"
          value={colorValue}
          onChange={(e) => setValue(e.target.value)}
          className="dc:w-12 dc:h-8 dc:border border-dc-border dc:rounded-sm dc:cursor-pointer"
        />
        <input
          type="text"
          value={colorValue}
          onChange={(e) => setValue(e.target.value)}
          placeholder={option.placeholder || '#8884d8'}
          className="dc:flex-1 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
        />
      </div>
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}

function AxisFormatOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  return (
    <AxisFormatControls
      axisLabel={t(option.label)}
      value={(displayConfig[key] as AxisFormatConfig) || {}}
      onChange={(config) => setValue(Object.keys(config).length > 0 ? config : undefined)}
    />
  )
}

function StringArrayOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  return (
    <StringArrayInput
      label={t(option.label)}
      value={(displayConfig[key] as string[]) ?? []}
      onChange={(arrayValue) => setValue(arrayValue.length > 0 ? arrayValue : undefined)}
      placeholder={option.placeholder}
      description={option.description ? t(option.description) : undefined}
    />
  )
}

function ButtonGroupOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{t(option.label)}</label>
      <div className="dc:flex dc:border border-dc-border dc:rounded-sm dc:overflow-hidden">
        {option.options?.map((opt) => {
          const isSelected = (displayConfig[key] ?? option.defaultValue) === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue(opt.value)}
              className={`dc:flex-1 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                isSelected
                  ? 'bg-dc-primary text-white'
                  : 'bg-dc-surface text-dc-text hover:bg-dc-border'
              }`}
            >
              {t(opt.label)}
            </button>
          )
        })}
      </div>
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}


/**
 * Threshold bands for the gauge.
 *
 * A band's `value` is stored as a 0-1 fraction of the gauge's min->max range,
 * which is not what anyone wants to type. The editor works in the gauge's own
 * units - read from the same displayConfig - and converts on the way in and out,
 * so a 0-100 dial is edited as 50, not 0.5.
 */
function ThresholdBandsOption({ option, displayConfig, setValue, t }: OptionRenderProps) {
  const key = option.key as keyof ChartDisplayConfig
  const raw = displayConfig[key]
  const bands = parseThresholds(raw as string | ThresholdBand[] | undefined)

  const min = Number(displayConfig.minValue ?? 0)
  const max = Number(displayConfig.maxValue ?? 100)
  const span = max - min
  // A zero span would make every band land on the same point; fall back to
  // editing the raw fraction rather than dividing by zero.
  const usable = Number.isFinite(span) && span !== 0
  const toScale = (fraction: number) => (usable ? min + fraction * span : fraction)
  const toFraction = (scaled: number) => (usable ? (scaled - min) / span : scaled)

  const commit = (next: ThresholdBand[]) => {
    const sorted = [...next].sort((a, b) => a.value - b.value)
    setValue(sorted.length > 0 ? sorted : undefined)
  }
  const update = (index: number, patch: Partial<ThresholdBand>) =>
    commit(bands.map((band, i) => (i === index ? { ...band, ...patch } : band)))

  return (
    <div className="dc:space-y-1">
      <label className="dc:text-sm text-dc-text-secondary">{t(option.label)}</label>
      <div className="dc:space-y-1">
        {bands.map((band, index) => (
          <div key={index} className="dc:flex dc:items-center dc:gap-2">
            <input
              type="color"
              value={band.color}
              onChange={(e) => update(index, { color: e.target.value })}
              aria-label={t('chart.gauge.thresholds.colour')}
              className="dc:w-10 dc:h-8 dc:shrink-0 dc:border border-dc-border dc:rounded-sm dc:cursor-pointer"
            />
            <input
              type="number"
              value={Number(toScale(band.value).toFixed(4))}
              onChange={(e) => {
                const scaled = Number(e.target.value)
                if (Number.isFinite(scaled)) update(index, { value: toFraction(scaled) })
              }}
              aria-label={t('chart.gauge.thresholds.from')}
              className="dc:flex-1 dc:min-w-0 dc:px-2 dc:py-1 dc:text-sm dc:border border-dc-border dc:rounded-sm focus:ring-dc-accent focus:border-dc-accent bg-dc-surface text-dc-text"
            />
            <button
              type="button"
              onClick={() => commit(bands.filter((_, i) => i !== index))}
              title={t('chart.gauge.thresholds.remove')}
              className="dc:px-2 dc:py-1 dc:text-sm dc:shrink-0 dc:rounded-sm text-dc-danger hover:bg-dc-danger-bg dc:cursor-pointer"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const last = bands[bands.length - 1]
          // Drop the new band midway between the last one and the top of the dial.
          const next = last ? Math.min(1, (last.value + 1) / 2) : 0
          commit([...bands, { value: next, color: DEFAULT_BAND_COLOUR }])
        }}
        className="dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-border text-dc-text-secondary hover:bg-dc-surface-hover dc:cursor-pointer"
      >
        {t('chart.gauge.thresholds.add')}
      </button>
      <OptionDescription description={option.description} t={t} />
    </div>
  )
}

// Dispatch table — keyed by option.type. Keeps the control's render flat.
const OPTION_RENDERERS: Record<string, (props: OptionRenderProps) => ReactElement | null> = {
  boolean: BooleanOption,
  string: StringOption,
  paletteColor: PaletteColorOption,
  number: NumberOption,
  select: SelectOption,
  color: ColorOption,
  axisFormat: AxisFormatOption,
  stringArray: StringArrayOption,
  buttonGroup: ButtonGroupOption,
  thresholdBands: ThresholdBandsOption
}

interface DisplayOptionControlProps {
  option: DisplayOptionConfig
  displayConfig: ChartDisplayConfig
  colorPalette?: ColorPalette
  onDisplayConfigChange: (config: ChartDisplayConfig) => void
}

export default function DisplayOptionControl({
  option,
  displayConfig,
  colorPalette,
  onDisplayConfigChange,
}: DisplayOptionControlProps) {
  const { t } = useTranslation()
  const setValue: SetValue = (value) =>
    onDisplayConfigChange({ ...displayConfig, [option.key]: value })

  const Renderer = OPTION_RENDERERS[option.type]
  if (!Renderer) return null
  return <Renderer option={option} displayConfig={displayConfig} colorPalette={colorPalette} setValue={setValue} t={t} />
}
