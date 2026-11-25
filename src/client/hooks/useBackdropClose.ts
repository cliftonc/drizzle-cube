/**
 * Close a modal on a backdrop click, but not at the end of a drag that left the dialog.
 *
 * A browser fires `click` on the nearest common ancestor of the press and the release.
 * When a user selects text in a field and releases the button outside the dialog, that
 * ancestor is the backdrop, so a plain `onClick={onClose}` closes the modal. This hook
 * closes it only when the press also started on the backdrop.
 */

import { useCallback, useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'

export interface BackdropCloseProps {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onClick: (event: MouseEvent<HTMLElement>) => void
}

/**
 * Returns the event handlers to spread on a modal backdrop element.
 *
 * @param onClose Called when a press starts and ends on the backdrop itself
 * @param enabled When false, the backdrop never closes the modal
 * @returns `onPointerDown` and `onClick` handlers for the backdrop element
 */
export function useBackdropClose(onClose: () => void, enabled = true): BackdropCloseProps {
  const pressStartedOnBackdrop = useRef(false)

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget
  }, [])

  const onClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const startedOnBackdrop = pressStartedOnBackdrop.current
      pressStartedOnBackdrop.current = false
      if (enabled && startedOnBackdrop && event.target === event.currentTarget) {
        onClose()
      }
    },
    [enabled, onClose]
  )

  return { onPointerDown, onClick }
}
