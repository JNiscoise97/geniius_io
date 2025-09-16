import { Link } from "react-router-dom"

interface BreadcrumbItem {
  label: string
  to?: string // facultatif pour l'élément actif
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-4 text-sm text-muted-foreground flex items-center flex-wrap">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={index} className="flex items-center space-x-1">
            {index > 0 && <span> / </span>}
            {isLast || !item.to ? (
              <span>{item.label}</span>
            ) : (
              <Link to={item.to} className="text-blue-600 hover:underline">
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
