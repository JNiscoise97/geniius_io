import { useEffect, useRef, useState, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import { FileStack, LogOut, Settings, User } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

function initialsFromEmail(email: string | undefined) {
  return (email ?? '').split('@')[0].slice(0, 2).toUpperCase() || '?'
}

const menuLinks: { label: string; to: string; icon: ElementType }[] = [
  { label: 'Mon profil', to: '/mock/profil', icon: User },
  { label: 'Mes contributions', to: '/mock/contributions', icon: FileStack },
  { label: 'Paramètres', to: '/mock/parametres', icon: Settings },
]

export function UserMenu({
  session,
  onSignOut,
}: {
  session: Session
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Mon compte"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700 transition hover:bg-indigo-200"
      >
        {initialsFromEmail(session.user.email)}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_20px_40px_-12px_rgb(15_23_42_/_0.18),0_4px_12px_-4px_rgb(15_23_42_/_0.08)]"
          role="menu"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-black text-slate-950">{session.user.email}</p>
          </div>

          <div className="p-1.5">
            {menuLinks.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Icon size={16} className="text-slate-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
