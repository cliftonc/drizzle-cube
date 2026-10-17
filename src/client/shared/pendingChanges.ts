/** Keys of changes sent to a host that may still apply them, oldest first. */
export interface PendingChanges {
  /** Key of the value the host showed when it was last checked. */
  source: string
  pending: string[]
}

/**
 * Updates pending changes once the host shows `source`. Showing a pending change
 * acknowledges it and every earlier one. Returns null when the host shows a value
 * it was never sent, or has caught up with `latest`.
 */
export function settlePendingChanges<T extends PendingChanges>(
  changes: T,
  source: string,
  latest = changes.pending.at(-1)
): T | null {
  if (changes.source === source) return changes
  const index = changes.pending.indexOf(source)
  if (index < 0 || (index === changes.pending.length - 1 && latest === source)) return null
  return { ...changes, source, pending: changes.pending.slice(index + 1) }
}
