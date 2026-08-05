import { useEffect, useState } from 'react'

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
import { treeSettings } from '../features/family-tree/types/treeSettings'
import { HistorySubTabs } from '../components/tree-navigate/components/HistorySubTabs'
import { ChronologyView } from '../components/tree-navigate/components/views/ChronologyView'
import { DocumentsSubTabs } from '../components/tree-navigate/components/DocumentsSubTabs'
import { MediasView } from '../components/tree-navigate/components/views/MediasView'
import { DescriptionView } from '../components/tree-navigate/components/views/DescriptionView'
import { AnalyseView } from '../components/tree-navigate/components/views/AnalyseView'

const STORAGE_KEY = 'geniius-tree-navigation-state'
const MAX_HISTORY_SIZE = 20

type NavigationState = {
  mainTab: MainTab
  individuView: IndividuView
  familyView: FamilyView
  historyView: HistoryView
  documentsView: DocumentsView
  selectedPersonId?: string
}

function getInitialState(): NavigationState {
  const fallback: NavigationState = {
    mainTab: 'famille',
    individuView: 'description',
    familyView: 'noyau',
    historyView: 'chronologie',
    documentsView: 'medias',
    selectedPersonId: treeSettings.sosaReferencePersonId,
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
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
  const initialState = getInitialState()

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

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [mainTab, individuView, familyView, historyView, documentsView, selectedPersonId])

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
    setMainTab('famille')
    setFamilyView('noyau')
    navigateToPerson(treeSettings.sosaReferencePersonId)
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