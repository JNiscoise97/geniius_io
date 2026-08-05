import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import type { DocumentsView, FamilyView, HistoryView, IndividuView, MainTab } from '../components/tree-navigate/types'
import { AscendanceView } from '../components/tree-navigate/components/views/AscendanceView'
import { DescendanceView } from '../components/tree-navigate/components/views/DescendanceView'
import { FamilyCore } from '../components/tree-navigate/components/views/FamilyCore'
import { GraphicsView } from '../components/tree-navigate/components/views/GraphicsView'
import { SaisieView } from '../components/tree-navigate/components/views/SaisieView'
import { AppTabs } from '../components/tree-navigate/components/AppTabs'
import { DesktopToolbar } from '../components/tree-navigate/components/DesktopToolbar'
import { FamilySubTabs } from '../components/tree-navigate/components/FamilySubTabs'
import { IndividuSubTabs } from '../components/tree-navigate/components/IndividuSubTabs'
import { LeftIndex } from '../components/tree-navigate/components/LeftIndex'
import { RightSummary } from '../components/tree-navigate/components/RightSummary'
import { StatusBar } from '../components/tree-navigate/components/StatusBar'
import { supabase } from '../lib/supabase/client'
import { HistorySubTabs } from '../components/tree-navigate/components/HistorySubTabs'
import { ChronologyView } from '../components/tree-navigate/components/views/ChronologyView'
import { DocumentsSubTabs } from '../components/tree-navigate/components/DocumentsSubTabs'
import { MediasView } from '../components/tree-navigate/components/views/MediasView'
import { DescriptionView } from '../components/tree-navigate/components/views/DescriptionView'
import { AnalyseView } from '../components/tree-navigate/components/views/AnalyseView'

const MAX_HISTORY_SIZE = 20

function storageKey(treeId?: string) {
  return `geniius-tree-navigation-state-${treeId ?? 'unknown'}`
}

type NavigationState = {
  mainTab: MainTab
  individuView: IndividuView
  familyView: FamilyView
  historyView: HistoryView
  documentsView: DocumentsView
  selectedPersonId?: string
}

function getInitialState(treeId?: string): NavigationState {
  const fallback: NavigationState = {
    mainTab: 'famille',
    individuView: 'description',
    familyView: 'noyau',
    historyView: 'chronologie',
    documentsView: 'medias',
    selectedPersonId: undefined,
  }

  try {
    const raw = window.localStorage.getItem(storageKey(treeId))
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<NavigationState>

    return {
      mainTab: parsed.mainTab ?? fallback.mainTab,
      individuView: parsed.individuView ?? fallback.individuView,
      familyView: parsed.familyView ?? fallback.familyView,
      historyView: parsed.historyView ?? fallback.historyView,
      documentsView: parsed.documentsView ?? fallback.documentsView,
      selectedPersonId:
        parsed.selectedPersonId ?? fallback.selectedPersonId,
    }
  } catch {
    return fallback
  }
}

export default function TreeNavigatePage() {
  const { treeId } = useParams<{ treeId: string }>()
  const initialState = getInitialState(treeId)

  const [referencePersonId, setReferencePersonId] = useState<string | undefined>(undefined)

  const [mainTab, setMainTab] = useState<MainTab>(initialState.mainTab)
  const [individuView, setIndividuView] = useState<IndividuView>(
    initialState.individuView,
  )
  const [familyView, setFamilyView] = useState<FamilyView>(
    initialState.familyView,
  )
  const [historyView, setHistoryView] = useState<HistoryView>(
    initialState.historyView,
  )
  const [documentsView, setDocumentsView] = useState<DocumentsView>(
    initialState.documentsView,
  )

  const [selectedPersonId, setSelectedPersonId] = useState<
    string | undefined
  >(initialState.selectedPersonId)

  const [previewPersonId, setPreviewPersonId] = useState<string | undefined>(
    initialState.selectedPersonId,
  )

  const [peopleQuery, setPeopleQuery] = useState('')

  const [personHistory, setPersonHistory] = useState<string[]>(
    initialState.selectedPersonId ? [initialState.selectedPersonId] : [],
  )

  const [historyIndex, setHistoryIndex] = useState(
    initialState.selectedPersonId ? 0 : -1,
  )

  const canGoPrevious = historyIndex > 0
  const canGoNext =
    historyIndex >= 0 && historyIndex < personHistory.length - 1

  useEffect(() => {
    const state: NavigationState = {
      mainTab,
      individuView,
      familyView,
      historyView,
      documentsView,
      selectedPersonId,
    }

    window.localStorage.setItem(storageKey(treeId), JSON.stringify(state))
  }, [treeId, mainTab, individuView, familyView, historyView, documentsView, selectedPersonId])

  // Charge la personne de référence de cet arbre, et centre dessus si rien
  // n'était déjà sélectionné (nouvel arbre, ou pas encore d'historique local).
  useEffect(() => {
    if (!treeId) return

    supabase
      .from('trees')
      .select('reference_person_id')
      .eq('id', treeId)
      .maybeSingle()
      .then(({ data }) => {
        const refId = data?.reference_person_id ?? undefined
        setReferencePersonId(refId)
        if (!refId) return

        setSelectedPersonId((current) => current ?? refId)
        setPreviewPersonId((current) => current ?? refId)
        setPersonHistory((current) => (current.length > 0 ? current : [refId]))
        setHistoryIndex((current) => (current >= 0 ? current : 0))
      })
  }, [treeId])

  async function setPersonAsReference(personId: string) {
    if (!treeId) return
    const { error } = await supabase
      .from('trees')
      .update({ reference_person_id: personId })
      .eq('id', treeId)

    if (!error) setReferencePersonId(personId)
  }

  function previewPerson(personId: string) {
    setPreviewPersonId(personId)
  }

  function navigateToPerson(personId: string) {
    if (!personId) return

    setSelectedPersonId(personId)

    setPersonHistory((currentHistory) => {
      const currentPersonId = currentHistory[historyIndex]

      if (currentPersonId === personId) {
        return currentHistory
      }

      const historyBeforeCurrentIndex =
        historyIndex >= 0
          ? currentHistory.slice(0, historyIndex + 1)
          : []

      const nextHistory = [...historyBeforeCurrentIndex, personId]
      const trimmedHistory = nextHistory.slice(-MAX_HISTORY_SIZE)

      setHistoryIndex(trimmedHistory.length - 1)

      return trimmedHistory
    })
  }

  function goPreviousPerson() {
    if (!canGoPrevious) return

    const nextIndex = historyIndex - 1
    const personId = personHistory[nextIndex]

    if (!personId) return

    setHistoryIndex(nextIndex)
    setSelectedPersonId(personId)
  }

  function goNextPerson() {
    if (!canGoNext) return

    const nextIndex = historyIndex + 1
    const personId = personHistory[nextIndex]

    if (!personId) return

    setHistoryIndex(nextIndex)
    setSelectedPersonId(personId)
  }

  function selectPlace(placeQuery: string) {
    setPeopleQuery(placeQuery)
  }

  function goToSosa() {
    if (!referencePersonId) return
    setMainTab('famille')
    setFamilyView('noyau')
    navigateToPerson(referencePersonId)
  }

  return (
    <div className="flex h-[calc(100dvh-4.25rem)] min-h-0 flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/50 text-[12px] text-slate-950">
      <DesktopToolbar
        onSelectSosa={goToSosa}
        onPrevious={goPreviousPerson}
        onNext={goNextPerson}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
      />

        <div className="mx-auto grid min-h-0 flex-1 overflow-hidden w-full max-w-[1680px] grid-cols-1 border-x border-slate-200 bg-white/95 shadow-xl lg:grid-cols-[340px_minmax(0,1fr)_380px] lg:grid-rows-1">
          <LeftIndex
            selectedPersonId={selectedPersonId}
            query={peopleQuery}
            onQueryChange={setPeopleQuery}
            onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
          />

          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden border-x border-slate-200 bg-slate-50">
            <AppTabs mainTab={mainTab} setMainTab={setMainTab} />

            {mainTab === 'individu' ? (
              <>
                <IndividuSubTabs
                  individuView={individuView}
                  setIndividuView={setIndividuView}
                />

                <div className="min-h-0 flex-1 overflow-hidden">
                  {individuView === 'description' && (
                    <DescriptionView
                      selectedPersonId={selectedPersonId}
                      onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
                      onPlaceSelect={selectPlace}
                      referencePersonId={referencePersonId}
                      onSetReference={setPersonAsReference}
                    />
                  )}

                  {individuView === 'analyse' && <AnalyseView />}
                </div>
              </>
            ) : mainTab === 'famille' ? (
              <>
                <FamilySubTabs
                  familyView={familyView}
                  setFamilyView={setFamilyView}
                />

                <div className="min-h-0 flex-1 overflow-hidden">
                  {familyView === 'noyau' && (
                    <FamilyCore
                      selectedPersonId={selectedPersonId}
                      onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
                      referencePersonId={referencePersonId}
                      onSetReference={setPersonAsReference}
                    />
                  )}

                  {familyView === 'ascendance' && (
                    <AscendanceView
                      selectedPersonId={selectedPersonId}
                      onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
                    />
                  )}

                  {familyView === 'descendance' && (
                    <DescendanceView
                      selectedPersonId={selectedPersonId}
                      onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
                    />
                  )}
                </div>
              </>
            ) : mainTab === 'histoire' ? (
              <>
                <HistorySubTabs
                  historyView={historyView}
                  setHistoryView={setHistoryView}
                />

                <div className="min-h-0 flex-1 overflow-hidden">
                  {historyView === 'chronologie' && (
                    <ChronologyView
                      selectedPersonId={selectedPersonId}
                      onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
                    />
                  )}
                </div>
              </>
            ) : mainTab === 'documents' ? (
              <>
                <DocumentsSubTabs
                  documentsView={documentsView}
                  setDocumentsView={setDocumentsView}
                />

                <div className="min-h-0 flex-1 overflow-hidden">
                  {documentsView === 'medias' && (
                    <MediasView
                      selectedPersonId={selectedPersonId}
                      onPersonSelect={navigateToPerson} onPersonPreview={previewPerson}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-hidden">
                {mainTab === 'saisie' && <SaisieView />}
                {mainTab === 'graphiques' && <GraphicsView />}
              </div>
            )}
          </main>

          <RightSummary
            previewPersonId={previewPersonId}
            onPersonNavigate={navigateToPerson}
            onPersonPreview={previewPerson}
          />
        </div>

      <StatusBar selectedPersonId={selectedPersonId} />
    </div>
  )
}