// AnalysePanelLeft.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useEntityStore } from "@/store/useEntityStore"
import { useHighlightStore } from "@/store/useHighlightStore"
import { Plus, Highlighter } from "lucide-react"
import { useEffect, useState } from "react"
import type { Entity } from "@/types/analyse"

export function AnalyseLeftPanel({
  onAdd,
  onSelect,
}: {
  onAdd: (categorie_id: string) => void
  onSelect: (entity: Entity) => void
}) {
  const [openSections, setOpenSections] = useState<string[]>([])
  const {
    fetchCategories,
    entities,
    categories,
    groupedCategories
  } = useEntityStore()
  const {
    global,
    categories: catMap,
    subcategories: subMap,
    entities: entMap,
    setGlobal,
    setCategoryWithChildren,
    setSubcategoryWithChildren,
    setEntity
  } = useHighlightStore()

  useEffect(() => {
    fetchCategories()
  }, [])

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const entitiesByCatAndSubcat = entities.reduce<Record<string, Record<string, Entity[]>>>(
    (acc, entity) => {
      const catMeta = categories.find((c) => c.id === entity.categorie_id)
      if (!catMeta) return acc

      const { categorie, sous_categorie } = catMeta
      if (!acc[categorie]) acc[categorie] = {}
      if (!acc[categorie][sous_categorie]) acc[categorie][sous_categorie] = []

      acc[categorie][sous_categorie].push(entity)
      return acc
    },
    {}
  )

  return (
    <aside className="h-full flex flex-col bg-gray-100 border-r">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <h2 className="text-lg font-semibold">Rebonds de l'acte</h2>
        <p className="text-sm text-muted-foreground">
          Partez des entités citées — personnes, lieux, biens — pour explorer l’acte autrement.
        </p>
        <div className="flex items-center justify-between px-3 py-2 border rounded-md bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Highlighter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-gray-800">Afficher les surlignages</span>
          </div>
          <Switch checked={global} onCheckedChange={setGlobal} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {Object.entries(groupedCategories).map(([categorie, subcats]) => {
            const sortedSubcats = subcats
              .slice()
              .sort((a, b) => {
                const orderA = categories.find(c => c.categorie === categorie && c.sous_categorie === a)?.ordre ?? 0
                const orderB = categories.find(c => c.categorie === categorie && c.sous_categorie === b)?.ordre ?? 0
                return orderA - orderB
              })

            const totalCount = subcats.reduce(
              (acc, sub) => acc + (entitiesByCatAndSubcat[categorie]?.[sub]?.length || 0),
              0
            )
            const isOpen = openSections.includes(categorie)
            const categoryEnabled = catMap[categorie] ?? true

            return (
              <AccordionItem key={categorie} value={categorie}>
                <div className="flex justify-between items-center pb-2 mb-2">
                  <AccordionTrigger
                    className="text-base font-semibold text-gray-700 hover:text-primary transition-colors flex-1"
                    onClick={() => toggleSection(categorie)}
                  >
                    {categorie}
                  </AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={categoryEnabled}
                      onCheckedChange={(val) =>
                        setCategoryWithChildren(
                          categorie,
                          val,
                          subcats,
                          entities,
                          categories
                        )
                      }
                    />
                    {!isOpen && (
                      <span className="text-xs bg-gray-800 text-white rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                        {totalCount}
                      </span>
                    )}
                  </div>
                </div>

                <AccordionContent className="mt-2 space-y-4">
                  {sortedSubcats.map((sub) => {
                    const catMeta = categories.find(
                      (c) => c.categorie === categorie && c.sous_categorie === sub
                    )
                    const catId = catMeta?.id ?? ""
                    const subEntities = (entitiesByCatAndSubcat[categorie]?.[sub] || []).slice().sort((a, b) =>
                      a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
                    )
                    const subcatEnabled = subMap[sub] ?? true

                    return (
                      <div key={sub} className="space-y-1 rounded-md bg-gray-900 text-white p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold tracking-tight">{sub}</span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={subcatEnabled}
                              onCheckedChange={(val) =>
                                setSubcategoryWithChildren(sub, val, subEntities, categories)
                              }
                              className="bg-white data-[state=checked]:bg-primary"
                            />
                            <span className="text-xs bg-white text-gray-800 rounded-full px-2 py-0.5">
                              {subEntities.length}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-white"
                              title={`Ajouter ${sub}`}
                              onClick={() => onAdd(catId)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {subEntities.length > 0 ? (
                            subEntities.map((entity) => (
                              <EntityRow
                                key={entity.id}
                                label={entity.label}
                                highlight={entMap[entity.id!] ?? true}
                                mentions={entity.mentions?.length || 0}
                                onToggle={() => setEntity(entity.id!, !(entMap[entity.id!] ?? true))}
                                onClick={() => onSelect(entity)}
                              />
                            ))
                          ) : (
                            <div className="text-xs italic text-gray-300">
                              Aucune entité enregistrée.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </aside>
  )
}

function EntityRow({
  label,
  highlight,
  mentions,
  onToggle,
  onClick,
}: {
  label: string
  highlight: boolean
  mentions: number
  onToggle: () => void
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-3 py-1.5 bg-white border rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
    >
      <div className="flex flex-col flex-1">
        <span className="text-sm text-gray-800 truncate">{label}</span>
        <span className="text-xs text-muted-foreground">{mentions} mention{mentions !== 1 && "s"}</span>
      </div>
      <div className="flex items-center gap-1">
        <Highlighter className="w-4 h-4 text-muted-foreground" />
        <Switch checked={highlight} onCheckedChange={onToggle} />
      </div>
    </div>
  )
}
