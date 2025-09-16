import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Clock, FileText, MapPin, Star } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Derniers actes consultés */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Derniers actes consultés</h2>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Acte de vente - 1834</li>
              <li>Testament - Famille DUBOIS</li>
              <li>Contrat de mariage - 1841</li>
            </ul>
            <Button variant="outline" className="w-full mt-2">Voir tout</Button>
          </CardContent>
        </Card>

        {/* Actes à traiter */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">À traiter</h2>
              <FileText className="w-5 h-5 text-gray-500" />
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>3 à transcrire</li>
              <li>2 à annoter</li>
              <li>1 à relier</li>
            </ul>
            <Button variant="outline" className="w-full mt-2">Accéder à la file</Button>
          </CardContent>
        </Card>

        {/* Familles ou lieux suivis */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Suivi</h2>
              <MapPin className="w-5 h-5 text-gray-500" />
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Famille LEBON (6 actes)</li>
              <li>Habitation Dolé (4 actes)</li>
              <li>Famille MANETTE (3 actes)</li>
            </ul>
            <Button variant="outline" className="w-full mt-2">Voir les suivis</Button>
          </CardContent>
        </Card>

        {/* Notifications de rebond */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Bell className="w-5 h-5 text-gray-500" />
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🟡 Rebond identifié sur acte #27</li>
              <li>🟢 Nouvelle transcription : acte #44</li>
            </ul>
            <Button variant="outline" className="w-full mt-2">Tout voir</Button>
          </CardContent>
        </Card>

        {/* Recherches favorites ou partagées */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recherches favorites</h2>
              <Star className="w-5 h-5 text-gray-500" />
            </div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>Ventes famille A (1830-1850)</li>
              <li>Testaments Pointe-Noire</li>
              <li>Mariages avant 1848</li>
            </ul>
            <Button variant="outline" className="w-full mt-2">Gérer les favoris</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
