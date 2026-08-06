// vueFormat.ts
// Formatage partagé de la position/plage de vues d'un exemplaire, relative
// à l'étendue totale du registre associé (ex. "Vue 10 / 250"). Utilisé par
// le récapitulatif du wizard de référencement et par la carte "Documents à
// décrire" du dashboard patrimoine.

// Le champ "position" d'un registre est saisi comme une plage complète
// (ex. "1-250" = le registre numérisé va de la vue 1 à la vue 250). La borne
// haute de cette plage sert de dénominateur pour situer une table/un acte
// dans l'étendue totale du registre (ex. "Vue 10 / 250").
export function vueMax(position: string | null | undefined): string | null {
  if (!position?.includes('-')) return null
  return position.split('-')[1]?.trim() || null
}

export function formatVue(position: string, max: string | null): string {
  const label = position.includes('-') ? 'Vues' : 'Vue'
  return max ? `${label} ${position} / ${max}` : `${label} ${position}`
}
