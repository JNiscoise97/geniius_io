import React, { useEffect } from "react"

type ModalSize = "md" | "lg" | "xl" | "fullscreen"

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "xl",          // ← par défaut : grand
}: {
  open: boolean
  title?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: ModalSize
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const sizeClass =
    size === "fullscreen" ? "modal-sheet--full" :
    size === "xl"         ? "modal-sheet--xl"   :
    size === "lg"         ? "modal-sheet--lg"   :
                            "modal-sheet--md"

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={(e) => {
      // click backdrop pour fermer (mais pas si on clique dans la feuille)
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className={`modal-sheet ${sizeClass}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="icon-btn-lite" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  )
}
