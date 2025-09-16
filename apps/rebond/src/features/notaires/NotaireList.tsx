// NotaireList.tsx

import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import type { Notaire } from "@/types/acte"
import { useNotaireStore } from "@/store/notaires"
import { DataTable, type ColumnDef } from "@/components/shared/DataTable"
import { Plus } from "lucide-react"

export default function NotaireList() {
  const notaires = useNotaireStore((s) => s.notaires)
  const fetchNotaires = useNotaireStore((s) => s.fetchNotaires)
  const loading = useNotaireStore((s) => s.loading)

  useEffect(() => {
    fetchNotaires()
  }, [])

  const columns: ColumnDef<Notaire>[] = [
    {
      key: "nom_complet",
      label: "Nom complet",
      render: (n) => `${n.titre ?? ""} ${n.nom} ${n.prenom ?? ""}`.trim(),
    },
    {
      key: "etude",
      label: "Étude",
      render: (n) => n.etude || "—",
    },
    {
      key: "lieu_exercice",
      label: "Lieu d’exercice",
      render: (n) => n.lieu_exercice || "—",
    },
    {
      key: "actions",
      label: "Actions",
      render: (n) => (
        <><Link to={`/notaires/${n.id}`}>
          <Button variant="outline" size="sm">
            Voir #1
          </Button>
        </Link><Link to={`/notaires-2/${n.id}`}>
            <Button variant="outline" size="sm">
              Voir #2
            </Button>
          </Link></>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-4">

      <BackToHomeButton />
      <div>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Chargement des notaires...</div>
        ) : (
          <><div className='flex items-center justify-end gap-4'>
            <Link to="/notaires/nouveau">
              <Button
                variant='ghost'
                size='sm'
                className='text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1'
              >
                <Plus className='w-4 h-4' />
                Ajouter un notaire
              </Button>
            </Link>
          </div><DataTable
              title="Liste des notaires"
              data={notaires}
              columns={columns}
              pageSize={10}
              defaultSort={["nom"]} /></>
        )}
      </div>
    </div>
  )
}
