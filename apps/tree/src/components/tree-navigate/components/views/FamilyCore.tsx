import { UserRound } from 'lucide-react'

import { ColorButton } from '../ui/ColorButton'
import { FamilyCard } from '../ui/FamilyCard'
import { GeneBadge } from '../ui/GeneBadge'

export function FamilyCore() {
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-3 text-slate-950 sm:p-4">
      <div className="mx-auto grid w-full max-w-5xl gap-5 lg:min-w-[720px]">
        {/* Mobile : personne centrale en premier */}
        <CentralPerson />

        {/* Parents */}
        <section className="grid gap-3">
          <SectionLabel>Parents</SectionLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FamilyCard
              label="Ajouter le père"
              empty
              large
              tone="hypothesis"
            />

            <FamilyCard
              label="(MAMMOSA) Julie"
              subtitle="Cultivatrice · 1807–1855"
              tag="source solide"
              large
              tone="source"
            />
          </div>
        </section>

        {/* Grands-parents */}
        <section className="grid gap-3">
          <SectionLabel>Grands-parents</SectionLabel>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FamilyCard label="Ajouter le grand-père" empty tone="neutral" />
            <FamilyCard label="Ajouter la grand-mère" empty tone="neutral" />
            <FamilyCard label="Ajouter le grand-père" empty tone="neutral" />

            <FamilyCard
              label="? SANS NOM"
              subtitle="Esther · 1775–1827"
              tag="hypothèse"
              tone="hypothesis"
            />
          </div>
        </section>

        {/* Conjoints */}
        <section className="grid gap-3">
          <SectionLabel>Conjoints</SectionLabel>

          <div>
            <ColorButton label="Un conjoint" />

            <FamilyCard
              label="(AUNEILLE) Louise"
              subtitle="1835–1899 · mariage 1849"
              tag="conjoint"
              selected
              tone="selected"
            />
          </div>
        </section>

        {/* Enfants */}
        <section className="grid gap-3">
          <SectionLabel>Enfants</SectionLabel>

          <div>
            <ColorButton label="2 enfants" />

            <div className="grid gap-3 sm:grid-cols-2">
              <FamilyCard
                label="MAMMOSA Pierre Gédéon"
                subtitle="1851–1899"
                tag="fils"
                selected
                tone="selected"
              />

              <FamilyCard
                label="MAMMOSA Marie"
                subtitle="1855–1894"
                tag="fille"
                tone="source"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function CentralPerson() {
  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-4 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
        <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 shadow-lg sm:mx-0 sm:h-28 sm:w-24 sm:rotate-[-5deg]">
          <UserRound size={52} className="text-indigo-400" />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-black text-slate-950">
              (MAMMOSA) Pierre “Gédéon”
            </h1>

            <span className="mx-auto w-fit shrink-0 rounded-full bg-indigo-700 px-3 py-1 text-[11px] font-black text-white sm:mx-0">
              104 (G 7)
            </span>
          </div>

          <p className="mt-2 text-sm italic text-slate-600">
            cultivateur et charretier — né esclave de Pierre Louis JULIENNE
          </p>

          <p className="mt-2 text-sm text-slate-700">
            N : 1833 — Saint-Paul (Réunion)
            <br />
            D : 16 janvier 1862 — Saint-Paul (Réunion)
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <GeneBadge tone="good">source directe</GeneBadge>
            <GeneBadge tone="warn">filiation à consolider</GeneBadge>
            <GeneBadge tone="info">personne pivot</GeneBadge>
          </div>
        </div>
      </div>
    </section>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {children}
      </p>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}