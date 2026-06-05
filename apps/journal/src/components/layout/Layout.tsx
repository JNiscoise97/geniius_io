import { BookOpenIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppLayout } from '@geniius/layout'
import '@geniius/layout/style.css'

const navItems = [
  { label: 'Accueil', to: '/journal' },
  { label: 'Sessions', to: '/journal/sessions' },
  { label: 'Propositions', to: '/journal/proposals' },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AppLayout
      appName="journal"
      appTitle="Geniius.io | Journal"
      footerName="Journal"
      icon={BookOpenIcon}
      navItems={navItems}
      accentColor="#0d9488"
      accentBgColor="#ccfbf1"
      accentSoftColor="#f0fdfa"
    >
      {children}
    </AppLayout>
  )
}
