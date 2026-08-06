import type { ReactNode } from 'react'

import { GitBranch } from 'lucide-react'

import { AppLayout } from '@geniius/layout'
import '@geniius/layout/style.css'

import { useRoleStore } from '@/store/useRoleStore'

import SettingsSheet from '../shared/sheets/SettingsSheet'
import SearchSheet from '@/features/recherche/SearchSheet'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { role } = useRoleStore()

  const navItems = [
    { label: 'Actes notariés', to: '/ac-actes/liste' },
    { label: "Actes d'état-civil", to: '/ec-bureaux/liste' },
    { label: 'Individus', to: '/individus' },
    { label: 'Familles', to: '/familles' },
    { label: 'Sources', to: '/sources' },
    { label: 'Lieux', to: '/lieux' },
    { label: 'Notaires', to: '/notaires/liste' },
    {
      label: 'Recherche',
      to: '/recherche',
      render: () => <SearchSheet />,
      hideInDropdown: true,
    },
    {
      label: 'Configuration',
      to: '/configuration',
      render: () => <SettingsSheet />,
      hideInDropdown: true,
    },
    { label: 'Profil', to: '/profil' },
  ]

  return (
    <AppLayout
      appName="rebond"
      appTitle="Geniius.io | Rebond"
      footerName="Rebond"
      icon={GitBranch}
      navItems={navItems}
      accentColor="#4f46e5"
      accentBgColor="#e0e7ff"
      accentSoftColor="#eef2ff"
      rightActions={
        <>
          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase text-white">
            {role}
          </span>

          <SearchSheet />
          <SettingsSheet />
        </>
      }
    >
      {children}
    </AppLayout>
  )
}