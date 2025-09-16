import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export function BackToHomeButton() {
  return (
    <div className="mb-4">
      <Link to="/">
        <Button variant="ghost" className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
          <Home className="w-4 h-4" />
          Retour à l’accueil
        </Button>
      </Link>
    </div>
  )
}
