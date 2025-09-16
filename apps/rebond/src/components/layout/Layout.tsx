import { useState } from "react"
import type { ReactNode } from "react"

import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useRoleStore } from "@/store/useRoleStore"
import SettingsSheet from "../shared/sheets/SettingsSheet"
import SearchSheet from "@/features/recherche/SearchSheet"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === "/"
  const { role } = useRoleStore()

  const navItems = [
    { label: "Actes notariés", to: "ac-actes/liste" },
    { label: "Actes d'état-civil", to: "ec-bureaux/liste" },
    { label: "Individus", to: "/individus" },
    { label: "Familles", to: "/familles" },
    { label: "Lieux", to: "/lieux" },
    { label: "Notaires", to: "/notaires/liste" },
    { label: "Recherche", to: "/recherche" },
    { label: "Configuration", to: "/configuration" },
    { label: "Profil", to: "/profil" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <Link to="/"><h1 className="text-lg font-bold text-indigo-600">Geniius.io | Rebond</h1></Link>
        {/* Bouton burger visible partout sauf sur l’accueil ET en desktop */}
        {!isHome && (
          <div className="flex items-center gap-4">
            {/* Badge rôle */}
            <span className="text-xs font-semibold text-white bg-indigo-600 rounded-full px-3 py-1 uppercase">
              {role}
            </span>
            <SearchSheet key="search" />
            <SettingsSheet key="settings" />
            {/* Bouton menu */}
            <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
              ☰
            </Button>
          </div>
        )}

        {/* Navigation horizontale visible uniquement sur l’accueil ET desktop */}
        {isHome && (
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) =>
              item.label === "Recherche" ? (
                <SearchSheet key="search" />
              ) : item.label === "Configuration" ? (
                <SettingsSheet key="settings" />
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm text-gray-700 hover:text-indigo-600"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        )}

      </header>

      {/* Navigation latérale (mobile ou pages autres que /) */}
      {open && (
        <nav className="bg-gray-100 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block text-sm text-gray-700 hover:text-indigo-600"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}


      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
        <footer className="border-t pt-6 pb-6 text-sm text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Rebond. Tous droits réservés.</p>
        <div className="mt-2 space-x-4">
          <a href="/mentions-legales" className="underline">Mentions légales</a>
          <a href="/a-propos" className="underline">À propos</a>
          <a href="/contact" className="underline">Contact</a>
        </div>
      </footer>
      </main>

      
    </div>
  )
}
