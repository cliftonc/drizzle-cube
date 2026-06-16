import React from "react";
import { useTranslation } from '../../hooks/useTranslation.js';
import { Icon } from "@iconify/react";
import infoCircleIcon from "@iconify-icons/tabler/info-circle";
import { useCubeFieldLabel } from "../../hooks/useCubeFieldLabel.js";
import { filterIncompletePeriod } from "../../utils/periodUtils.js";
import { formatKpiNumber, resolveDisplayLabel } from "./KpiNumber.helpers.js";
import { useKpiDimensions } from "./useKpiDimensions.js";
import { KpiCenteredState, kpiHeightStyle } from "./KpiStates.js";
import {
  toFieldList,
  sortByDimension,
  extractNumericValues,
  computeDelta,
  resolvePaletteColor,
} from "./KpiDelta.helpers.js";
import type { ChartProps } from "../../types.js";

interface VarianceHistogramProps {
  values: number[];
  lastValue: number;
  positiveColor: string;
  negativeColor: string;
  formatValue: (value: number) => string;
  width: number;
  height: number;
}

function VarianceHistogram({
  values,
  lastValue,
  positiveColor,
  negativeColor,
  formatValue,
  width,
  height,
}: VarianceHistogramProps) {
  // Limit to most recent N values to fit in the histogram
  // Calculate max bars based on width (minimum 8px per bar including gap)
  const maxBars = Math.max(10, Math.floor(width / 10));
  const limitedValues =
    values.length > maxBars
      ? values.slice(-maxBars) // Take the most recent values
      : values;

  // Calculate variance (difference) from current/last value for each point
  const variances = limitedValues.map((value) => value - lastValue);

  // Find min/max variance for scaling (include 0 as baseline)
  const minVariance = Math.min(...variances, 0);
  const maxVariance = Math.max(...variances, 0);
  const range = Math.max(Math.abs(minVariance), Math.abs(maxVariance));

  if (range === 0 || variances.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center bg-dc-bg-secondary dc:rounded-sm dc:border border-dc-border"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="dc:text-xs text-dc-text-muted">No variance data</span>
      </div>
    );
  }

  // Calculate bar dimensions
  const barGap = 2;
  const availableWidth = width - (limitedValues.length - 1) * barGap;
  const barWidth = Math.max(4, availableWidth / limitedValues.length);

  // Calculate where zero line should be positioned (as percentage from top)
  // If maxVariance = 67 and minVariance = -24, total range = 91
  // Zero should be at 67/91 = 73.6% from top
  const totalRange = maxVariance - minVariance;
  const zeroLinePercent =
    totalRange > 0 ? (maxVariance / totalRange) * 100 : 50;

  return (
    <div className="dc:flex dc:items-center dc:space-x-2">
      {/* Histogram bars */}
      <div
        className="dc:relative"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Zero line (represents current value) */}
        <div
          className="dc:absolute dc:left-0 dc:right-0"
          style={{
            height: "1px",
            top: `${zeroLinePercent}%`,
            backgroundColor: "var(--dc-border)",
            zIndex: 1,
          }}
        />

        {/* Variance bars - oldest to newest (left to right) */}
        {variances.map((variance, index) => {
          // Calculate bar height as proportion of total range
          const normalizedHeight = Math.abs(variance) / totalRange;
          const barHeight = Math.max(2, normalizedHeight * (height - 4));
          const isPositive = variance >= 0;
          const isLastValue = index === limitedValues.length - 1;
          const color = isPositive ? positiveColor : negativeColor;
          const xPosition = index * (barWidth + barGap);

          return (
            <div
              key={index}
              className="dc:absolute rounded-xs"
              style={{
                left: `${xPosition}px`,
                width: `${barWidth}px`,
                height: `${barHeight}px`,
                backgroundColor: color,
                opacity: isLastValue ? 1 : 0.6,
                // Position bar relative to zero line
                ...(isPositive
                  ? { bottom: `${100 - zeroLinePercent}%` }
                  : { top: `${zeroLinePercent}%` }),
                zIndex: 2,
              }}
              title={`${formatValue(limitedValues[index])}: ${variance >= 0 ? "+" : ""}${formatValue(variance)} vs current`}
            />
          );
        })}
      </div>

      {/* Variance labels on the right - show actual value difference */}
      <div
        className="dc:flex dc:flex-col dc:justify-between dc:text-xs text-dc-text-muted"
        style={{ height: `${height}px` }}
      >
        <span>+{formatValue(maxVariance)}</span>
        <span>
          {minVariance < 0 ? "" : ""}
          {formatValue(minVariance)}
        </span>
      </div>
    </div>
  );
}

const KpiDelta = React.memo(function KpiDelta({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette,
}: ChartProps) {
  const { t } = useTranslation();
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel();

  // Calculate font size and text width based on container dimensions
  const { containerRef, valueRef, fontSize, textWidth } = useKpiDimensions({
    widthDivisor: 4,
    heightDivisor: 4,
    minFontSize: 28,
    maxFontSize: 140,
    // Scale histogram width with container, accounting for labels on the right (~60px)
    measureWidth: (measuredWidth, containerWidth) => {
      const maxHistogramWidth = containerWidth - 100; // Leave room for padding and labels
      const effectiveWidth = Math.max(
        measuredWidth,
        Math.min(maxHistogramWidth, containerWidth * 0.7),
      );
      return Math.max(100, effectiveWidth); // Minimum 100px
    },
    deps: [data, chartConfig],
  });

  if (!data || data.length === 0) {
    return (
      <KpiCenteredState
        height={height}
        title={t('chart.runtime.noData')}
        hint="No data points to display"
      />
    );
  }

  // Extract value and dimension fields from chart config
  const valueFields = toFieldList(chartConfig?.yAxis);
  const dimensionFields = toFieldList(chartConfig?.xAxis);

  if (valueFields.length === 0) {
    return (
      <KpiCenteredState
        height={height}
        variant="danger"
        title={t('chart.runtime.configError')}
        hint={t('chart.runtime.configErrorHint.noMeasure')}
      />
    );
  }

  const valueField = valueFields[0];
  const dimensionField = dimensionFields[0]; // Optional

  // Sort data by dimension if available (for time series)
  const sortedData = sortByDimension(data, dimensionField);

  // Filter out incomplete or last period if enabled
  const { useLastCompletePeriod = true, skipLastPeriod = false } =
    displayConfig;
  const {
    filteredData,
    excludedIncompletePeriod,
    skippedLastPeriod,
    granularity,
  } = filterIncompletePeriod(
    sortedData,
    dimensionField,
    queryObject,
    useLastCompletePeriod,
    skipLastPeriod,
  );

  // Use filtered data for calculations
  const dataToUse = filteredData;

  // Extract values from filtered data
  const values = extractNumericValues(dataToUse, valueField);

  if (values.length < 2) {
    return (
      <KpiCenteredState
        height={height}
        variant="warning"
        title={t('chart.runtime.kpiDelta.insufficientData')}
        hint={t('chart.runtime.kpiDelta.requiresTwoPoints')}
      >
        <div className="dc:text-xs">{t('chart.runtime.kpiDelta.currentPoints', { count: values.length })}</div>
      </KpiCenteredState>
    );
  }

  // Calculate delta between last and second-last values
  const { lastValue, absoluteChange, percentageChange, isPositiveChange } =
    computeDelta(values);

  // Format number with appropriate units and decimals
  const formatNumber = (value: number | null | undefined): string =>
    formatKpiNumber(value, displayConfig);

  // Get colors from palette
  const positiveColor = resolvePaletteColor(
    displayConfig.positiveColorIndex,
    colorPalette?.colors,
    "#10b981", // Default green
  );
  const negativeColor = resolvePaletteColor(
    displayConfig.negativeColorIndex,
    colorPalette?.colors,
    "#ef4444", // Default red
  );
  const currentColor = isPositiveChange ? positiveColor : negativeColor;

  return (
    <div
      ref={containerRef}
      className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4"
      style={kpiHeightStyle(height)}
    >
      {/* Field Label */}
      <div
        className="text-dc-text-secondary dc:font-bold dc:text-center dc:mb-2 dc:flex dc:items-center dc:justify-center dc:gap-1"
        style={{
          fontSize: "14px",
          lineHeight: "1.2",
        }}
      >
        <span>
          {resolveDisplayLabel(getFieldLabel(valueField), valueField)}
        </span>
        {(excludedIncompletePeriod || skippedLastPeriod) && (
          <span
            title={
              skippedLastPeriod
                ? `Excludes last ${granularity || "period"}`
                : `Excludes current incomplete ${granularity}`
            }
            className="dc:cursor-help"
          >
            <Icon
              icon={infoCircleIcon}
              className="dc:w-4 dc:h-4 text-dc-text-muted dc:opacity-70"
            />
          </span>
        )}
      </div>

      {/* Main KPI Value and Delta */}
      <div className="dc:flex dc:items-center dc:justify-center dc:space-x-4 dc:mb-2">
        {/* Main KPI Value */}
        <div
          ref={valueRef}
          className="dc:font-bold dc:leading-none"
          style={{
            fontSize: `${fontSize}px`,
            color: "var(--dc-text)", // Keep main value neutral
          }}
        >
          {formatNumber(lastValue)}
        </div>

        {/* Delta Information */}
        <div className="dc:flex dc:items-center dc:space-x-1">
          {/* Arrow */}
          <div
            className="dc:font-bold"
            style={{
              color: currentColor,
              fontSize: `${fontSize * 0.35}px`,
            }}
          >
            {isPositiveChange ? "▲" : "▼"}
          </div>

          {/* Delta Values */}
          <div className="dc:text-left">
            <div
              className="dc:font-bold dc:leading-tight"
              style={{
                fontSize: `${fontSize * 0.35}px`,
                color: currentColor,
              }}
            >
              {isPositiveChange ? "+" : ""}
              {formatNumber(absoluteChange)}
            </div>
            <div
              className="dc:font-semibold dc:leading-tight"
              style={{
                fontSize: `${fontSize * 0.28}px`,
                color: currentColor,
                opacity: 0.8,
              }}
            >
              {isPositiveChange ? "+" : ""}
              {percentageChange.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Unit/Suffix (hidden when formatValue is provided) */}
      {displayConfig.suffix && !displayConfig.formatValue && (
        <div
          className="text-dc-text-muted dc:text-center dc:mb-3"
          style={{
            fontSize: "14px",
            lineHeight: "1.2",
            opacity: 0.8,
          }}
        >
          {displayConfig.suffix}
        </div>
      )}

      {/* Variance Histogram */}
      {displayConfig.showHistogram !== false && values.length > 2 && (
        <div className="dc:mt-2 dc:w-full dc:flex dc:justify-center dc:overflow-hidden">
          <VarianceHistogram
            values={values}
            lastValue={lastValue}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
            formatValue={formatNumber}
            width={textWidth}
            height={64}
          />
        </div>
      )}
    </div>
  );
})

export default KpiDelta
