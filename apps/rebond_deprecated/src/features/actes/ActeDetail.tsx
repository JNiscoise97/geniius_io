import { useParams, Link } from "react-router-dom"
import { useActeStore } from "@/store/actes"
import { useFavorisStore } from "@/store/favoris"
import { Button } from "@/components/ui/button"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import { formatDateToNumericFrench, formatDateToFrench } from "@/utils/date"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { useEffect } from "react"


export default function ActeDetail() {
  const { id } = useParams()
  const acte = useActeStore((state) => state.actes.find((a) => a.id === id))
  const fetchActeById = useActeStore((state) => state.fetchActeById)
  const ajouter = useFavorisStore((s) => s.ajouterActeFavori)
  const retirer = useFavorisStore((s) => s.retirerActeFavori)
  const fetchFavoris = useFavorisStore((s) => s.fetchActeFavoris)
  const isFavori = useFavorisStore((s) => s.acteFavorisIds.includes(id!))

  useEffect(() => {
    if (id && !acte) {
      fetchActeById(id)
    }
  }, [id, acte, fetchActeById])
  
  useEffect(() => {
    fetchFavoris()
  }, [])


  if (!acte) {
    return (
      <div className="p-6">
        <BackToHomeButton />
        <h1 className="text-2xl font-bold">Acte introuvable</h1>
        <Link to="ac-actes">
          <Button className="mt-4">Retour à la liste</Button>
        </Link>
      </div>
    )
  }

  const ajouterFavori = async () => {
    await ajouter(id!)
    toast.success(`Acte #${id} ajouté aux favoris`)
  }
  
  const retirerFavori = async () => {
    await retirer(id!)
    toast(`Acte #${id} retiré des favoris`, {
      icon: "⭐",
      duration: 4000
    })
  }
  

  return (
    <div className="space-y-6 p-6">
      <BackToHomeButton />
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold">Fiche de l’acte #{acte.id}</h1>
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


      <Section title="📅 Informations générales">
      {acte.seances && acte.seances.length > 0 ? (
        acte.seances.length === 1 ? (
            <>
            <p>Date : {acte.seances[0].date?.exact ? formatDateToFrench(acte.seances[0].date.exact) : "Date inconnue"}</p>
            <p>Lieu : {acte.seances[0].lieu?.nom ?? "–"}</p>
            </>
        ) : (
            <>
            <p className="mb-1">Dates :</p>
            <ul className="list-disc list-inside space-y-1">
                {acte.seances.map((s, i) => (
                <li key={i}>
                    {s.date?.exact ? formatDateToFrench(s.date.exact) : "Date inconnue"} – {s.lieu?.nom ?? "Lieu inconnu"}
                </li>
                ))}
            </ul>
            </>
        )
        ) : (
        <p>—</p>
        )}



        <p className="mt-2">
            Notaire : {
            (() => {
                const principal = acte.notaires?.find(n => n.role === "principal")
                return principal
                ? `${principal.notaire?.titre ?? ""} ${principal.notaire?.nom ?? ""} ${principal.notaire?.prenom}`.trim()
                : "—"
            })()
            }
        </p>
        </Section>


      {/* 📂 Type d’opération foncière */}
      <Section title="📂 Objet de l’acte">
        <p>{acte.label || "—"}</p>
      </Section>

      {/* 🔗 Navigation vers vues spécialisées */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/ac-actes/${id}/transcription`}><Button>Voir transcription</Button></Link>
        <Link to={`/ac-actes/${id}/analyse`}><Button>Voir analyse</Button></Link>
        <Link to={`/ac-actes/${id}/liens`}><Button>Voir actes liés</Button></Link>
        <Link to={`/ac-actes/${id}/annotations`}><Button>Voir annotations</Button></Link>
        <Link to={`/ac-actes/${id}/fichier`}><Button>Voir le fichier source</Button></Link>
      </div>
      
      <Section title="🧾 Origine de l’acte">
        <p>Type : {acte.origineActe?.type ?? "—"}</p>
        <p>Statut : {acte.origineActe?.statut ?? "—"}</p>
        <p>Forme : {acte.origineActe?.forme ?? "—"}</p>
        <p>Date : {acte.origineActe?.date?.exact ? formatDateToNumericFrench(acte.origineActe.date.exact) : "—"}</p>
        <p>Lieu : {acte.origineActe?.lieu?.nom ?? "—"}</p>
        <p>Description : {acte.origineActe?.description ?? "—"}</p>
      </Section>

      {/* 👤 Parties à l’acte */}
      <Section title="👤 Parties à l’acte">
        {acte.parties?.map((p, i) => (
          <p key={i}>
            {p.rôle ?? "Partie"} : {p.nom}
          </p>
        )) || <p>—</p>}
      </Section>

      {/* 📐 Désignation de la propriété cédée */}
      <Section title="📐 Désignation des biens">
        {acte.biensMeubles?.length ? (
          <ul className="list-disc list-inside">
            {acte.biensMeubles.map((b, i) => (
              <li key={i}>
                {b.type} – {b.description} {b.valeurEstimee && `(${b.valeurEstimee})`}
              </li>
            ))}
          </ul>
        ) : <p>—</p>}
      </Section>

      {/* 📚 Origine de propriété */}
      <Section title="📚 Origine de propriété">
        <p>{acte.originePropriete || "—"}</p>
      </Section>

      {/* 💰 Valeur estimée */}
      <Section title="💰 Valeur estimée">
        {acte.biensMeubles?.some(b => b.valeurEstimee) ? (
          <ul className="list-disc list-inside">
            {acte.biensMeubles.map((b, i) => (
              <li key={i}>
                {b.description} : {b.valeurEstimee}
              </li>
            ))}
          </ul>
        ) : <p>—</p>}
      </Section>

      {/* 📜 Enregistrement & transcription */}
      <Section title="📜 Enregistrement & transcription">
        {acte.enregistrement?.date?.exact && (
          <p>Enregistré le : {acte.enregistrement.date.exact} à {acte.enregistrement.lieu?.nom}</p>
        )}
        {acte.transcriptionHypothecaire?.date?.exact && (
          <p>Transcrit au bureau des hypothèques : {acte.transcriptionHypothecaire.date.exact}</p>
        )}
      </Section>

      {/* 📝 Clauses ou particularités */}
      <Section title="📝 Clauses ou particularités">
        <p>{acte.clauses || "—"}</p>
      </Section>

      {/* 🧑‍🤝‍🧑 Personnes citées */}
      <Section title="🧑‍🤝‍🧑 Individus cités">
        {acte.mentionsIndividusAnnexes?.length ? (
          <ul className="list-disc list-inside">
            {acte.mentionsIndividusAnnexes.map((m, i) => (
              <li key={i}>{m.nom} – {m.rôle}</li>
            ))}
          </ul>
        ) : <p>—</p>}
      </Section>

      {/* 🗺️ Lieux mentionnés */}
      <Section title="🗺️ Lieux mentionnés">
        {acte.mentionsLieuxAnnexes?.map((l, i) => (
          <p key={i}>{l.nom} ({l.type})</p>
        )) || <p>—</p>}
      </Section>

      {/* 🏷️ Tags */}
      <Section title="🏷️ Tags">
        <p>{acte.tags?.join(", ") || "—"}</p>
      </Section>

      {/* 🧠 Suggestions de rebonds */}
      <Section title="🧠 Suggestions de rebonds">
        <p>[À venir : analyse automatique des mentions d’actes liés]</p>
      </Section>

      {/* 📊 Historique de traitement */}
      <Section title="📊 Historique de traitement">
        <ul>
          <li>Transcription : {acte.statut?.transcription}</li>
          <li>Liens : {acte.statut?.liens}</li>
          <li>Annotations : {acte.statut?.annotations}</li>
          <li>Vérifié : {acte.statut?.vérification ? "✅" : "❌"}</li>
        </ul>
      </Section>
    </div>
  )
}

// Petit composant réutilisable
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="border p-4 rounded shadow-sm">
      <h2 className="font-semibold text-lg mb-1">{title}</h2>
      {children}
    </section>
  )
}
