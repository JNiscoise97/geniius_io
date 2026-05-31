import {
  getChildren,
  getPerson,
  getSpouses,
  graph,
} from '../data'

export function StatusBar({
  selectedPersonId,
}: {
  selectedPersonId?: string
}) {
  const person = selectedPersonId ? getPerson(selectedPersonId) : undefined

  const totalPeople = Object.keys(graph.people).length
  const spousesCount = person ? getSpouses(person.id).length : 0
  const childrenCount = person ? getChildren(person.id).length : 0

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 shadow-sm">
      Individus : {totalPeople.toLocaleString('fr-FR')} ·{' '}
      {person ? `Individu central : ${person.id}` : 'Aucun individu central'} ·{' '}
      {spousesCount} conjoint{spousesCount > 1 ? 's' : ''} ·{' '}
      {childrenCount} enfant{childrenCount > 1 ? 's' : ''}
    </footer>
  )
}