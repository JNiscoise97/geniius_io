import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { useActeStore } from "@/store/actes"
import { supabase } from "@/lib/supabase"
import { formatDateToNumericFrench } from "@/utils/date"
import { Button } from "@/components/ui/button"
import { BackToHomeButton } from "@/components/shared/BackToRebondHomeButton"
import { DataTable } from "@/components/shared/DataTable"
import type { ColumnDef } from "@/components/shared/DataTable"
import type { ActeBase } from "@/types/acte"
import { Plus } from "lucide-react"
import { ProgressVerboseBar } from "@/components/shared/ProgressVerboseBar"
import { formatNombre } from "@/utils/number"

export default function ActeList() {
  const actes = useActeStore((state) => state.actes)
  const fetchActes = useActeStore((state) => state.fetchActes)
  const loading = useActeStore((state) => state.loading)
  const [totalAttendus, setTotalAttendus] = useState<number | null>(null)
  const [totalReleves, setTotalReleves] = useState<number | null>(null)

  useEffect(() => {
    fetchActes()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      const { data: attenduData, error: error1 } = await supabase
        .from("notaire_registres")
        .select("nombre_actes")

      const { count: totalRelevesCount, error: error2 } = await supabase
        .from("actes")
        .select("*", { count: "exact", head: true })

      if (!error1 && attenduData) {
        const sommeAttendus = attenduData.reduce((acc, cur) => acc + (cur.nombre_actes ?? 0), 0)
        setTotalAttendus(sommeAttendus)
      }

      if (!error2) {
        setTotalReleves(totalRelevesCount ?? null)
      }
    }

    fetchStats()
  }, [])

  const columns: ColumnDef<ActeBase>[] = useMemo(() => [
    {
      key: "notaire",
      label: "Notaire",
      render: (row) => {
        const principal = row.notaires?.find((n) => n.role === "principal")
        if (!principal || !principal.notaire) return "—"
        const { titre = "", nom = "", prenom = "" } = principal.notaire
        return `${titre} ${nom} ${prenom}`.trim()
      },
      columnWidth: '17%'
    },
    {
      key: "nom",
      label: "Nom"
    },
    {
      key: "prenom",
      label: "Prénom"
    },
    {
      key: "date",
      label: "Date",
      render: (row) => {
        const date = row.seances?.[0]?.date?.exact ?? null
        return date ? formatDateToNumericFrench(date) : "—"
      },
      columnWidth: '8%'
    },
    {
      key: "label",
      label: "Résumé",
      render: (row) => (
        <div title={row.label ?? ""}>
          {row.label ?? ""}
        </div>
      ),
      columnWidth: '65%'
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <Link to={`/ac-actes/${row.id}`}>
          <Button variant="outline" size="sm">Voir</Button>
        </Link>
      ),
      columnWidth: '10%'
    },
  ], [])

  const defaultVisibleColumns = [
    'notaire',
    'date',
    'label',
    'actions',
  ];
  const actesTries = [...actes].sort((a, b) => {
    const notaireA = a.notaires?.find(n => n.role === "principal")?.notaire?.nom?.toLowerCase() ?? "";
    const notaireB = b.notaires?.find(n => n.role === "principal")?.notaire?.nom?.toLowerCase() ?? "";

    if (notaireA < notaireB) return -1;
    if (notaireA > notaireB) return 1;

    const dateA = a.seances?.[0]?.date?.exact ?? "";
    const dateB = b.seances?.[0]?.date?.exact ?? "";

    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;

    return 0;
  });


  return (
    <div className="p-6 space-y-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-semibold">Relevé des actes notariés</h1>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Chargement des actes...</div>
      ) : (
        <>
        <div className='flex items-center justify-end gap-4'>
          {totalReleves !== null && totalAttendus !== null && (
          <div className="w-75">
            <ProgressVerboseBar
                    value={totalReleves}
                    max={totalAttendus}
                    label={`Relevés / Attendus : ${formatNombre(totalReleves) ?? 0} / ${formatNombre(totalAttendus)}`} />
                    </div>
        )}
        <Link to="ac-actes/nouveau/minimal">
          <Button
            variant='ghost'
            size='sm'
            className='text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1'
          >
            <Plus className='w-4 h-4' />
            Saisir un acte minimal
          </Button>
        </Link>
        </div>
        <DataTable
            data={actesTries}
            columns={columns}
            title=""
            pageSize={8}
            defaultVisibleColumns={defaultVisibleColumns}
            defaultSort={["date"]} /></>
      )}
    </div>
  )
}
