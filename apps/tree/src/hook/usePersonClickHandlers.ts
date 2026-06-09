import { useCallback, useEffect, useRef } from 'react'
import { useIsDesktop } from './useIsDesktop'

// Délai (ms) pour distinguer simple-clic de double-clic
const DBLCLICK_DELAY = 220

/**
 * Sur desktop (pointer: fine) :
 *   - 1 clic → onPreview (popup)
 *   - 2 clics rapides → onNavigate (centrer l'arbre)
 * Sur touch :
 *   - 1 clic → onNavigate directement
 */
export function usePersonClickHandlers(
  personId: string | undefined,
  onNavigate?: (id: string) => void,
  onPreview?: (id: string) => void,
) {
  const isDesktop = useIsDesktop()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const onClick = useCallback(() => {
    if (!personId) return

    if (isDesktop) {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
        onNavigate?.(personId)
      } else {
        timer.current = setTimeout(() => {
          timer.current = null
          onPreview?.(personId)
        }, DBLCLICK_DELAY)
      }
    } else {
      onNavigate?.(personId)
    }
  }, [personId, isDesktop, onNavigate, onPreview])

  return { onClick }
}
