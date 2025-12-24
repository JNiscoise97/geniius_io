//QuestionPlanner.tsx

import React, { useEffect, useMemo, useState } from "react"
import { Pencil, Trash2, Link as LinkIcon, Paperclip, Plus } from "lucide-react"
import { Modal } from "./Modal"
import { QuestionEditorModal } from "./QuestionEditorModal"
import { SlidersHorizontal } from "lucide-react"
import { uid } from "../utils/ids"


type QStatus = "to_ask" | "asked_answered" | "asked_unanswered" | "dropped"

export type PlannedResource = {
    id: string
    type: "link" | "file"
    label: string
    url?: string
}

export type PlannedQuestion = {
    id: string
    contactId: string
    text: string
    context?: string             // ← nouveau
    expectedAnswer?: string      // ← nouveau (hypothèse / réponse attendue)
    status: QStatus
    resources?: PlannedResource[]
    createdAt: string
    updatedAt: string
    sensitive?: boolean
    emotion?: "factual" | "emotional" | "delicate"
    priority?: "high" | "medium" | "low"
    duration?: "short" | "medium" | "long"
    responseType?: "story" | "person" | "place" | "date" | "document"
    themes?: string[]
    followUp?: string
    confidenceNeeded?: boolean
    mapUrl?: string
    photoUrl?: string
}

const nowISO = () => new Date().toISOString()

function load(contactId: string): PlannedQuestion[] {
    try {
        const raw = localStorage.getItem(`qp:${contactId}`)
        if (!raw) return []
        const parsed = JSON.parse(raw) as PlannedQuestion[]
        return Array.isArray(parsed) ? parsed : []
    } catch { return [] }
}
function save(contactId: string, items: PlannedQuestion[]) {
    localStorage.setItem(`qp:${contactId}`, JSON.stringify(items))
}

const STATUS_LABEL: Record<QStatus, string> = {
    to_ask: "À poser",
    asked_answered: "Posée + réponse",
    asked_unanswered: "Posée sans réponse",
    dropped: "À écarter",
}

export function QuestionPlanner({
    contactId,
    onPromote,
}: {
    contactId: string
    onPromote?: (q: PlannedQuestion) => void
}) {
    const [items, setItems] = useState<PlannedQuestion[]>([])
    const [draft, setDraft] = useState("")

    useEffect(() => { setItems(load(contactId)) }, [contactId])
    useEffect(() => { save(contactId, items) }, [contactId, items])

    const sorted = useMemo(
        () => [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        [items]
    )

    const counts = useMemo(() => ({
        to_ask: items.filter(i => i.status === "to_ask").length,
        asked_answered: items.filter(i => i.status === "asked_answered").length,
        asked_unanswered: items.filter(i => i.status === "asked_unanswered").length,
        dropped: items.filter(i => i.status === "dropped").length,
        total: items.length,
    }), [items])

    function add() {
        const text = draft.trim()
        if (!text) return
        const q: PlannedQuestion = {
            id: uid(),
            contactId,
            text,
            context: "",
            expectedAnswer: "",
            status: "to_ask",
            resources: [],
            createdAt: nowISO(),
            updatedAt: nowISO(),
            sensitive: false,
            emotion: "factual",
            priority: "medium",
            duration: "short",
            responseType: "story",
            themes: [],
            followUp: "",
            confidenceNeeded: false,
            mapUrl: "",
            photoUrl: "",
        }
        setItems(prev => [q, ...prev])
        setDraft("")
    }

    function patch(id: string, upd: Partial<PlannedQuestion>) {
        setItems(prev => prev.map(q => q.id === id ? { ...q, ...upd, updatedAt: nowISO() } : q))
    }
    function remove(id: string) {
        setItems(prev => prev.filter(q => q.id !== id))
    }

    function addResource(id: string, type: "link" | "file") {
        const label = prompt(type === "link" ? "Intitulé du lien" : "Nom du fichier")
        if (!label) return
        const url = type === "link" ? prompt("URL du lien (https://...)") || undefined : undefined
        patch(id, {
            resources: [
                ...(items.find(q => q.id === id)?.resources ?? []),
                { id: uid(), type, label, url },
            ],
        })
    }
    function removeResource(qid: string, rid: string) {
        const q = items.find(i => i.id === qid); if (!q) return
        patch(qid, { resources: (q.resources ?? []).filter(r => r.id !== rid) })
    }

    return (
        <div className="vstack" style={{ gap: 12 }}>
            {/* Saisie rapide */}
            <div className="card">
                <div className="card-header">Questions à préparer</div>
                <div className="card-body vstack" style={{ gap: 8 }}>
                    <input
                        className="input"
                        placeholder="Saisis une question (ex. 'Qui étaient les voisins de ta maman ?')"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") add() }}
                    />
                    <div className="hstack" style={{ gap: 8, justifyContent: "space-between" }}>
                        <div className="hstack" style={{ gap: 8 }}>
                            <button className="btn" onClick={add}><Plus size={16} style={{ marginRight: 6 }} />Ajouter</button>
                            <span className="small muted">Total : {counts.total} • À poser : {counts.to_ask}</span>
                        </div>
                        <div className="small muted">Tri : plus récentes en premier</div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="hstack small" style={{ gap: 8, flexWrap: "wrap" as any }}>
                <span className="pill-lite">À poser : {counts.to_ask}</span>
                <span className="pill-lite">Posée + réponse : {counts.asked_answered}</span>
                <span className="pill-lite">Posée sans réponse : {counts.asked_unanswered}</span>
                <span className="pill-lite">Écartée : {counts.dropped}</span>
            </div>

            {/* Liste */}
            <div className="card">
                <div className="card-body vstack" style={{ gap: 10 }}>
                    {sorted.length === 0 && <div className="small muted">Aucune question pour l’instant.</div>}
                    {sorted.map(q => (
                        <QuestionRow
                            key={q.id}
                            q={q}
                            onEdit={(t) => patch(q.id, { text: t.trim() })}
                            onEditContext={(t) => patch(q.id, { context: t })}
                            onEditExpected={(t) => patch(q.id, { expectedAnswer: t })}
                            onRemove={() => remove(q.id)}
                            onStatus={(s) => patch(q.id, { status: s })}
                            onAddLink={() => addResource(q.id, "link")}
                            onAddFile={() => addResource(q.id, "file")}
                            onRemoveResource={(rid) => removeResource(q.id, rid)}
                            onPromote={onPromote ? () => onPromote(q) : undefined}
                            onEditAll={(updated) => patch(q.id, { ...updated })}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function QuestionRow({
    q,
    onEdit,
    onEditContext,
    onEditExpected,
    onRemove,
    onStatus,
    onAddLink,
    onAddFile,
    onRemoveResource,
    onPromote,
    onEditAll
}: {
    q: PlannedQuestion
    onEdit: (text: string) => void
    onEditContext: (text: string) => void
    onEditExpected: (text: string) => void
    onRemove: () => void
    onStatus: (s: QStatus) => void
    onAddLink: () => void
    onAddFile: () => void
    onRemoveResource: (rid: string) => void
    onPromote?: () => void
    onEditAll: (updated: PlannedQuestion) => void
}) {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(q.text)
    const [ctx, setCtx] = useState(q.context ?? "")
    const [expected, setExpected] = useState(q.expectedAnswer ?? "")
    const [openEdit, setOpenEdit] = useState(false)

    useEffect(() => { setText(q.text) }, [q.text])
    useEffect(() => { setCtx(q.context ?? "") }, [q.context])
    useEffect(() => { setExpected(q.expectedAnswer ?? "") }, [q.expectedAnswer])

    const created = new Date(q.createdAt)
    const updated = new Date(q.updatedAt)
    const sameDay = created.toDateString() === updated.toDateString()

    return (
        <><div className="vstack" style={{ gap: 8 }}>
            <div className="hstack" style={{ gap: 8, alignItems: "flex-start" }}>
                <StatusDot status={q.status} />
                <div className="vstack" style={{ gap: 8, flex: 1 }}>
                    {/* Question: PRIMARY, pas small */}
                    {!editing ? (
                        <div style={{ color: "var(--primary)", whiteSpace: "pre-wrap" }}>{q.text}</div>
                    ) : (
                        <textarea
                            className="input"
                            style={{ minHeight: 60 }}
                            value={text}
                            onChange={e => setText(e.target.value)} />
                    )}

                    {/* Contexte (optionnel) */}
                    {!editing ? (
                        q.context ? <div className="small" style={{ opacity: .9, whiteSpace: "pre-wrap" }}><strong>Contexte :</strong> {q.context}</div> : null
                    ) : (
                        <textarea
                            className="input"
                            placeholder="Contexte (indices, indices de mémoire, repères…)"
                            style={{ minHeight: 50 }}
                            value={ctx}
                            onChange={e => setCtx(e.target.value)} />
                    )}

                    {/* Hypothèse / Réponse attendue */}
                    {!editing ? (
                        q.expectedAnswer ? (
                            <div className="small" style={{ whiteSpace: "pre-wrap", borderLeft: "3px dashed var(--border)", paddingLeft: 8 }}>
                                <strong>Hypothèse :</strong> {q.expectedAnswer}
                            </div>
                        ) : null
                    ) : (
                        <textarea
                            className="input"
                            placeholder="Hypothèse / réponse pressentie (à confirmer)"
                            style={{ minHeight: 50 }}
                            value={expected}
                            onChange={e => setExpected(e.target.value)} />
                    )}

                    {/* ressources */}
                    {q.resources && q.resources.length > 0 && (
                        <div className="hstack small" style={{ gap: 8, flexWrap: "wrap" as any }}>
                            {q.resources.map(r => (
                                <span key={r.id} className="pill-lite hstack" style={{ gap: 6 }}>
                                    {r.type === "link" ? <LinkIcon size={14} /> : <Paperclip size={14} />}
                                    {r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.label}</a> : r.label}
                                    <button className="icon-btn-lite" title="Retirer" onClick={() => onRemoveResource(r.id)}>×</button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* horodatage */}
                    <div className="small muted">
                        Créée le {created.toLocaleString()} {sameDay ? "" : `• Modifiée le ${updated.toLocaleString()}`}
                    </div>

                    {/* actions */}
                    <div className="hstack" style={{ gap: 6, flexWrap: "wrap" as any }}>
                        {!editing ? (
                            <>
                                <button className="icon-btn-lite" title="Modifier" onClick={() => setEditing(true)}><Pencil size={16} /></button>
                                {onPromote && <button className="btn small" onClick={onPromote}>Créer une interaction</button>}
                            </>
                        ) : (
                            <>
                                <button className="btn small" onClick={() => { onEdit(text.trim()); onEditContext(ctx.trim()); onEditExpected(expected.trim()); setEditing(false) }}>Enregistrer</button>
                                <button className="btn small ghost" onClick={() => { setText(q.text); setCtx(q.context ?? ""); setExpected(q.expectedAnswer ?? ""); setEditing(false) }}>Annuler</button>
                            </>
                        )}
                        <button
                            className="icon-btn-lite"
                            title="Enrichir la question"
                            onClick={() => setOpenEdit(true)}
                        >
                            <SlidersHorizontal size={16} />
                        </button>
                        <button className="icon-btn-lite" title="Ajouter un lien" onClick={onAddLink}><LinkIcon size={16} /></button>
                        <button className="icon-btn-lite" title="Joindre un fichier (référence locale)" onClick={onAddFile}><Paperclip size={16} /></button>
                        <button className="icon-btn-lite danger" title="Supprimer" onClick={onRemove}><Trash2 size={16} /></button>
                        <select
                            className="select-lite"
                            value={q.status}
                            onChange={e => onStatus(e.target.value as QStatus)}
                            title="Statut"
                        >
                            <option value="to_ask">À poser</option>
                            <option value="asked_answered">Posée + réponse</option>
                            <option value="asked_unanswered">Posée sans réponse</option>
                            <option value="dropped">À écarter</option>
                        </select>
                    </div>
                </div>
            </div>
        </div><Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Enrichir la question" size="xl">
  <QuestionEditorModal
    initial={q}
    open={true}
    onClose={() => setOpenEdit(false)}
    onSave={(updated) => onEditAll(updated)}
  />
</Modal></>
    )
}

function StatusDot({ status }: { status: QStatus }) {
    // Bleu = À poser, Vert = posée + réponse, Orange = posée sans réponse, Gris = écartée
    const color =
        status === "to_ask" ? "#2563eb" :
            status === "asked_answered" ? "#16a34a" :
                status === "asked_unanswered" ? "#b45309" : "#6b7280"
    return <span style={{
        width: 10, height: 10, borderRadius: 999, background: color, display: "inline-block", marginTop: 6
    }} title={STATUS_LABEL[status]} />
}
