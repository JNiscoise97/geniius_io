import type { ReactNode } from 'react'
import {
  BadgeCheck,
  CircleDashed,
  Crown,
  Heart,
  UserRound,
  Users,
} from 'lucide-react'

import { FamilyCard } from '../ui/FamilyCard'
import { GeneBadge } from '../ui/GeneBadge'

export function FamilyCore() {
  return (
    <div className="h-full overflow-auto bg-[#f6f7fb] p-3 text-slate-950 sm:p-5">
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:min-w-[720px]">
        <CentralPerson />

        <FamilySection
          title="Parents"
          icon={Users}
          description="Filiation directe"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FamilyCard
              label="Ajouter le père"
              empty
              relationHint="Père"
              large
              tone="hypothesis"
            />

            <FamilyCard
              label="(MAMMOSA) Julie"
              subtitle="Cultivatrice · 1807–1855"
              tag="source solide"
              relationHint="Mère"
              large
              tone="source"
            />
          </div>
        </FamilySection>

        <FamilySection
          title="Grands-parents"
          icon={Crown}
          description="Origines familiales"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FamilyCard label="Ajouter le grand-père" empty relationHint="Grand-mère paternel" tone="neutral" />
            <FamilyCard label="Ajouter la grand-mère" empty relationHint="Grand-mère paternelle" tone="neutral" />
            <FamilyCard label="Ajouter le grand-père" empty relationHint="Grand-père maternel" tone="neutral" />

            <FamilyCard
              label="? SANS NOM Esther"
              subtitle="1775–1827"
              relationHint="Grand-mère maternelle"
              tag="hypothèse"
              tone="hypothesis"
            />
          </div>
        </FamilySection>

        <FamilySection
          title="Conjoints"
          icon={Heart}
          description="Unions et relations"
        >
          <div className="grid gap-3">
            <RelationHeader count="1" label="conjoint connu" />

            <FamilyCard
              label="(AUNEILLE) Louise"
              subtitle="1835–1899 · mariage 1849"
              tag="conjoint"
              selected
              tone="selected"
            />
          </div>
        </FamilySection>

        <FamilySection
          title="Enfants"
          icon={UserRound}
          description="Descendance directe"
        >
          <div className="grid gap-3">
            <RelationHeader count="2" label="enfants connus" />

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
        </FamilySection>
      </div>
    </div>
  )
}

function CentralPerson() {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-slate-500 sm:mx-0 sm:h-28 sm:w-24">
          <UserRound size={52} />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Individu central
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                (MAMMOSA) Pierre “Gédéon”
              </h1>
            </div>

            <span className="mx-auto inline-flex w-fit items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black text-white sm:mx-0">
              <BadgeCheck size={13} />
              104 · G7
            </span>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Cultivateur et charretier — né esclave de Pierre Louis JULIENNE,
            émancipé par le décret d’abolition.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <InfoChip label="Naissance" value="1833 · Saint-Paul" />
            <InfoChip label="Décès" value="16 janvier 1862 · Saint-Paul" />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <GeneBadge tone="good">source directe</GeneBadge>
            <GeneBadge tone="warn">filiation à consolider</GeneBadge>
            <GeneBadge tone="info">personne pivot</GeneBadge>
          </div>
        </div>
      </div>
    </section>
  )
}

function FamilySection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof Users
  children: ReactNode
}) {
  return (
    <section className="rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  )
}

function InfoChip({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-slate-100 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function RelationHeader({
  count,
  label,
}: {
  count: string
  label: string
}) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
      <CircleDashed size={13} className="text-slate-400" />
      <span className="text-slate-900">{count}</span>
      {label}
    </div>
  )
}