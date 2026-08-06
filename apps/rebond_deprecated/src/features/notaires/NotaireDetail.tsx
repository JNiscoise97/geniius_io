// NotaireDetail.tsx
 
import { useParams } from "react-router-dom"
import { useNotaireStore } from "@/store/notaires"
import { useFavorisStore } from "@/store/favoris"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { NotaireStats } from "./NotaireStats"
import { NotaireAnnees } from "./NotaireAnnees"
import { NotaireActesParAnnee } from "./NotaireActesParAnnee"
import { Breadcrumb } from "@/components/shared/Breadcrumb"
import { Star } from "lucide-react"
import { toast } from "sonner"

export default function NotaireDetail() {
  const { id } = useParams()
  const fetch = useNotaireStore((s) => s.fetchOne)
  const notaire = useNotaireStore((s) => s.selected)
  const [tab, setTab] = useState("stats")

  const fetchFavoris = useFavorisStore((s) => s.fetchNotaireFavoris)
  const ajouter = useFavorisStore((s) => s.ajouterNotaireFavori)
  const retirer = useFavorisStore((s) => s.retirerNotaireFavori)
  const isFavori = useFavorisStore((s) => s.notaireFavorisIds.includes(id!))

  useEffect(() => {
    fetchFavoris()
  }, [])

  useEffect(() => {
    if (id) fetch(id)
  }, [id])

  if (!notaire) return <div>Chargement...</div>

  const ajouterFavori = async () => {
    await ajouter(id!)
    toast.success(`Notaire ${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""} ajouté aux favoris`)
  }
  
  const retirerFavori = async () => {
    await retirer(id!)
    toast(`Notaire ${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""} retiré des favoris`, {
      icon: "⭐",
      duration: 4000
    })
  }

  return (
    <div className="p-6 space-y-4">
      <Breadcrumb
        items={[
          { label: "Accueil", to: "/" },
          { label: "Notaires", to: "/notaires/liste" },
          { label: `${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""}`.trim() }
        ]}
      />

      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold">
          Fiche de {notaire.titre ?? ""} {notaire.nom} {notaire.prenom ?? ""}
        </h1>

        {isFavori ? (
          <button
            onClick={retirerFavori}
            title="Retirer des favoris"
            className="text-yellow-500 hover:text-yellow-600 transition-all duration-200 transform hover:scale-110"
          >
            <Star className="w-6 h-6 fill-yellow-500 transition-colors duration-200" />
          </button>
        ) : (
          <button
            onClick={ajouterFavori}
            title="Marquer comme favori"
            className="text-gray-400 hover:text-yellow-500 transition-all duration-200 transform hover:scale-110"
          >
            <Star className="w-6 h-6 transition-colors duration-200" />
          </button>
        )}
      </div>

      <Section title="Informations générales">
        <p><strong>Nom :</strong> {notaire.nom}</p>
        <p><strong>Prénom :</strong> {notaire.prenom || "—"}</p>
        <p><strong>Titre :</strong> {notaire.titre || "—"}</p>
        <p><strong>Étude :</strong> {notaire.etude || "—"}</p>
        <p><strong>Lieu d’exercice :</strong> {notaire.lieu_exercice || "—"}</p>
      </Section>

      {notaire.notes && (
        <Section title="Notes complémentaires">
          <p>{notaire.notes}</p>
        </Section>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="stats">📊 Tableau de bord</TabsTrigger>
          <TabsTrigger value="annees">📅 Années d’exercice</TabsTrigger>
          <TabsTrigger value="actes">🗂️ Actes par année</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <NotaireStats notaireId={id!} />
        </TabsContent>
        <TabsContent value="annees">
          <NotaireAnnees notaireId={id!} />
        </TabsContent>
        <TabsContent value="actes">
          <NotaireActesParAnnee notaireId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="border p-4 rounded shadow-sm">
      <h2 className="font-semibold text-lg mb-1">{title}</h2>
      {children}
    </section>
  )
}
