/**
 * DisplayOptionControl Component
 *
 * Renders a single structured display option (boolean, string, number, select,
 * color, paletteColor, axisFormat, stringArray, buttonGroup) for the
 * AnalysisDisplayConfigPanel. Each option type has its own small presentational
 * component so the dispatcher stays flat. Behaviour is identical to the previous
 * inline rendering.
 */

import type { ReactElement } from 'react'
import type { ChartDisplayConfig, ColorPalette, AxisFormatConfig } from '../../types'
import type { DisplayOptionConfig } from '../../charts/chartConfigs'
import { AxisFormatControls } from '../charts/AxisFormatControls'
import { useTranslation } from '../../hooks/useTranslation'
import StringArrayInput from './StringArrayInput'

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
        className="dc:rounded border-dc-border focus:ring-dc-accent"
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
            className={`dc:w-8 dc:h-8 dc:rounded dc:border-2 dc:transition-all dc:duration-200 dc:hover:scale-110 focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent dc:focus:ring-offset-1 ${
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
  buttonGroup: ButtonGroupOption
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
