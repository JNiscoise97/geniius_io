import { LeafIcon, Search, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppLayout } from '@geniius/layout'
import '@geniius/layout/style.css'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { label: 'Mes arbres', to: '/trees' },
  { label: 'Importer', to: '/import' },
  { label: 'Explorer', to: '/explore' },
  { label: 'Sources', to: '/sources' },
  { label: 'Profil', to: '/profil' },
]

export default function Layout({ children }: LayoutProps) {
  return (
    <AppLayout
      appName="tree"
      appTitle="Geniius.io | Tree"
      footerName="Tree"
      icon={LeafIcon}
      navItems={navItems}
      accentColor="#4f46e5"
      accentBgColor="#e0e7ff"
      accentSoftColor="#eef2ff"
      rightActions={
        <>
          <button className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 sm:block">
            <Search size={18} />
          </button>
          <button className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 sm:block">
            <Settings size={18} />
          </button>
        </>
      }
    >
      {children}
    </AppLayout>
  )
}