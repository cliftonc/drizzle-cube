import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import infoCircleIcon from "@iconify-icons/tabler/info-circle";
import { useCubeFieldLabel } from "../../hooks/useCubeFieldLabel";
import { filterIncompletePeriod } from "../../utils/periodUtils";
import type { ChartProps } from "../../types";

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
  const [fontSize, setFontSize] = useState(32);
  const [textWidth, setTextWidth] = useState(250);
  const containerRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel();

  // Calculate font size and text width based on container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        if (containerWidth > 0 && containerHeight > 0) {
          const widthBasedSize = containerWidth / 4;
          const heightBasedSize = containerHeight / 4;
          const baseFontSize = Math.min(widthBasedSize, heightBasedSize);
          const clampedFontSize = Math.max(28, Math.min(baseFontSize, 140));
          setFontSize(clampedFontSize);

          setTimeout(() => {
            if (valueRef.current) {
              const textRect = valueRef.current.getBoundingClientRect();
              const measuredWidth = textRect.width;
              // Scale histogram width with container, accounting for labels on the right (~60px)
              const maxHistogramWidth = containerWidth - 100; // Leave room for padding and labels
              const effectiveWidth = Math.max(
                measuredWidth,
                Math.min(maxHistogramWidth, containerWidth * 0.7),
              );
              setTextWidth(Math.max(100, effectiveWidth)); // Minimum 100px
            }
          }, 10);
        }
      }
    };

    const timer = setTimeout(updateDimensions, 50);

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDimensions, 10);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [data, chartConfig]);

  if (!data || data.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? "200px" : undefined,
        }}
      >
        <div className="text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">
            No data points to display
          </div>
        </div>
      </div>
    );
  }

  // Extract value and dimension fields from chart config
  let valueFields: string[] = [];
  let dimensionFields: string[] = [];

  if (chartConfig?.yAxis) {
    valueFields = Array.isArray(chartConfig.yAxis)
      ? chartConfig.yAxis
      : [chartConfig.yAxis];
  }

  if (chartConfig?.xAxis) {
    dimensionFields = Array.isArray(chartConfig.xAxis)
      ? chartConfig.xAxis
      : [chartConfig.xAxis];
  }

  if (valueFields.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? "200px" : undefined,
          backgroundColor: "var(--dc-danger-bg)",
          color: "var(--dc-danger)",
          borderColor: "var(--dc-danger-border)",
        }}
      >
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Configuration Error</div>
          <div className="dc:text-xs">No measure field configured</div>
        </div>
      </div>
    );
  }

  const valueField = valueFields[0];
  const dimensionField = dimensionFields[0]; // Optional

  // Sort data by dimension if available (for time series)
  let sortedData = [...data];
  if (dimensionField) {
    sortedData = sortedData.sort((a, b) => {
      const aVal = a[dimensionField];
      const bVal = b[dimensionField];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  }

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
  const values = dataToUse
    .map((row) => row[valueField])
    .filter((val) => val !== null && val !== undefined && !isNaN(Number(val)))
    .map((val) => Number(val));

  if (values.length < 2) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? "200px" : undefined,
          backgroundColor: "var(--dc-warning-bg)",
          color: "var(--dc-warning)",
          borderColor: "var(--dc-warning-border)",
        }}
      >
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Insufficient Data</div>
          <div className="dc:text-xs">
            Delta calculation requires at least 2 data points
          </div>
          <div className="dc:text-xs">Current data points: {values.length}</div>
        </div>
      </div>
    );
  }

  // Calculate delta between last and second-last values
  const lastValue = values[values.length - 1];
  const secondLastValue = values[values.length - 2];
  const absoluteChange = lastValue - secondLastValue;
  const percentageChange =
    secondLastValue !== 0
      ? (absoluteChange / Math.abs(secondLastValue)) * 100
      : 0;

  const isPositiveChange = absoluteChange >= 0;

  // Format number with appropriate units and decimals
  const formatNumber = (value: number | null | undefined): string => {
    // If custom formatValue is provided, use it exclusively
    if (displayConfig.formatValue) {
      return displayConfig.formatValue(value);
    }

    // Null handling: Show placeholder for missing data
    if (value === null || value === undefined) {
      return "—";
    }

    const decimals = displayConfig.decimals ?? 0;
    const prefix = displayConfig.prefix ?? "";

    let formattedValue: string;

    if (Math.abs(value) >= 1e9) {
      formattedValue = (value / 1e9).toFixed(decimals) + "B";
    } else if (Math.abs(value) >= 1e6) {
      formattedValue = (value / 1e6).toFixed(decimals) + "M";
    } else if (Math.abs(value) >= 1e3) {
      formattedValue = (value / 1e3).toFixed(decimals) + "K";
    } else {
      formattedValue = value.toFixed(decimals);
    }

    return prefix + formattedValue;
  };

  // Get colors from palette
  const getPositiveColor = (): string => {
    if (
      displayConfig.positiveColorIndex !== undefined &&
      colorPalette?.colors
    ) {
      const colorIndex = displayConfig.positiveColorIndex;
      if (colorIndex >= 0 && colorIndex < colorPalette.colors.length) {
        return colorPalette.colors[colorIndex];
      }
    }
    return "#10b981"; // Default green
  };

  const getNegativeColor = (): string => {
    if (
      displayConfig.negativeColorIndex !== undefined &&
      colorPalette?.colors
    ) {
      const colorIndex = displayConfig.negativeColorIndex;
      if (colorIndex >= 0 && colorIndex < colorPalette.colors.length) {
        return colorPalette.colors[colorIndex];
      }
    }
    return "#ef4444"; // Default red
  };

  const positiveColor = getPositiveColor();
  const negativeColor = getNegativeColor();
  const currentColor = isPositiveChange ? positiveColor : negativeColor;

  return (
    <div
      ref={containerRef}
      className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4"
      style={{
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? "200px" : undefined,
      }}
    >
      {/* Field Label */}
      <div
        className="text-dc-text-secondary dc:font-bold text-center dc:mb-2 dc:flex dc:items-center dc:justify-center dc:gap-1"
        style={{
          fontSize: "14px",
          lineHeight: "1.2",
        }}
      >
        <span>
          {(() => {
            const label = getFieldLabel(valueField);
            return label && label.length > 1 ? label : valueField;
          })()}
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
          <div className="text-left">
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
          className="text-dc-text-muted text-center dc:mb-3"
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
