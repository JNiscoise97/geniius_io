import { type FamilyGraphPerson, getBirth, getDeath } from "@geniius/utils/family-graph"
import { calculateAge } from "@geniius/utils/family-graph-utils"
import { getPersonPrimaryPhoto } from "../../data"
import { ImageAvatar } from "./ImageAvatar"
import { formatDisplayName, formatEventLine } from "../lib/formatPersonInfos"
import { MISSING_DEATH } from "../../../../../../../packages/geniius-utils/src/lib/calculate-age"

export function CentralPerson({ person }: { person?: FamilyGraphPerson }) {
  if (!person) {
    return (
      <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4">
        <p className="text-sm font-semibold text-slate-500">Aucun individu sélectionné.</p>
      </section>
    )
  }

  const birth = getBirth(person)
  const death = getDeath(person)
  const sexClass = person.sex === 'F' ? 'bg-[#D4537E]' : 'bg-[#378ADD]'
  const photoUrl = getPersonPrimaryPhoto(person.id)
  const age = calculateAge(birth?.date, death?.date)

  return (
    <section className="relative rounded-[20px] border-[1.5px] border-[#378ADD] bg-white px-5 py-4">
      <span className="absolute right-4 top-3 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
        ID {person.id}
      </span>

      <div className="flex items-start gap-4">
        {photoUrl && (
          <ImageAvatar src={photoUrl} alt={formatDisplayName(person)} sizeClass="h-[78px] w-[78px]" />
        )}

        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#378ADD]">
            Individu central
          </p>

          <div>
            <p className="text-xl font-medium leading-tight text-slate-950">
              <span className={`mr-1 inline-block h-[7px] w-[7px] rounded-full align-[1px] ${sexClass}`} />
              {formatDisplayName(person)}
            </p>

            {hasMultipleFirstNames(person.firstName) && (
              <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                Prénom complet : {person.firstName}
              </p>
            )}
          </div>

          <div className="mt-2 text-xs leading-5 text-slate-500">
            <p>
              <span className="font-medium text-slate-700">N :</span>{' '}
              {formatEventLine(birth?.date, birth?.place) || '—'}
            </p>

            {death?.date || death?.place ? (
              <p className="mt-1">
                <span className="font-medium text-slate-700">D :</span>{' '}
                {formatEventLine(death?.date, death?.place) || '—'}
              </p>
            ) : age === MISSING_DEATH ? (
              <p className="mt-1">
                <span className="font-medium text-slate-700">D :{' '}</span>
                date et lieu inconnus
              </p>
            ) : (
              birth?.date && age !== '—' && (
                <p className="mt-1">
                  <span className="font-medium text-slate-700">Âge :</span>{' '}
                  {age}
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function hasMultipleFirstNames(firstName?: string) {
  return (firstName?.trim().split(/\s+/).length ?? 0) > 1
}