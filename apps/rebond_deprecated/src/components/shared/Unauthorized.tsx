// pages/Unauthorized.tsx
import { Link } from "react-router-dom"

export default function Unauthorized() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Accès refusé</h1>
      <p className="mb-4 text-gray-700">
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
      </p>
      <Link to="/" className="text-indigo-600 underline">
        Retour à l'accueil
      </Link>
    </div>
  )
}
