export type NotificationKind = 'task' | 'success' | 'warning' | 'info'

export interface Notification {
  id: string
  kind: NotificationKind
  title: string
  description: string
  /** ISO 8601 */
  createdAt: string
  read: boolean
  /** Route à ouvrir au clic, si pertinent */
  to?: string
}
