/**
 * Grid-unit geometry for portlet groups.
 *
 * A leaf module on purpose: `layoutUtils` needs `deriveGroupGeometry` to write
 * x/y/w/h back onto grouped children, while `groupUtils` needs `layoutUtils`
 * for row-width maths. Keeping the geometry here breaks what would otherwise be
 * an import cycle between the two.
 */

import type { PortletGroup } from '../../types.js'

/** Edge of a card a drag can be dropped against. Lives here, not in
 *  `groupUtils`, so `layoutUtils` can name it without importing back. */
export type SnapEdge = 'top' | 'right' | 'bottom' | 'left'

/**
 * Split `total` integer units across `weights` using largest-remainder, never
 * handing out less than 1. When `total < weights.length` every entry still gets
 * 1 and the result overflows - callers accept that rather than dropping a
 * portlet to zero size.
 */
export function partitionUnits(total: number, weights: number[]): number[] {
  const count = weights.length
  if (count === 0) return []
  if (total <= count) return weights.map(() => 1)

  const weightSum = weights.reduce((sum, weight) => sum + Math.max(weight, 0), 0) || count
  const exact = weights.map((weight) => (Math.max(weight, 0) / weightSum) * total)
  const result = exact.map((value) => Math.max(1, Math.floor(value)))

  let remaining = total - result.reduce((sum, value) => sum + value, 0)

  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)

  let cursor = 0
  while (remaining > 0) {
    result[byFraction[cursor % count].index] += 1
    remaining -= 1
    cursor += 1
  }

  while (remaining < 0) {
    const shrinkable = result
      .map((value, index) => ({ value, index }))
      .filter((entry) => entry.value > 1)
      .sort((a, b) => b.value - a.value)
    if (shrinkable.length === 0) break
    result[shrinkable[0].index] -= 1
    remaining += 1
  }

  return result
}

/**
 * Grid-unit rectangle for every portlet in a group, given the rectangle the
 * group itself occupies. Written back onto the portlets so grid mode, the
 * mobile stack and thumbnails keep working without knowing groups exist.
 */
export function deriveGroupGeometry(
  group: PortletGroup,
  x: number,
  y: number,
  w: number,
  h: number
): Array<{ portletId: string; x: number; y: number; w: number; h: number }> {
  const cells = group.cells.filter((cell) => cell.portletIds.length > 0)
  if (cells.length === 0) return []

  // Cells share the axis equally; partitionUnits still does the integer
  // largest-remainder split so the parts add up to the whole.
  const weights = cells.map(() => 1)
  const horizontal = group.direction === 'row'
  const mainSizes = partitionUnits(horizontal ? w : h, weights)

  const result: Array<{ portletId: string; x: number; y: number; w: number; h: number }> = []
  let mainOffset = horizontal ? x : y

  cells.forEach((cell, cellIndex) => {
    const mainSize = mainSizes[cellIndex]
    const crossSizes = partitionUnits(
      horizontal ? h : w,
      cell.portletIds.map(() => 1)
    )
    let crossOffset = horizontal ? y : x

    cell.portletIds.forEach((portletId, stackIndex) => {
      const crossSize = crossSizes[stackIndex]
      result.push(
        horizontal
          ? { portletId, x: mainOffset, y: crossOffset, w: mainSize, h: crossSize }
          : { portletId, x: crossOffset, y: mainOffset, w: crossSize, h: mainSize }
      )
      crossOffset += crossSize
    })

    mainOffset += mainSize
  })

  return result
}
