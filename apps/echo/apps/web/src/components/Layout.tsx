// apps\web\src\components\Layout.tsx

import { Button } from "@echo/ui/components/button";
import { useState, type ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const showFooter = false;

  const navItems = [{ label: "Profil", to: "/profil" }];

  return (
    // plein écran, on gère le scroll à l’intérieur
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <Link to="/"><h1 className="text-lg font-bold text-indigo-600">Geniius.io | Echo</h1></Link>

        {!isHome && (
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
              ☰
            </Button>
          </div>
        )}

        {isHome && (
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-gray-700 hover:text-indigo-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Navigation latérale (mobile ou autres pages) */}
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

      {/* Corps : seul le centre scrolle, le footer ne chevauche pas */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>

        {showFooter && <footer className="border-t pt-6 pb-6 text-sm text-center text-muted-foreground shrink-0">
          <p>&copy; {new Date().getFullYear()} Rebond. Tous droits réservés.</p>
          <div className="mt-2 space-x-4">
            <a href="/mentions-legales" className="underline">Mentions légales</a>
            <a href="/a-propos" className="underline">À propos</a>
            <a href="/contact" className="underline">Contact</a>
          </div>
        </footer>}
      </main>
    </div>
  );
}
