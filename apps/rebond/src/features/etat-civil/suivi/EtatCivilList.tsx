// EtatCivilList.tsx
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import type { EtatCivilBureau } from "@/types/etatcivil"
import { DataTable, type ColumnDef } from "@/components/shared/DataTable"
import { useEtatCivilStore } from "@/store/etatcivil"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BureauCreateModal } from "./BureauCreateModal"

export default function EtatCivilList() {
  const bureaux = useEtatCivilStore((s) => s.bureaux)
  const fetchBureaux = useEtatCivilStore((s) => s.fetchBureaux)
  const [filter, setFilter] = useState("")

  const handleAddBureau = () => {
    setCreateBureauModalOpen(true);
  };
  const [createBureauModalOpen, setCreateBureauModalOpen] = useState(false);

  useEffect(() => {
    fetchBureaux()
  }, [])

  const columns = useMemo<ColumnDef<EtatCivilBureau>[]>(() => [
    {
      key: "nom",
      label: "Bureau d'état civil",
      render: (row) => (
        <Link to={`/ec-bureau/${row.id}`} className='font-medium hover:text-indigo-600'>
          {row.nom}
        </Link>
      ),
    },
    {
      key: "commune",
      label: "Commune",
    },
    {
      key: "departement",
      label: "Département",
    },
    {
      key: "actes_a_transcrire",
      label: "Nombre d'actes à transcrire",
    },
    {
      key: "actes_transcrits",
      label: "Nombre d'actes transcrits",
    },
    {
      key: "actes_releves",
      label: "Nombre d'actes relevés",
    },
    {
      key: "actes_estimes",
      label: "Nombre d'actes estimés",
    },
  ], [])

  return (
    <div className="p-6 space-y-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-bold">Relevé d’état civil</h1>
      <div className='flex items-center justify-end gap-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleAddBureau}
          className='text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1'
        >
          <Plus className='w-4 h-4' />
          Ajouter un bureau d'état-civil
        </Button>
      </div>
      <DataTable
        title="Bureaux d'état civil"
        data={bureaux}
        columns={columns}
        pageSize={15}
        search={filter}
        onSearchChange={setFilter}
        defaultSort={["nom"]}
      />

      <BureauCreateModal
        open={createBureauModalOpen}
        onClose={() => setCreateBureauModalOpen(false)}
        bureauxExistants={bureaux}
      />
    </div>
  )
}
