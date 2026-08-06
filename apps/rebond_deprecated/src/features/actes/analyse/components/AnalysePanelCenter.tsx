// AnalysePanelCenter.tsx

import { useEffect, useRef, useState } from "react"
import {
  Info,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useDocumentStore } from "@/store/useDocumentStore"
import clsx from "clsx"
import { useSelectionStore } from "@/store/useSelectionStore"
import { BlocEnSegments } from "./blocPanel/BlocEnSegments"
import type { Entity } from "@/types/analyse"
import { useHighlightStore } from "@/store/useHighlightStore"
import { useEntityStore } from "@/store/useEntityStore"
import { Button } from "@/components/ui/button"

function handleTextSelection() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range = sel.getRangeAt(0)
  const text = sel.toString().trim()
  if (!text) return

  const container = range.startContainer
  const blocEl = container.nodeType === 3
    ? container.parentElement?.closest("[data-bloc-id]")
    : (container as HTMLElement).closest("[data-bloc-id]")

  const blocId = blocEl?.getAttribute("data-bloc-id")
  if (!blocId) return

  const fullText = (blocEl && blocEl.textContent) || ""
  const start = fullText.indexOf(text)
  const end = start + text.length

  if (start < 0) return

  useSelectionStore.getState().setSelection({
    blocId,
    text,
    start,
    end,
  })
}

export function AnalyseCenterPanel({
  acteId,
  onSelectEntity,
}: {
  acteId: string
  onSelectEntity: (entity: Entity) => void
}) {
  const [showInfo, setShowInfo] = useState(false)
  const [search, setSearch] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const matchRefs = useRef<HTMLElement[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0)
  const [renderedMatchesCount, setRenderedMatchesCount] = useState(0)
  const recentHuesRef = useRef<number[]>([])

  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments)
  const documents = useDocumentStore((s) => s.documents)
  const loading = useDocumentStore((s) => s.loading)
  const error = useDocumentStore((s) => s.error)

  const highlightState = useHighlightStore((s) => ({
    global: s.global,
    categories: s.categories,
    subcategories: s.subcategories,
    entities: s.entities,
  }))

  const entities = useEntityStore((s) => s.entities)
  const categories = useEntityStore((s) => s.categories)

  useEffect(() => {
    fetchDocuments(acteId)
  }, [acteId, fetchDocuments])

  useEffect(() => {
    if (showSearch) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [showSearch])

  useEffect(() => {
    matchRefs.current = []
    setCurrentMatchIndex(0)
    setRenderedMatchesCount(0)
  }, [search])

  const document = documents.find((d) => d.acte_id === acteId)

  if (loading) return <p>Chargement en cours...</p>
  if (error) return <p>Erreur : {error}</p>
  if (!document) return <p>Aucun document trouvé</p>

  function registerMatchRef(el: HTMLElement) {
    if (el && !matchRefs.current.includes(el)) {
      matchRefs.current.push(el)

      // scroll automatique sur le premier match
      if (matchRefs.current.length === 1) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setCurrentMatchIndex(0)
        highlightSearchResult(el)

      }

      // force un re-render pour afficher le bloc ◀ ▶
      setRenderedMatchesCount(matchRefs.current.length)
    }
  }



  function scrollToMatch(index: number) {
    const el = matchRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightSearchResult(el)
    }
  }


  function goToNextMatch() {
    const nextIndex = (currentMatchIndex + 1) % matchRefs.current.length
    setCurrentMatchIndex(nextIndex)
    scrollToMatch(nextIndex)
  }

  function goToPrevMatch() {
    const prevIndex = (currentMatchIndex - 1 + matchRefs.current.length) % matchRefs.current.length
    setCurrentMatchIndex(prevIndex)
    scrollToMatch(prevIndex)
  }


  return (
    <main className="h-full flex flex-col bg-white border-x border-gray-200">
      <div className="p-4 border-b bg-white sticky top-0 z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Texte source</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setShowSearch((prev) => !prev)}
                className={showSearch ? 'text-primary' : ''}
              >
                <Search className='w-4 h-4' />
              </Button>
              {showSearch && (
                <div className='flex items-center gap-2 transition-all animate-in fade-in slide-in-from-right-2'>
                  <Input
                    ref={inputRef}
                    placeholder='Rechercher...'
                    value={search}
                    onChange={(e) => {
                      setSearch?.(e.target.value);
                    }}
                    className='w-64'
                  />
                  {search && (
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => {
                        setSearch('');
                      }}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  )}

                  {search && renderedMatchesCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevMatch}
                      >
                        <ArrowLeft className='w-4 h-4' />
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {currentMatchIndex + 1} / {renderedMatchesCount}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextMatch}
                      >
                        <ArrowRight className='w-4 h-4' />
                      </Button>
                    </div>
                  )}

                </div>
              )}
              <Info className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="info-toggle" className="text-sm text-muted-foreground">
                Infos
              </Label>
              <Switch
                id="info-toggle"
                checked={showInfo}
                onCheckedChange={setShowInfo}
              />
            </div>
          </div>
        </div>

        {showInfo && (
          <div className="text-sm text-muted-foreground bg-gray-50 border rounded-md p-3 space-y-2">
            <p>Chaque surlignage correspond à une entité mentionnée dans l’acte.</p>
            <p>Couleurs personnalisées inspirées de paysages naturels et historiques.</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          {document.sections.map((section) => {
            const normalizedSearch = search.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
            const matchCount = section.blocs.reduce((total: number, bloc: any) => {
              const text = bloc.contenu?.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() || ""
              const occurrences = text.split(normalizedSearch).length - 1
              return total + occurrences
            }, 0)

            return (
              <CollapsibleSection
                key={section.id}
                section={section}
                matchCount={search ? matchCount : null}
                forceClosed={!!search && matchCount === 0}
                search={search}
                onSelectEntity={onSelectEntity}
                entities={entities}
                categories={categories}
                highlightState={highlightState}
                registerMatchRef={registerMatchRef}
                recentHuesRef={recentHuesRef}
              />
            )
          })}
        </div>
      </div>
    </main>
  )
}

function CollapsibleSection({
  section,
  matchCount,
  forceClosed = false,
  search,
  onSelectEntity,
  entities,
  categories,
  highlightState,
  registerMatchRef,
  recentHuesRef
}: {
  section: any
  matchCount: number | null
  forceClosed?: boolean
  search: string
  onSelectEntity: (entity: Entity) => void
  entities: Entity[]
  categories: any[]
  highlightState: {
    global: boolean
    categories: Record<string, boolean>
    subcategories: Record<string, boolean>
    entities: Record<string, boolean>
  }
  registerMatchRef?: (el: HTMLElement) => void
  recentHuesRef: React.MutableRefObject<number[]>
}) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (forceClosed) {
      setOpen(false)
    } else if (matchCount !== null && matchCount > 0) {
      setOpen(true)
    }
  }, [forceClosed, matchCount])

  return (
    <section className="bg-white border-l-4 rounded mb-4">
      <header
        className={clsx(
          "flex items-center cursor-pointer select-none px-4 py-2 group transition-colors duration-200",
          "hover:bg-gray-50"
        )}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground mr-2 transition-transform duration-200" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground mr-2 transition-transform duration-200" />
        )}
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 whitespace-pre-wrap tracking-tight">
            {section.titre || "Section sans titre"}
          </h1>
          {matchCount !== null && matchCount > 0 && (
            <span className="ml-4 text-xs bg-yellow-100 text-yellow-800 font-medium rounded-full px-2 py-0.5">
              {matchCount}
            </span>
          )}
        </div>
      </header>

      {open && (
        <div className="space-y-2 bg-white p-4 rounded-r-md border-gray-300 shadow-sm">
          {section.blocs
            .sort((a: any, b: any) => a.ordre - b.ordre)
            .map((bloc: any) => (
              <BlocEnSegments
                key={bloc.id}
                blocId={bloc.id}
                type={bloc.type}
                contenu={bloc.contenu}
                search={search}
                registerMatchRef={registerMatchRef}
                onMouseUp={handleTextSelection}
                onSelectEntity={onSelectEntity}
                shouldHighlight={(entityId) => {
                  const entity = entities.find((e) => e.id === entityId)
                  if (!entity) return false
                  const catMeta = categories.find((c) => c.id === entity.categorie_id)
                  const cat = catMeta?.categorie ?? ""
                  const sub = catMeta?.sous_categorie ?? ""
                  return (
                    highlightState.global &&
                    (highlightState.categories[cat] ?? true) &&
                    (highlightState.subcategories[sub] ?? true) &&
                    (highlightState.entities[entityId] ?? true)
                  )
                }}
                recentHuesRef={recentHuesRef}
              />
            ))}
        </div>
      )}
    </section>
  )
}
function highlightSearchResult(el: HTMLElement) {
  el.classList.add('ring-2', 'ring-yellow-500');
  useHighlightStore.getState().setGlobal(false)
  setTimeout(() => {
    el.classList.remove('ring-2', 'ring-yellow-500');
    useHighlightStore.getState().setGlobal(true)
  }, 1500);
}

