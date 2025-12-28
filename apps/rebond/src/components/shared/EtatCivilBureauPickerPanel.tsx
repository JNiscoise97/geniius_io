import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, X, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"

export type EtatCivilBureau = {
  id: string
  nom: string
  commune: string | null
  departement: string | null
  region: string | null
}

export type EtatCivilBureauPickerPanelProps = {
  title: string
  defaultSelectedId?: string | null
  onCancel: () => void
  onValidate: (item: EtatCivilBureau) => Promise<void> | void
}

type TreeNode = {
  region: string
  departement: string
  commune: string
  bureaux: EtatCivilBureau[]
}

function norm(v?: string | null) {
  const s = (v ?? "").trim()
  return s || "—"
}

function alpha(a: string, b: string) {
  return a.localeCompare(b, "fr", { sensitivity: "base" })
}

export function formatBureauLabel(b: EtatCivilBureau | null | undefined) {
  if (!b) return ""
  const parts = [
    b.commune ? `${b.commune}` : null,
    b.departement ? `— ${b.departement}` : null,
    b.region ? `(${b.region})` : null,
  ].filter(Boolean)
  return parts.join(" ")
}

export function EtatCivilBureauPickerPanel({
  title,
  defaultSelectedId = null,
  onCancel,
  onValidate,
}: EtatCivilBureauPickerPanelProps) {
  const [all, setAll] = useState<EtatCivilBureau[]>([])
  const [loading, setLoading] = useState(false)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filter, setFilter] = useState("")
  const filterRef = useRef<HTMLInputElement | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId ?? null)

  // open states (tree)
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set())
  const [openDeps, setOpenDeps] = useState<Set<string>>(new Set())
  const [openCommunes, setOpenCommunes] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedId(defaultSelectedId ?? null)
  }, [defaultSelectedId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("etat_civil_bureaux")
        .select("id, nom, commune, departement, region")
        .order("region", { ascending: true })
        .order("departement", { ascending: true })
        .order("commune", { ascending: true })
        .order("nom", { ascending: true })

      if (cancelled) return
      setLoading(false)

      if (error) {
        toast.error("Erreur de chargement des bureaux")
        setAll([])
        return
      }
      setAll((data ?? []) as EtatCivilBureau[])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Filtre : on matche sur nom/commune/dep/region
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return all
    return all.filter((b) => {
      const hay = `${b.nom} ${b.commune ?? ""} ${b.departement ?? ""} ${b.region ?? ""}`.toLowerCase()
      return hay.includes(f)
    })
  }, [all, filter])

  // Build tree Region -> Dep -> Commune
  const tree = useMemo(() => {
    const byRegion = new Map<string, Map<string, Map<string, EtatCivilBureau[]>>>()

    for (const b of filtered) {
      const r = norm(b.region)
      const d = norm(b.departement)
      const c = norm(b.commune)

      if (!byRegion.has(r)) byRegion.set(r, new Map())
      const deps = byRegion.get(r)!

      if (!deps.has(d)) deps.set(d, new Map())
      const communes = deps.get(d)!

      if (!communes.has(c)) communes.set(c, [])
      communes.get(c)!.push(b)
    }

    // Sort everything
    const regions = Array.from(byRegion.keys()).sort(alpha)
    const nodes: TreeNode[] = []

    for (const r of regions) {
      const depsMap = byRegion.get(r)!
      const deps = Array.from(depsMap.keys()).sort(alpha)

      for (const d of deps) {
        const communesMap = depsMap.get(d)!
        const communes = Array.from(communesMap.keys()).sort(alpha)

        for (const c of communes) {
          const bureaux = (communesMap.get(c) ?? []).slice().sort((a, b) => alpha(a.nom, b.nom))
          nodes.push({ region: r, departement: d, commune: c, bureaux })
        }
      }
    }

    return nodes
  }, [filtered])

  // Auto-open the path of selected bureau (when we have data)
  useEffect(() => {
    if (!selectedId) return
    const b = all.find((x) => x.id === selectedId)
    if (!b) return
    const r = norm(b.region)
    const d = `${r}::${norm(b.departement)}`
    const c = `${d}::${norm(b.commune)}`
    setOpenRegions((prev) => new Set(prev).add(r))
    setOpenDeps((prev) => new Set(prev).add(d))
    setOpenCommunes((prev) => new Set(prev).add(c))
  }, [all, selectedId])

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return all.find((b) => b.id === selectedId) ?? null
  }, [all, selectedId])

  const handleValidate = async () => {
    if (!selectedId) {
      toast.error("Aucun bureau sélectionné")
      return
    }
    const item = all.find((b) => b.id === selectedId)
    if (!item) {
      toast.error("Bureau introuvable")
      return
    }
    await onValidate(item)
  }

  // Group tree nodes back into hierarchical render: region -> dep -> commune
  const regions = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, EtatCivilBureau[]>>>()
    for (const n of tree) {
      if (!map.has(n.region)) map.set(n.region, new Map())
      const deps = map.get(n.region)!
      if (!deps.has(n.departement)) deps.set(n.departement, new Map())
      const communes = deps.get(n.departement)!
      communes.set(n.commune, n.bureaux)
    }
    return map
  }, [tree])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 px-4 pt-4">
        <h3 className="font-semibold">{title}</h3>
      </div>

      {/* Bandeau sélection */}
      {selectedItem && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-b">
          Sélection : <span className="text-slate-900 font-medium">{formatBureauLabel(selectedItem)}</span>
          <Button
            variant="link"
            size="sm"
            className="ml-2"
            onClick={() => setSelectedId(null)}
          >
            Réinitialiser
          </Button>
        </div>
      )}

      {/* Toolbar filtre */}
      <div className="flex items-center justify-between w-full py-2 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFilterOpen(!filterOpen)
              requestAnimationFrame(() => filterRef.current?.focus())
            }}
            className={filterOpen ? "text-primary" : ""}
            title="Rechercher"
          >
            <Filter className="w-4 h-4" />
          </Button>

          {filterOpen && (
            <div className="flex items-center gap-2">
              <Input
                ref={filterRef}
                placeholder="Rechercher un bureau, commune, département, région..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-[380px] max-w-[70vw]"
              />
              {filter && (
                <Button size="icon" variant="ghost" onClick={() => setFilter("")} title="Effacer">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto border-t bg-white">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
        ) : all.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Aucun bureau</div>
        ) : (
          <div className="p-2">
            {Array.from(regions.keys()).sort(alpha).map((region) => {
              const isOpenR = openRegions.has(region)
              const depsMap = regions.get(region)!

              return (
                <div key={region} className="rounded-lg border border-slate-200 mb-2 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSet(setOpenRegions, region)}
                    className="w-full flex items-center gap-2 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    {isOpenR ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="truncate">{region}</span>
                  </button>

                  {isOpenR && (
                    <div className="p-2">
                      {Array.from(depsMap.keys()).sort(alpha).map((dep) => {
                        const depKey = `${region}::${dep}`
                        const isOpenD = openDeps.has(depKey)
                        const communesMap = depsMap.get(dep)!

                        return (
                          <div key={depKey} className="rounded-md border border-slate-200 mb-2 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleSet(setOpenDeps, depKey)}
                              className="w-full flex items-center gap-2 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                            >
                              {isOpenD ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span className="truncate">{dep}</span>
                            </button>

                            {isOpenD && (
                              <div className="p-2">
                                {Array.from(communesMap.keys()).sort(alpha).map((commune) => {
                                  const communeKey = `${depKey}::${commune}`
                                  const isOpenC = openCommunes.has(communeKey)
                                  const bureaux = communesMap.get(commune) ?? []

                                  return (
                                    <div key={communeKey} className="rounded-md border border-slate-200 mb-2 overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => toggleSet(setOpenCommunes, communeKey)}
                                        className="w-full flex items-center gap-2 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
                                      >
                                        {isOpenC ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        <span className="truncate">{commune}</span>
                                        <span className="ml-auto text-xs text-slate-600">{bureaux.length}</span>
                                      </button>

                                      {isOpenC && (
                                        <div className="p-2">
                                          <ul role="listbox" className="space-y-1">
                                            {bureaux.map((b) => {
                                              const checked = selectedId === b.id
                                              return (
                                                <li
                                                  key={b.id}
                                                  role="option"
                                                  aria-selected={checked}
                                                  className={[
                                                    "flex items-center justify-between gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-slate-50",
                                                    checked ? "bg-slate-50 border-slate-300" : "border-slate-200",
                                                  ].join(" ")}
                                                  onClick={() => setSelectedId(b.id)}
                                                >
                                                  <div className="flex items-center gap-2 min-w-0">
                                                    <input
                                                      type="radio"
                                                      checked={checked}
                                                      onChange={() => setSelectedId(b.id)}
                                                      className="h-4 w-4"
                                                    />
                                                    <div className="min-w-0">
                                                      <div className="text-sm font-medium text-slate-900 truncate">{b.nom}</div>
                                                      <div className="text-xs text-slate-600 truncate">
                                                        {formatBureauLabel(b)}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </li>
                                              )
                                            })}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer sticky */}
      <div
        className="
          sticky bottom-0 left-0 right-0 border-t
          bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
          px-4 py-3
          pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        "
      >
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleValidate}>
            Valider
          </Button>
        </div>
      </div>
    </div>
  )
}
