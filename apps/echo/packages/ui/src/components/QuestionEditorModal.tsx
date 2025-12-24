// QuestionEditorModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  MessageSquareText, CheckSquare, Link as LinkIcon, Paperclip, Plus, Trash2,
  Star, Circle, ClipboardList,
  Timer, TimerReset, Hourglass,
  BookOpenText, User, MapPin, Calendar as CalendarIcon, FileText,
  Snowflake, Smile, AlertTriangle, ChevronDown
} from "lucide-react"
import type { PlannedQuestion, PlannedResource } from "./QuestionPlanner"
import { uid } from "../utils/ids"

type Emotion = "factual" | "emotional" | "delicate"
type Priority = "high" | "medium" | "low"
type Duration = "short" | "medium" | "long"
type ResponseType = "story" | "person" | "place" | "date" | "document"

/* ========== IconSelect (réutilisable) ========== */
type IconOption<T extends string> = { value: T; label: string; icon: React.ReactNode }
function useClickAway(ref: React.RefObject<HTMLElement>, cb: () => void) {
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) cb()
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [ref, cb])
}
function IconSelect<T extends string>({
  value, onChange, options, className, buttonLabel,
}: {
  value: T; onChange: (v: T) => void; options: IconOption<T>[]; className?: string; buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickAway(ref, () => setOpen(false))
  const current = options.find(o => o.value === value) ?? options[0]

  return (
    <div ref={ref} className={className} style={{ position: "relative" }}>
      <button
        type="button"
        className="select-lite hstack"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{ justifyContent: "space-between", width: "100%" }}
        title={buttonLabel}
      >
        <span className="hstack" style={{ gap: 8 }}>
          {current?.icon}
          <span>{current?.label}</span>
        </span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div role="listbox" className="menu-popover" style={{ marginTop: 6, minWidth: "100%" }}>
          {options.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className="menu-item hstack"
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <span className="hstack" style={{ gap: 8 }}>
                {opt.icon}
                <span>{opt.label}</span>
              </span>
              {opt.value === value ? <CheckSquare size={16} /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ====== Options avec icônes Lucide ====== */
const PRIORITY_OPTS: IconOption<Priority>[] = [
  { value: "high",   label: "Haute",   icon: <Star size={16} /> },
  { value: "medium", label: "Moyenne", icon: <Circle size={14} /> },
  { value: "low",    label: "Basse",   icon: <ClipboardList size={16} /> },
]
const DURATION_OPTS: IconOption<Duration>[] = [
  { value: "short",  label: "Courte",  icon: <Timer size={16} /> },
  { value: "medium", label: "Moyenne", icon: <TimerReset size={16} /> },
  { value: "long",   label: "Longue",  icon: <Hourglass size={16} /> },
]
const RESPONSE_OPTS: IconOption<ResponseType>[] = [
  { value: "story",   label: "Souvenir / récit",        icon: <BookOpenText size={16} /> },
  { value: "person",  label: "Personne à identifier",   icon: <User size={16} /> },
  { value: "place",   label: "Lieu / voisinage",        icon: <MapPin size={16} /> },
  { value: "date",    label: "Date / période",          icon: <CalendarIcon size={16} /> },
  { value: "document",label: "Document",                icon: <FileText size={16} /> },
]
const EMOTION_OPTS: IconOption<Emotion>[] = [
  { value: "factual",   label: "Factuelle",    icon: <Snowflake size={16} /> },
  { value: "emotional", label: "Émotionnelle", icon: <Smile size={16} /> },
  { value: "delicate",  label: "Délicate",     icon: <AlertTriangle size={16} /> },
]

export function QuestionEditorModal({
  initial, open, onClose, onSave,
}: {
  initial: PlannedQuestion
  open: boolean
  onClose: () => void
  onSave: (q: PlannedQuestion) => void
}) {
  if (!open) return null

  // --- state
  const [text, setText] = useState(initial.text)
  const [context, setContext] = useState(initial.context ?? "")
  const [expectedAnswer, setExpectedAnswer] = useState(initial.expectedAnswer ?? "")
  const [sensitive, setSensitive] = useState(Boolean(initial.sensitive))
  const [confidenceNeeded, setConfidenceNeeded] = useState(Boolean(initial.confidenceNeeded))
  const [emotion, setEmotion] = useState<Emotion>(initial.emotion ?? "factual")
  const [priority, setPriority] = useState<Priority>(initial.priority ?? "medium")
  const [duration, setDuration] = useState<Duration>(initial.duration ?? "short")
  const [responseType, setResponseType] = useState<ResponseType>(initial.responseType ?? "story")
  const [themes, setThemes] = useState<string[]>(initial.themes ?? [])
  const [followUp, setFollowUp] = useState(initial.followUp ?? "")
  const [mapUrl, setMapUrl] = useState(initial.mapUrl ?? "")
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl ?? "")
  const [resources, setResources] = useState<PlannedResource[]>(initial.resources ?? [])
  const [isOpenQuestion, setIsOpenQuestion] = useState(true)

  const themeInput = useMemo(() => themes.join(", "), [themes])
  function parseThemes(v: string) { setThemes(v.split(",").map(s => s.trim()).filter(Boolean)) }

  // files (mock upload)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  function pickFiles() { fileInput.current?.click() }
  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : []
    setFiles(prev => [...prev, ...list])
  }
  function removeFile(i: number) { setFiles(prev => prev.filter((_, idx) => idx !== i)) }

  function addRes(type: "link" | "file") {
    const label = window.prompt(type === "link" ? "Intitulé du lien" : "Nom du fichier")
    if (!label) return
    const url = type === "link" ? (window.prompt("URL (https://...)") || undefined) : undefined
    setResources(prev => [...prev, { id: uid(), type, label, url }])
  }
  function removeRes(id: string) { setResources(prev => prev.filter(r => r.id !== id)) }

  function save() {
    onSave({
      ...initial,
      text: text.trim(),
      context: context.trim(),
      expectedAnswer: expectedAnswer.trim(),
      sensitive,
      confidenceNeeded,
      emotion,
      priority,
      duration,
      responseType,
      themes,
      followUp: followUp.trim(),
      mapUrl: mapUrl.trim(),
      photoUrl: photoUrl.trim(),
      resources,
    })
    onClose()
  }

  return (
    <div className="form-wrap">
      {/* ========== ACCORDION 1 : Intention ========== */}
      <details open className="acc-item">
        <summary className="acc-summary">
          <div className="acc-title">But & type de question</div>
          <div className="acc-sub">Pourquoi je pose cette question et sous quelle forme obtiendrai-je la meilleure réponse ?</div>
        </summary>
        <div className="acc-body">
          <div className="segmented" role="tablist" aria-label="Type de question">
            <button
              type="button"
              className={`seg-btn ${isOpenQuestion ? "is-active" : ""}`}
              onClick={() => setIsOpenQuestion(true)}
              role="tab" aria-selected={isOpenQuestion}
            >
              <MessageSquareText strokeWidth={1.75} />
              Ouverte
            </button>
            <button
              type="button"
              className={`seg-btn ${!isOpenQuestion ? "is-active" : ""}`}
              onClick={() => setIsOpenQuestion(false)}
              role="tab" aria-selected={!isOpenQuestion}
            >
              <CheckSquare strokeWidth={1.75} />
              Fermée
            </button>
          </div>

          <div className="field-grid-2" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Priorité</label>
              <IconSelect<Priority> value={priority} onChange={setPriority} options={PRIORITY_OPTS} />
            </div>
            <div className="field">
              <label>Durée estimée</label>
              <IconSelect<Duration> value={duration} onChange={setDuration} options={DURATION_OPTS} />
            </div>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>Type de réponse attendue</label>
            <IconSelect<ResponseType> value={responseType} onChange={setResponseType} options={RESPONSE_OPTS} />
          </div>
        </div>
      </details>

      {/* ========== ACCORDION 2 : Formulation ========== */}
      <details open className="acc-item">
        <summary className="acc-summary">
          <div className="acc-title">Formulation</div>
          <div className="acc-sub">Qu’est-ce que je veux exactement demander, et sur quoi je m’appuie pour la poser ?</div>
        </summary>
        <div className="acc-body">
          <div className="field">
            <label>Question*</label>
            <textarea
              className="input"
              style={{ minHeight: 88 }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ex. Qui étaient les voisins de ta maman ?"
            />
          </div>

          <div className="accordion" style={{ marginTop: 12 }}>
            <details open>
              <summary>Contexte & hypothèse (facultatif)</summary>
              <div className="accordion-body">
                <div className="field">
                  <label>Contexte — Quels repères/indices aideront la mémoire ?</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 70 }}
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="Maison familiale, années 1940… souvenirs d’enfance…"
                  />
                </div>
                <div className="field">
                  <label>Hypothèse — Quelle réponse je pressens à confirmer ?</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 70 }}
                    value={expectedAnswer}
                    onChange={e => setExpectedAnswer(e.target.value)}
                    placeholder="Je pense que c’étaient les frères … (à confirmer)"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>
      </details>

      {/* ========== ACCORDION 3 : Sensibilité & ton ========== */}
      <details open className="acc-item">
        <summary className="acc-summary">
          <div className="acc-title">Sensibilité & ton</div>
          <div className="acc-sub">Comment l’aborder sans braquer, et dans quel climat la poser ?</div>
        </summary>
        <div className="acc-body">
          <div className="check-row">
            <label className="checkbox">
              <input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} />
              <span>Question sensible</span>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={confidenceNeeded} onChange={e => setConfidenceNeeded(e.target.checked)} />
              <span>Nécessite climat de confiance</span>
            </label>
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>Dimension émotionnelle — Quel ton choisir ?</label>
            <IconSelect<Emotion> value={emotion} onChange={setEmotion} options={EMOTION_OPTS} />
          </div>
        </div>
      </details>

      {/* ========== ACCORDION 4 : Repères & thèmes ========== */}
      <details open className="acc-item">
        <summary className="acc-summary">
          <div className="acc-title">Repères & thèmes</div>
          <div className="acc-sub">Quels axes, cartes ou visuels m’aident à orienter la mémoire ?</div>
        </summary>
        <div className="acc-body">
          <div className="field">
            <label>Thèmes (séparés par des virgules) — Quels sujets balisent la question ?</label>
            <input className="input" value={themeInput} onChange={e => parseThemes(e.target.value)} placeholder="voisinage, fratrie, migration…" />
          </div>

          <div className="field-grid-2" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Carte / plan (URL)</label>
              <input className="input" value={mapUrl} onChange={e => setMapUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="field">
              <label>Photo (URL)</label>
              <input className="input" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
      </details>

      {/* ========== ACCORDION 5 : Ressources & pièces ========== */}
      <details open className="acc-item">
        <summary className="acc-summary">
          <div className="acc-title">Ressources & pièces</div>
          <div className="acc-sub">Qu’est-ce qui illustre, étaye ou documente la question ?</div>
        </summary>
        <div className="acc-body">
          <div className="upload-row">
            <button className="btn primary" onClick={() => addRes("link")}>
              <Plus size={16} /> Ajouter un lien
            </button>
            <button className="btn outline" onClick={pickFiles}>
              <Paperclip size={16} /> Joindre des fichiers
            </button>
            <input ref={fileInput} type="file" multiple hidden onChange={onFilesChosen} />
          </div>

          <div className="upload-box" onClick={pickFiles}>
            <div className="muted">Dépose tes fichiers ici, ou clique pour sélectionner.</div>
          </div>

          {resources.length > 0 && (
            <div className="table-lite" style={{ marginTop: 12 }}>
              <div className="table-row head">
                <div>Type</div><div>Libellé</div><div>URL</div><div></div>
              </div>
              {resources.map(r => (
                <div className="table-row" key={r.id}>
                  <div>{r.type === "link" ? "Lien" : "Fichier"}</div>
                  <div>{r.label}</div>
                  <div>{r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="link-like">{r.url}</a> : "—"}</div>
                  <div style={{textAlign:"right"}}>
                    <button className="icon-btn-lite danger" onClick={() => removeRes(r.id)}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="table-lite" style={{ marginTop: 12 }}>
              <div className="table-row head">
                <div>Fichier</div><div>Taille</div><div></div>
              </div>
              {files.map((f, i) => (
                <div className="table-row" key={i}>
                  <div>{f.name}</div>
                  <div className="muted">{Math.round(f.size/1024)} Ko</div>
                  <div style={{textAlign:"right"}}>
                    <button className="icon-btn-lite" onClick={() => removeFile(i)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      {/* ========== ACCORDION 6 : Suivi ========== */}
      <details open className="acc-item">
        <summary className="acc-summary">
          <div className="acc-title">Plan de relance</div>
          <div className="acc-sub">Si l’échange n’aboutit pas, comment je relance et que veux-je clarifier ensuite ?</div>
        </summary>
        <div className="acc-body">
          <div className="field">
            <label>Follow-up prévu</label>
            <input
              className="input"
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              placeholder="Ex. Revenir sur ses amis / photos si réponse partielle"
            />
          </div>
        </div>
      </details>

      {/* Footer */}
      <div className="form-footer">
        <button className="btn ghost" onClick={onClose}>Annuler</button>
        <button className="btn primary" onClick={save}>Enregistrer</button>
      </div>
    </div>
  )
}
