import { useEffect, useState } from 'react'

import type { FamilyView, MainTab } from '../components/tree-navigate/types'
import { AscendanceView } from '../components/tree-navigate/components/views/AscendanceView'
import { DescendanceView } from '../components/tree-navigate/components/views/DescendanceView'
import { FamilyCore } from '../components/tree-navigate/components/views/FamilyCore'
import { GraphicsView } from '../components/tree-navigate/components/views/GraphicsView'
import { HistoryView } from '../components/tree-navigate/components/views/HistoryView'
import { SaisieView } from '../components/tree-navigate/components/views/SaisieView'
import { SearchView } from '../components/tree-navigate/components/views/SearchView'
import { AppTabs } from '../components/tree-navigate/components/AppTabs'
import { DesktopToolbar } from '../components/tree-navigate/components/DesktopToolbar'
import { FamilySubTabs } from '../components/tree-navigate/components/FamilySubTabs'
import { LeftIndex } from '../components/tree-navigate/components/LeftIndex'
import { RightSummary } from '../components/tree-navigate/components/RightSummary'
import { StatusBar } from '../components/tree-navigate/components/StatusBar'
import { treeSettings } from '../features/family-tree/types/treeSettings'

const STORAGE_KEY = 'geniius-tree-navigation-state'

type NavigationState = {
  mainTab: MainTab
  familyView: FamilyView
  selectedPersonId?: string
}

function getInitialState(): NavigationState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {
        mainTab: 'famille',
        familyView: 'noyau',
        selectedPersonId: treeSettings.sosaReferencePersonId,
      }
    }

    const parsed = JSON.parse(raw) as Partial<NavigationState>

    return {
      mainTab: parsed.mainTab ?? 'famille',
      familyView: parsed.familyView ?? 'noyau',
      selectedPersonId:
        parsed.selectedPersonId ?? treeSettings.sosaReferencePersonId,
    }
  } catch {
    return {
      mainTab: 'famille',
      familyView: 'noyau',
      selectedPersonId: treeSettings.sosaReferencePersonId,
    }
  }
}

export default function TreeNavigatePage() {
  const initialState = getInitialState()

  const [mainTab, setMainTab] = useState<MainTab>(initialState.mainTab)
  const [familyView, setFamilyView] = useState<FamilyView>(initialState.familyView)
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(
    initialState.selectedPersonId,
  )

  useEffect(() => {
    const state: NavigationState = {
      mainTab,
      familyView,
      selectedPersonId,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [mainTab, familyView, selectedPersonId])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/50 text-[12px] text-slate-950">
      <DesktopToolbar
        onSelectSosa={() => {
          setMainTab('famille')
          setFamilyView('noyau')
          setSelectedPersonId(treeSettings.sosaReferencePersonId)
        }}
      />

      <div className="mx-auto grid min-h-0 w-full max-w-[1680px] flex-1 grid-cols-1 border-x border-slate-200 bg-white/95 shadow-xl lg:grid-cols-[340px_minmax(0,1fr)_380px]">
        <LeftIndex
          selectedPersonId={selectedPersonId}
          onPersonSelect={setSelectedPersonId}
        />

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden border-x border-slate-200 bg-slate-50">
          <AppTabs mainTab={mainTab} setMainTab={setMainTab} />

          {mainTab === 'famille' && (
            <>
              <FamilySubTabs
                familyView={familyView}
                setFamilyView={setFamilyView}
              />

              <div className="min-h-0 flex-1 overflow-hidden">
                {familyView === 'noyau' && (
                  <FamilyCore
                    selectedPersonId={selectedPersonId}
                    onPersonSelect={setSelectedPersonId}
                  />
                )}
                {familyView === 'ascendance' && <AscendanceView />}
                {familyView === 'descendance' && <DescendanceView />}
              </div>
            </>
          )}

          {mainTab !== 'famille' && (
            <div className="min-h-0 flex-1 overflow-hidden">
              {mainTab === 'saisie' && <SaisieView />}
              {mainTab === 'recherches' && <SearchView />}
              {mainTab === 'histoire' && <HistoryView />}
              {mainTab === 'graphiques' && <GraphicsView />}
            </div>
          )}
        </main>

        <RightSummary />
      </div>

      <StatusBar />
    </div>
  )
}