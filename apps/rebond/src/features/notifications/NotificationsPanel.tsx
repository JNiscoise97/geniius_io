import { useEffect, useRef, useState, type ElementType } from 'react'
import { AlertTriangle, Bell, CheckCircle2, ClipboardList, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Notification, NotificationKind } from './types'
import { mockNotifications } from './mockNotifications'
import { relativeTime } from './relativeTime'

const kindStyles: Record<NotificationKind, { icon: ElementType; bg: string; text: string }> = {
  task: { icon: ClipboardList, bg: 'bg-amber-50', text: 'text-amber-700' },
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  warning: { icon: AlertTriangle, bg: 'bg-rose-50', text: 'text-rose-700' },
  info: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700' },
}

export function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const containerRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter((n) => !n.read).length

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

  function markAllRead() {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-1"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} className="text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_20px_40px_-12px_rgb(15_23_42_/_0.18),0_4px_12px_-4px_rgb(15_23_42_/_0.08)]"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-black text-slate-950">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm font-medium text-slate-400">
                Aucune notification pour l’instant.
              </p>
            ) : (
              notifications.map((notification) => {
                const style = kindStyles[notification.kind]
                const Icon = style.icon
                const content = (
                  <div
                    className={[
                      'flex gap-3 border-b border-slate-50 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50',
                      notification.read ? '' : 'bg-amber-50/40',
                    ].join(' ')}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.bg}`}
                    >
                      <Icon size={15} className={style.text} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                        {!notification.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500">
                        {notification.description}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">
                        {relativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                )

                if (notification.to) {
                  return (
                    <Link
                      key={notification.id}
                      to={notification.to}
                      onClick={() => {
                        markRead(notification.id)
                        setOpen(false)
                      }}
                      className="block"
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markRead(notification.id)}
                    className="block w-full"
                  >
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
