export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-bold text-slate-500">Chargement de l'arbre…</p>
        <p className="mt-1 text-xs font-medium text-slate-400">Fichier GEDCOM en cours de lecture</p>
      </div>
    </div>
  )
}
