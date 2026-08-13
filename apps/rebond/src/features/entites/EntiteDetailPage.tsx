// EntiteDetailPage.tsx
// Fiche d'une entité canonique : faits validés agrégés depuis tous les
// actes qui la mentionnent, relations directes (liste plate, pas un graphe
// — ça c'est le rôle du futur module Graphe historique), et les documents
// où elle apparaît. Les faits eux-mêmes restent en lecture seule (valider/
// rejeter se fait dans le module Extraction, sur l'acte) — seules deux
// actions existent ici, sur la fiche elle-même : renommer le libellé et
// supprimer l'entité canonique (2026-08-10, demande explicite, dérogation
// à la doctrine "lecture seule" d'origine — voir schema-docs/entities.md).
// Supprimer ne touche jamais Extraction : les entités locales/assertions de
// l'acte restent intactes, seule la fiche de regroupement disparaît (voir
// deleteEntity dans entites.service.ts pour le détail du cascade).

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LayoutDashboard, Users2, Loader2, AlertCircle, MapPin, User, FileText, ArrowRight, Pencil, Trash2, Check, X } from 'lucide-react'
import { fetchEntityDetail, renameEntity, deleteEntity } from './entites.service'
import type { EntityDetail } from './entites.types'

export function EntiteDetailPage() {
  const { entityId } = useParams<{ entityId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entity, setEntity] = useState<EntityDetail | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [labelDraft, setLabelDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!entityId) return
    let cancelled = false
    setLoading(true)
    fetchEntityDetail(entityId)
      .then(data => {
        if (cancelled) return
        if (!data) setNotFound(true)
        else setEntity(data)
      })
      .catch(err => { if (!cancelled) setError(err?.message ?? 'Erreur de chargement') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [entityId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement…
        </div>
      </div>
    )
  }

  if (error || notFound || !entity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-rose-200 p-6 max-w-sm text-center">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-800 mb-1">{error ? 'Erreur de chargement' : 'Entité introuvable'}</p>
          {error && <p className="text-xs text-gray-500">{error}</p>}
          <button onClick={() => navigate('/entites')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800">
            Retour aux entités
          </button>
        </div>
      </div>
    )
  }

  const Icon = entity.entityType === 'place' ? MapPin : User

  function startRename() {
    setLabelDraft(entity!.label)
    setRenaming(true)
  }

  async function handleRename() {
    const trimmed = labelDraft.trim()
    if (!trimmed || !entity) return
    setSaving(true)
    try {
      await renameEntity(entity.id, trimmed)
      setEntity({ ...entity, label: trimmed })
      setRenaming(false)
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors du renommage')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!entity) return
    if (!window.confirm(`Supprimer définitivement la fiche "${entity.label}" ? Les actes et faits liés dans Extraction ne sont pas affectés.`)) return
    setDeleting(true)
    try {
      await deleteEntity(entity.id)
      toast.success('Entité supprimée')
      navigate('/entites')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de la suppression')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <LayoutDashboard className="w-4 h-4" />Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/entites" className="flex items-center gap-1.5 hover:text-gray-700 transition-colors">
            <Users2 className="w-4 h-4" />Entités
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 truncate">{entity.label}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              {renaming ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={labelDraft}
                    onChange={e => setLabelDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                    className="text-xl font-semibold text-gray-900 border-b border-indigo-300 focus:outline-none focus:border-indigo-500 min-w-0"
                  />
                  <button onClick={handleRename} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setRenaming(false)} disabled={saving} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <h1 className="text-xl font-semibold text-gray-900 truncate">{entity.label}</h1>
                  <button onClick={startRename} className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400">{entity.entityType === 'place' ? 'Lieu' : 'Personne'}</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Supprimer
          </button>
        </div>

        {entity.relations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Relations directes</h2>
            <div className="flex flex-col gap-1.5">
              {entity.relations.map((r, i) => (
                r.targetEntityId ? (
                  <Link key={i} to={`/entites/${r.targetEntityId}`}
                    className="flex items-center justify-between text-sm text-gray-700 hover:text-indigo-700 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group">
                    <span><span className="text-gray-400">{r.predicateLabel} :</span> {r.targetLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </Link>
                ) : (
                  <div key={i} className="text-sm text-gray-700 py-1.5 px-2">
                    <span className="text-gray-400">{r.predicateLabel} :</span> {r.targetLabel}
                    <span className="text-[11px] text-gray-300 ml-1.5">(pas encore une fiche)</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Faits ({entity.facts.length})</h2>
          {entity.facts.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun fait validé pour l'instant.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {entity.facts.map(f => (
                <div key={f.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="text-sm text-gray-800">{f.label}</p>
                  {f.sourceText && <p className="text-xs text-gray-400 italic mt-1">« {f.sourceText} »</p>}
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" />{f.documentTitre}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {entity.documents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Mentionnée dans {entity.documents.length} acte{entity.documents.length > 1 ? 's' : ''}</h2>
            <div className="flex flex-col gap-1.5">
              {entity.documents.map(d => (
                <Link key={d.versionId} to={`/atelier-documentaire/exemplaires/${d.exemplaireId}/versions/${d.versionId}/extraction`}
                  className="flex items-center justify-between text-sm text-gray-700 hover:text-indigo-700 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-gray-300" />{d.titre}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EntiteDetailPage
