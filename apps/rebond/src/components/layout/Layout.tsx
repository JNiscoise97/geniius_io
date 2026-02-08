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
    { label: "Actes notariés", to: "/ac-actes/liste" },
    { label: "Actes d'état-civil", to: "/ec-bureaux/liste" },
    { label: "Individus", to: "/individus" },
    { label: "Familles", to: "/familles" },
    { label: "Sources", to: "/sources" },
    { label: "Lieux", to: "/lieux" },
    { label: "Notaires", to: "/notaires/liste" },
    { label: "Recherche", to: "/recherche" },
    { label: "Configuration", to: "/configuration" },
    { label: "Profil", to: "/profil" },
  ]

  return (
  <div className="flex min-h-dvh flex-col">
    {/* Header */}
    <header className="shrink-0 bg-white shadow p-4 flex items-center justify-between">
      <Link to="/">
        <h1 className="text-lg font-bold text-indigo-600">Geniius.io | Rebond</h1>
      </Link>

      {/* Pages ≠ accueil : badge + boutons + burger */}
      {!isHome && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-white bg-indigo-600 rounded-full px-3 py-1 uppercase">
            {role}
          </span>

          <SearchSheet />
          <SettingsSheet />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Ouvrir le menu"
          >
            ☰
          </Button>
        </div>
      )}

      {/* Accueil : nav horizontale desktop */}
      {isHome && (
        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => {
            if (item.label === "Recherche") return <SearchSheet key="search" />;
            if (item.label === "Configuration") return <SettingsSheet key="settings" />;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-gray-700 hover:text-indigo-600"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>

    {/* Navigation latérale (burger) */}
    {open && (
      <nav className="shrink-0 bg-gray-100 p-4 space-y-2">
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

    {/* Main content (scrollable) */}
    <main className="min-h-0 flex-1 overflow-auto">
      {children}
    </main>

    {/* Footer (hors scroll) */}
    <footer className="shrink-0 border-t pt-6 pb-6 text-sm text-center text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Rebond. Tous droits réservés.</p>
      <div className="mt-2 space-x-4">
        <a href="/mentions-legales" className="underline">
          Mentions légales
        </a>
        <a href="/a-propos" className="underline">
          À propos
        </a>
        <a href="/contact" className="underline">
          Contact
        </a>
      </div>
    </footer>
  </div>
);

}
