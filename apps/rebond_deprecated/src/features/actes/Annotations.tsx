import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"

export default function Annotations() {
  const { id } = useParams()

  return (
    <div className="space-y-4">
        <BackToHomeButton />
        <div className="space-y-4">
            <h1 className="text-xl font-bold">Annotations personnelles – Acte #{id}</h1>
            <Link to={`/ac-actes/${id}`}><Button>Retour à l’acte</Button></Link>
        </div>
    </div>
  )
}
