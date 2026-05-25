import { useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export interface AppNavItem {
  label: string
  to: string
  render?: () => ReactNode
  hideInDropdown?: boolean
}

export interface AppLayoutProps {
  children: ReactNode
  appName: string
  appTitle: string
  footerName: string
  icon: ElementType
  navItems: AppNavItem[]
  homePath?: string
  rightActions?: ReactNode
  accentColor?: string
  accentBgColor?: string
  accentSoftColor?: string
}

export default function AppLayout({
  children,
  appName,
  appTitle,
  footerName,
  icon: Icon,
  navItems,
  homePath = '/',
  rightActions,
  accentColor = '#4f46e5',
  accentBgColor = '#e0e7ff',
  accentSoftColor = '#eef2ff',
}: AppLayoutProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === homePath

  const cssVars = {
    '--g-layout-accent': accentColor,
    '--g-layout-accent-bg': accentBgColor,
    '--g-layout-accent-soft': accentSoftColor,
  } as CSSProperties

  const dropdownItems = navItems.filter((item) => !item.hideInDropdown)

  return (
    <div className="g-layout" data-app={appName} style={cssVars}>
      <header className="g-layout-header">
        <div className="g-layout-header-inner">
          <Link to={homePath} className="g-layout-brand" onClick={() => setOpen(false)}>
            <span className="g-layout-brand-icon">
              <Icon size={20} />
            </span>
            <span>{appTitle}</span>
          </Link>

          {isHome && (
            <nav className="g-layout-nav" aria-label="Navigation principale">
              {navItems.map((item) =>
                item.render ? (
                  <div key={item.label} className="g-layout-nav-action">
                    {item.render()}
                  </div>
                ) : (
                  <Link key={item.to} to={item.to} className="g-layout-nav-link">
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          )}

          <div className="g-layout-actions">
            {!isHome && rightActions}

            <button
              type="button"
              className={isHome ? 'g-layout-menu-button g-layout-menu-button-home' : 'g-layout-menu-button'}
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="g-layout-dropdown" aria-label="Menu déroulant">
            <div className="g-layout-dropdown-inner">
              {dropdownItems.map((item) =>
                item.render ? (
                  <div
                    key={item.label}
                    className="g-layout-dropdown-action"
                    onClick={() => setOpen(false)}
                  >
                    {item.render()}
                  </div>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="g-layout-dropdown-link"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="g-layout-main">{children}</main>

      <footer className="g-layout-footer">
        <p>&copy; {new Date().getFullYear()} {footerName}. Tous droits réservés.</p>

        <div className="g-layout-footer-links">
          <Link to="/mentions-legales">Mentions légales</Link>
          <Link to="/a-propos">À propos</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  )
}