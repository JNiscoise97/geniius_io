// components/modals/KindEditorModal.tsx
import React, { useEffect, useMemo, useState } from "react"
import { X, Search, ChevronLeft } from "lucide-react"
import { uid } from "@echo/ui/utils/ids";

/* ===== Types ===== */
export type PrepKind =
    | "question" | "clarification" | "hypothesis_check"
    | "request_document" | "request_testimony" | "request_contact" | "request_permission"
    | "invite_event" | "invite_call" | "invite_meeting" | "invite_collaboration"
    | "share_document" | "share_info" | "share_update" | "share_media"
    | "plan_meeting" | "plan_event" | "coordination"
    | "follow_up" | "reminder" | "thanks"

export type PrepItem = { id: string; kind: PrepKind; data: Record<string, any> }

export type FieldType = "text" | "textarea" | "email" | "tel" | "date" | "time" | "url" | "chips" | "select"
export type FieldSpec = {
    name: string
    label: string
    type: FieldType
    placeholder?: string
    options?: { value: string; label: string }[]
    required?: boolean
}

/* ===== Champs par kind ===== */
const KIND_FIELDS: Record<PrepKind, FieldSpec[]> = {
    question: [
        { name: "title", label: "Question", type: "textarea", placeholder: "Ex. Qui étaient les voisins de ta maman ?", required: true },
        { name: "context", label: "Contexte", type: "textarea", placeholder: "Repères pour aider la mémoire…" },
        { name: "hypothesis", label: "Hypothèse (optionnel)", type: "textarea", placeholder: "Réponse pressentie à confirmer…" },
        {
            name: "responseType", label: "Type de réponse", type: "select", options: [
                { value: "story", label: "Souvenir / récit" },
                { value: "person", label: "Personne à identifier" },
                { value: "place", label: "Lieu / voisinage" },
                { value: "date", label: "Date / période" },
                { value: "document", label: "Document" },
            ]
        },
        { name: "themes", label: "Thèmes (séparés par des virgules)", type: "chips", placeholder: "voisinage, fratrie…" },
    ],
    clarification: [
        { name: "title", label: "Point à clarifier", type: "textarea", required: true },
        { name: "context", label: "Contexte", type: "textarea" },
    ],
    hypothesis_check: [
        { name: "statement", label: "Hypothèse à vérifier", type: "textarea", required: true },
        { name: "sources", label: "Sources pressenties", type: "textarea", placeholder: "Indices, témoins, documents…" },
    ],
    request_document: [
        { name: "doc", label: "Document demandé", type: "text", required: true },
        { name: "repository", label: "Où / À qui", type: "text", placeholder: "Service, personne, URL…" },
        { name: "deadline", label: "Échéance", type: "date" },
    ],
    request_testimony: [
        { name: "topic", label: "Sujet du témoignage", type: "text", required: true },
        { name: "person", label: "Témoin pressenti", type: "text" },
        { name: "questions", label: "Pistes de questions", type: "textarea" },
    ],
    request_contact: [
        { name: "who", label: "Personne à contacter", type: "text", required: true },
        { name: "why", label: "Pourquoi", type: "textarea" },
        { name: "email", label: "Email", type: "email" },
        { name: "tel", label: "Téléphone", type: "tel" },
    ],
    request_permission: [
        { name: "what", label: "Objet de la demande", type: "text", required: true },
        { name: "to", label: "À qui", type: "text" },
        { name: "details", label: "Détails", type: "textarea" },
    ],
    invite_event: [
        { name: "title", label: "Titre de l’événement", type: "text", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "time", label: "Heure", type: "time" },
        { name: "place", label: "Lieu", type: "text" },
        { name: "note", label: "Message d’invitation", type: "textarea" },
    ],
    invite_call: [
        { name: "title", label: "Objet de l’appel", type: "text", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "time", label: "Heure", type: "time" },
        { name: "note", label: "Message", type: "textarea" },
    ],
    invite_meeting: [
        { name: "title", label: "Objet du RDV", type: "text", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "time", label: "Heure", type: "time" },
        { name: "place", label: "Lieu", type: "text" },
        { name: "agenda", label: "Agenda", type: "textarea" },
    ],
    invite_collaboration: [
        { name: "title", label: "Proposition", type: "text", required: true },
        { name: "scope", label: "Périmètre", type: "textarea" },
        { name: "tools", label: "Outils / canaux", type: "chips", placeholder: "Drive, Slack…" },
    ],
    share_document: [
        { name: "label", label: "Nom du document", type: "text", required: true },
        { name: "url", label: "Lien (URL)", type: "url" },
        { name: "note", label: "Message", type: "textarea" },
    ],
    share_info: [
        { name: "title", label: "Info à partager", type: "text", required: true },
        { name: "note", label: "Détails / contexte", type: "textarea" },
    ],
    share_update: [
        { name: "title", label: "Mise à jour", type: "text", required: true },
        { name: "note", label: "Détails", type: "textarea" },
    ],
    share_media: [
        { name: "label", label: "Média", type: "text", required: true },
        { name: "url", label: "Lien (URL)", type: "url" },
        { name: "caption", label: "Légende", type: "textarea" },
    ],
    plan_meeting: [
        { name: "title", label: "Objet", type: "text", required: true },
        { name: "participants", label: "Participants", type: "chips", placeholder: "Alice, Bob…" },
        { name: "agenda", label: "Agenda", type: "textarea" },
    ],
    plan_event: [
        { name: "title", label: "Titre", type: "text", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "place", label: "Lieu", type: "text" },
        { name: "note", label: "Notes", type: "textarea" },
    ],
    coordination: [
        { name: "topic", label: "Sujet de coordination", type: "text", required: true },
        { name: "tasks", label: "Tâches / rôles", type: "textarea" },
    ],
    follow_up: [
        { name: "title", label: "Objet de la relance", type: "text", required: true },
        { name: "when", label: "Quand relancer", type: "date" },
        { name: "note", label: "Message", type: "textarea" },
    ],
    reminder: [
        { name: "title", label: "Rappel", type: "text", required: true },
        { name: "when", label: "Date", type: "date" },
    ],
    thanks: [
        { name: "to", label: "À qui", type: "text", required: true },
        { name: "message", label: "Message de remerciement", type: "textarea" },
    ],
}

/* ===== Composant ===== */
export function KindEditorModal({
    open,
    specs,             // { kind: { label, Icon, color } }
    initialId,
    initialKind,
    initialData,
    onClose,
    onSave,
}: {
    open: boolean
    specs: Record<PrepKind, { label: string; Icon: React.ComponentType<any>; color: string }>
    initialId?: string
    initialKind?: PrepKind
    initialData?: Record<string, any>
    onClose: () => void
    onSave: (item: PrepItem) => void
}) {
    // Mode
    const isEdit = Boolean(initialId)

    // State (hooks en haut, ordre stable)
    const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1)
    const [kind, setKind] = useState<PrepKind>(initialKind || "question")
    const [form, setForm] = useState<Record<string, any>>(initialData || {})
    const [search, setSearch] = useState("")
    const [currentId, setCurrentId] = useState<string | undefined>(initialId)

    useEffect(() => {
        if (open) {
            const edit = Boolean(initialId)
            setStep(edit ? 2 : 1)
            setKind(initialKind || "question")
            setForm(initialData || {})
            setSearch("")
            setCurrentId(initialId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialId, initialKind, initialData])

    // Derived
    const allKinds = useMemo(() => Object.keys(specs) as PrepKind[], [specs])
    const filteredKinds = useMemo(
        () => allKinds.filter(k => specs[k].label.toLowerCase().includes(search.toLowerCase())),
        [allKinds, search, specs]
    )
    const fields = KIND_FIELDS[kind]

    // Helpers
    function setVal(name: string, val: any) { setForm(prev => ({ ...prev, [name]: val })) }
    function next() { setStep(2) }
    function back() { setStep(1) }
    function submit() {
        const missing = fields.find(f => f.required && !form[f.name])
        if (missing) { alert(`Champ requis manquant : ${missing.label}`); return }
        onSave({ id: currentId ?? uid(), kind, data: form })
        onClose()
    }

    if (!open) return null

    return (
        <div className="modal-backdrop">
            <div className="modal-sheet modal-sheet--lg">
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        {isEdit ? "Éditer l’élément préparé" : step === 1 ? "Choisir un type" : "Renseigner les détails"}
                    </div>
                    <button className="icon-btn-lite" onClick={onClose}><X size={16} /></button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Étape 1 : Choix du type (création) */}
                    {!isEdit && step === 1 && (
                        <div className="vstack" style={{ gap: 12 }}>
                            <div className="field">
                                <label>Type d’élément</label>
                                <div className="input hstack" style={{ gap: 8 }}>
                                    <Search size={16} className="muted" />
                                    <input
                                        className="link-like" style={{ flex: 1 }}
                                        placeholder="Rechercher un type…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid two-col" style={{ gap: 12, marginTop: 10 }}>
                                {filteredKinds.map(k => {
                                    const active = k === kind
                                    const { Icon, label, color } = specs[k]
                                    return (
                                        <label key={k} className="card" style={{
                                            borderColor: active ? color : "var(--border)",
                                            boxShadow: active ? `0 0 0 2px ${color}22 inset` : "none",
                                            cursor: "pointer"
                                        }}>
                                            <input type="radio" name="kind" value={k} checked={active} onChange={() => setKind(k)} style={{ display: "none" }} />
                                            <div className="card-body hstack" style={{ gap: 12, alignItems: "center" }}>
                                                <span className="icon-circle-sm" style={{ borderColor: color }}>
                                                    <Icon size={16} style={{ color }} />
                                                </span>
                                                <div style={{ fontWeight: 600 }}>{label}</div>
                                            </div>
                                        </label>
                                    )
                                })}
                                {filteredKinds.length === 0 && (
                                    <div className="small muted" style={{ gridColumn: "1 / -1" }}>Aucun type trouvé.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Étape 2 : Formulaire (création ou édition) */}
                    {(isEdit || step === 2) && (
                        <div className="vstack" style={{ gap: 14 }}>
                            {/* Type en lecture seule si édition */}
                            <div className="card" style={{ borderColor: "var(--border)" }}>
                                <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                                    <div className="hstack" style={{ gap: 10 }}>
                                        <p className="small muted">Type d’élément</p>
                                        {(() => {
                                            const { Icon, label, color } = specs[kind]
                                            return (
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: `${color}22`,
                                                        color: `color-mix(in srgb, ${color}, black 30%)`,
                                                    }}
                                                >
                                                    <Icon size={14} />
                                                    {label}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                    {!isEdit && (
                                        <button className="btn outline small" onClick={back}>
                                            <ChevronLeft size={14} /> Revenir au choix du type
                                        </button>
                                    )}
                                </div>
                            </div>


                            {/* Champs dynamiques */}
                            <div className="grid two-col">
                                {fields.map(f => (
                                    <div key={f.name} className="field" style={{ gridColumn: "1 / -1" }}>
                                        <label>{f.label}</label>
                                        {f.type === "textarea" ? (
                                            <textarea
                                                className="input"
                                                style={{ minHeight: 96 }}
                                                placeholder={f.placeholder}
                                                value={form[f.name] || ""}
                                                onChange={e => setVal(f.name, e.target.value)}
                                            />
                                        ) : f.type === "select" ? (
                                            <select
                                                className="select-lite"
                                                value={form[f.name] || ""}
                                                onChange={e => setVal(f.name, e.target.value)}
                                            >
                                                <option value="">—</option>
                                                {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        ) : f.type === "chips" ? (
                                            <input
                                                className="input"
                                                placeholder={f.placeholder || "mot1, mot2, …"}
                                                value={(form[f.name]?.join?.(", ") ?? "")}
                                                onChange={e => setVal(f.name, e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                            />
                                        ) : (
                                            <input
                                                className="input"
                                                type={f.type === "date" || f.type === "time" ? f.type :
                                                    f.type === "email" ? "email" : f.type === "tel" ? "tel" :
                                                        f.type === "url" ? "url" : "text"}
                                                placeholder={f.placeholder}
                                                value={form[f.name] || ""}
                                                onChange={e => setVal(f.name, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    {!isEdit && step === 1 && (
                        <>
                            <button className="btn ghost" onClick={onClose}>Annuler</button>
                            <button className="btn primary" onClick={next}>Continuer</button>
                        </>
                    )}
                    {(isEdit || step === 2) && (
                        <>
                            <button className="btn ghost" onClick={onClose}>Annuler</button>
                            <button className="btn primary" onClick={submit}>Enregistrer</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
