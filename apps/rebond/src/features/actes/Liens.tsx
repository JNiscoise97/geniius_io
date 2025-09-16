import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"

export default function Liens() {
  const { id } = useParams()

  return (
    <div className="space-y-4">
        <BackToHomeButton />
        <div className="space-y-4">
            <h1 className="text-xl font-bold">Actes liés à l’acte #{id}</h1>
            <Link to={`/ac-actes/${id}`}><Button>Retour à l’acte</Button></Link>
        </div>
    </div>
  )
}
