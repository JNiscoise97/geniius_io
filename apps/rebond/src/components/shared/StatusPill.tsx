// StatusPill.tsx
//
// Version simplifiée du composant rapatrié depuis rebond_deprecated : la
// version d'origine résolvait le statut via `statutConfig` (constantes du
// workflow de transcription de l'ancien modèle, sans équivalent ici) — un
// simple badge suffit pour l'usage actuel (colonne "Statut de l'acte" de
// IndividuLigneDeVieTable, module Individu rapatrié, pas encore branché à
// de vraies données).

interface StatusPillProps {
  statut: string
}

export function StatusPill({ statut }: StatusPillProps) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-center text-gray-700 bg-gray-100">
      {statut}
    </span>
  )
}
