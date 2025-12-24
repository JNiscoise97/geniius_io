// components/panels/PreparerPanel.tsx
import React, { useState } from "react";
import {
  Plus, History, CalendarClock, ChevronDown, ChevronUp, X,
  HelpCircle, Info, CheckCircle2, FileText, MessageSquareText,
  UserPlus, ShieldCheck, PartyPopper, Phone, Calendar, Handshake,
  Upload, Images, Repeat, Sparkles, Pencil, Link as LinkIcon, Paperclip, MapPin, Clock as ClockIcon, Globe
} from "lucide-react";
import { SujetEditorModal } from "../modals/SujetEditorModal";
import type { Sujet } from "../modals/SujetEditorModal";
import * as Accordion from "@radix-ui/react-accordion";
import { KindEditorModal } from "../modals/KindEditorModal";
import type { PrepItem, PrepKind } from "../modals/KindEditorModal";
import { uid } from "@echo/ui/utils/ids";

/* ---------- Types / Specs ---------- */

type Importance = "critique" | "elevee" | "moyenne" | "faible";
type Priorite   = "haute" | "moyenne" | "basse";

type ChangeLog = { at: string; by: string; action: string };
type Topic = Sujet & {
  preparedItems: PrepItem[];
  history: ChangeLog[];
};
const nowISO = () => new Date().toISOString();

const IMPORTANCE_STYLES: Record<Importance, { label: string; bg: string; bd: string; fg: string }> = {
  critique: { label: "Importance : Critique", bg: "#fee2e2", bd: "#fecaca", fg: "#b91c1c" },
  elevee:   { label: "Importance : Élevée",  bg: "#ffedd5", bd: "#fed7aa", fg: "#9a3412" },
  moyenne:  { label: "Importance : Moyenne", bg: "#fef9c3", bd: "#fde68a", fg: "#854d0e" },
  faible:   { label: "Importance : Faible",  bg: "#dcfce7", bd: "#bbf7d0", fg: "#166534" },
};

const PRIORITE_STYLES: Record<Priorite, { label: string; bg: string; bd: string; fg: string }> = {
  haute:   { label: "Priorité : Haute",   bg: "#e0e7ff", bd: "#c7d2fe", fg: "#3730a3" },
  moyenne: { label: "Priorité : Moyenne", bg: "#e5e7eb", bd: "#d1d5db", fg: "#374151" },
  basse:   { label: "Priorité : Basse",   bg: "#f1f5f9", bd: "#e2e8f0", fg: "#334155" },
};

function Badge({ text, bg, bd, fg }: { text: string; bg: string; bd: string; fg: string }) {
  return (
    <span className="pill-lite" style={{ background: bg, borderColor: bd, color: fg, fontSize: 12, padding: "2px 8px" }}>
      {text}
    </span>
  );
}

/* ---------- Specs d'icônes par kind (pour UI) ---------- */
const KIND_SPECS: Record<PrepKind, { label: string; Icon: React.ComponentType<any>; color: string }> = {
  question:            { label: "Question",           Icon: HelpCircle,        color: "#3b82f6" },
  clarification:       { label: "Clarification",      Icon: Info,              color: "#06b6d4" },
  hypothesis_check:    { label: "Hypothèse",          Icon: CheckCircle2,      color: "#a855f7" },
  request_document:    { label: "Doc demandé",        Icon: FileText,          color: "#0ea5e9" },
  request_testimony:   { label: "Témoignage",         Icon: MessageSquareText, color: "#f59e0b" },
  request_contact:     { label: "Contact",            Icon: UserPlus,          color: "#22c55e" },
  request_permission:  { label: "Autorisation",       Icon: ShieldCheck,       color: "#e879f9" },
  invite_event:        { label: "Invit. évènement",   Icon: PartyPopper,       color: "#ef4444" },
  invite_call:         { label: "Invit. appel",       Icon: Phone,             color: "#16a34a" },
  invite_meeting:      { label: "Invit. rencontre",   Icon: Calendar,          color: "#0284c7" },
  invite_collaboration:{ label: "Collaboration",       Icon: Handshake,         color: "#e11d48" },
  share_document:      { label: "Partage doc",        Icon: FileText,          color: "#2563eb" },
  share_info:          { label: "Partage info",       Icon: Info,              color: "#0891b2" },
  share_update:        { label: "Mise à jour",        Icon: Upload,            color: "#16a34a" },
  share_media:         { label: "Partage média",      Icon: Images,            color: "#f97316" },
  plan_meeting:        { label: "Plan RDV",           Icon: Calendar,          color: "#0ea5e9" },
  plan_event:          { label: "Plan évènement",     Icon: PartyPopper,       color: "#f43f5e" },
  coordination:        { label: "Coordination",       Icon: Handshake,         color: "#22c55e" },
  follow_up:           { label: "Relance",            Icon: Repeat,            color: "#7c3aed" },
  reminder:            { label: "Rappel",             Icon: Repeat,            color: "#334155" },
  thanks:              { label: "Remerciements",      Icon: Sparkles,          color: "#0ea5e9" },
};

/* ---------- Champs par type (affichage enrichi) ---------- */
type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "chips" | "date" | "time" | "email" | "tel" | "url";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
};

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
    { name: "themes", label: "Thèmes", type: "chips", placeholder: "voisinage, fratrie…" },
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
};

/* ---------- Helpers ---------- */
function summarizeItem(item: PrepItem): { title: string; subtitle?: string } {
  const d = item.data || {};
  switch (item.kind) {
    case "question":            return { title: d.title || "(Question sans titre)", subtitle: d.context };
    case "clarification":       return { title: d.title || "(Clarification)" };
    case "hypothesis_check":    return { title: d.statement || "(Hypothèse)" };
    case "request_document":    return { title: d.doc || "(Document)", subtitle: d.repository };
    case "request_testimony":   return { title: d.topic || "(Témoignage)", subtitle: d.person };
    case "request_contact":     return { title: d.who || "(Contact)", subtitle: d.why };
    case "request_permission":  return { title: d.what || "(Autorisation)", subtitle: d.to };
    case "invite_event":
    case "invite_meeting":      return { title: d.title || "(Invitation)", subtitle: [d.date, d.place].filter(Boolean).join(" • ") };
    case "invite_call":         return { title: d.title || "(Appel)", subtitle: [d.date, d.time].filter(Boolean).join(" • ") };
    case "invite_collaboration":return { title: d.title || "(Collaboration)", subtitle: d.scope };
    case "share_document":      return { title: d.label || "(Document)", subtitle: d.url };
    case "share_info":
    case "share_update":        return { title: d.title || "(Info)" };
    case "share_media":         return { title: d.label || "(Média)", subtitle: d.url };
    case "plan_meeting":
    case "plan_event":          return { title: d.title || "(Planification)", subtitle: d.place || d.date };
    case "coordination":        return { title: d.topic || "(Coordination)" };
    case "follow_up":
    case "reminder":            return { title: d.title || "(Rappel/Relance)", subtitle: d.when };
    case "thanks":              return { title: d.to ? `Merci à ${d.to}` : "(Remerciements)", subtitle: d.message };
    default:                    return { title: "(Élément)" };
  }
}

function formatDateNoSeconds(ts: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(ts));
  } catch { return new Date(ts).toLocaleString(); }
}

function formatDate(ts?: string) {
  if (!ts) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date(ts));
  } catch { return ts; }
}
function formatTime(t?: string) {
  if (!t) return "";
  try {
    if (/^\d{2}:\d{2}$/.test(t)) return t;
    return new Intl.DateTimeFormat(undefined, { hour:"2-digit", minute:"2-digit" }).format(new Date(`1970-01-01T${t}`));
  } catch { return t; }
}

/* ---------- Composant principal ---------- */

export default function PreparerPanel({ contactId }: { contactId: string }) {
  const [topics, setTopics] = useState<Topic[]>([
    {
      id: uid(),
      titre: "Échanges avec la cousine (voisinage de sa maman)",
      objectif: "Préparer les questions sur le voisinage et identifier des témoins.",
      contexte: "Maison familiale à St-Romain, années 1940-50. Photos dans l’album bleu.",
      hypothese: "Les frères Durand étaient les voisins directs de sa mère.",
      ressources: [
        { id: uid(), type: "link", label: "Plan cadastral 1950", url: "https://exemple.test/cadastre" }
      ],
      themes: ["voisinage", "fratrie", "témoignages"],
      createdAt: "2025-09-10T09:30:00Z",
      preparedItems: [
        { id: uid(), kind: "question", data: { title: "Qui étaient les voisins de ta maman ?", context: "Maison de St-Romain", responseType: "place", themes: "voisinage, fratrie" } },
        { id: uid(), kind: "request_testimony", data: { topic: "Souvenirs du quartier", person: "Cousine L.", questions: "Ambiance ? Noms des voisins ? Anecdotes ?" } },
        { id: uid(), kind: "request_document", data: { doc: "Acte naissance 1856", repository: "Mairie de Sainte-Suzanne", deadline: "2025-09-22" } },
        { id: uid(), kind: "invite_meeting", data: { title: "Rencontre à St-Romain", date: "2025-09-28", time: "15:00", place: "Maison familiale", agenda: "Parcourir l'album bleu" } },
      ],
      history: [
        { at: "2025-09-10T09:30:00Z", by: "Nisco", action: "Création du sujet" },
        { at: "2025-09-11T08:00:00Z", by: "Nisco", action: "Ajout d'une question" },
      ],
      importance: "elevee",
      priorite: "haute",
    },
  ]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitial, setEditorInitial] = useState<Sujet | null>(null);

  // Kind editor modal
  const [kindModalOpen, setKindModalOpen] = useState(false);
  const [kindTopicId, setKindTopicId] = useState<string | null>(null);
  const [kindInitialId, setKindInitialId] = useState<string | undefined>(undefined);
  const [kindInitialKind, setKindInitialKind] = useState<PrepKind | undefined>(undefined);
  const [kindInitialData, setKindInitialData] = useState<Record<string, any> | undefined>(undefined);

  // Historique per-topic
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});

  function openCreate() {
    setEditorInitial({
      id: uid(),
      titre: "",
      objectif: "",
      contexte: "",
      hypothese: "",
      ressources: [],
      themes: [],
      createdAt: nowISO(),
      importance: "moyenne",
      priorite: "moyenne",
    });
    setEditorOpen(true);
  }

  function onSaveSujet(s: Sujet) {
    setTopics(prev => {
      const exists = prev.some(t => t.id === s.id);
      if (exists) {
        return prev.map(t => t.id === s.id ? {
          ...t, ...s,
          history: [...t.history, { at: nowISO(), by: "Nisco", action: "Modification du sujet" }],
        } : t);
      } else {
        const t: Topic = {
          ...s,
          preparedItems: [],
          history: [{ at: nowISO(), by: "Nisco", action: "Création du sujet" }],
        };
        return [t, ...prev];
      }
    });
  }

  function openKindModal(topicId: string) {
    setKindTopicId(topicId);
    setKindInitialId(undefined);
    setKindInitialKind(undefined);
    setKindInitialData(undefined);
    setKindModalOpen(true);
  }

  function editItem(topicId: string, item: PrepItem) {
    setKindTopicId(topicId);
    setKindInitialId(item.id);
    setKindInitialKind(item.kind);
    setKindInitialData(item.data);
    setKindModalOpen(true);
  }

  function onSaveKind(item: PrepItem) {
    if (!kindTopicId) return;
    setTopics(prev => prev.map(t => {
      if (t.id !== kindTopicId) return t;
      const exists = t.preparedItems.some(pi => pi.id === item.id);
      const preparedItems = exists
        ? t.preparedItems.map(pi => pi.id === item.id ? item : pi)
        : [item, ...t.preparedItems];
      return {
        ...t,
        preparedItems,
        history: [...t.history, { at: nowISO(), by: "Nisco", action: exists ? `Édition d’un ${KIND_SPECS[item.kind].label}` : `Ajout : ${KIND_SPECS[item.kind].label}` }],
      };
    }));
  }

  function removeItem(topicId: string, itemId: string) {
    setTopics(prev => prev.map(t => {
      if (t.id !== topicId) return t;
      const item = t.preparedItems.find(pi => pi.id === itemId);
      return {
        ...t,
        preparedItems: t.preparedItems.filter(pi => pi.id !== itemId),
        history: item ? [...t.history, { at: nowISO(), by: "Nisco", action: `Suppression : ${KIND_SPECS[item.kind].label}` }] : t.history,
      };
    }));
  }

  return (
    <div className="vstack" style={{ gap: 20 }}>
      {/* Section 1 : CTA créer */}
      <div className="card highlight">
        <div className="card-body vstack" style={{ gap: 8 }}>
          <div className="hstack" style={{ gap: 8, justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Créer un sujet</h3>
            <button className="btn primary small" onClick={openCreate}>
              <Plus size={16} />
              Créer
            </button>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            Prépare ce que tu veux aborder (questions, demandes, invitations…) pour un échange clair et efficace.
          </p>
        </div>
      </div>

      {/* Section 2 : Liste des sujets (accordion simple et rétractable) */}
      <div className="vstack" style={{ gap: 14 }}>
        {topics.map(topic => {
          const imp = IMPORTANCE_STYLES[topic.importance ?? "moyenne"];
          const pri = PRIORITE_STYLES[topic.priorite ?? "moyenne"];

          return (
            <Accordion.Root key={topic.id} type="single" collapsible defaultValue="open">
              <Accordion.Item value="open" className="card" style={{ border: "1px solid var(--border)" }}>
                {/* Barre titre = Trigger + actions à droite */}
                <div className="hstack" style={{ justifyContent: "space-between", width: "100%", borderBottom: "1px solid var(--border)", background: "#f1f5f9", padding: "10px 12px" }}>
                  <Accordion.Header asChild>
                    <Accordion.Trigger className="acc-trigger" style={{ flex: 1 }}>
                      <div className="hstack" style={{ gap: 12, justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                        <div className="vstack" style={{ gap: 4, textAlign: "left" }}>
                          <h4 style={{ margin: 0 }}>{topic.titre || "(Sans titre)"}</h4>
                          <div className="hstack small" style={{ gap: 8, flexWrap: "wrap" as const }}>
                            <span className="hstack muted" style={{ gap: 6 }}>
                              <CalendarClock size={14} />
                              {formatDateNoSeconds(topic.createdAt)}
                            </span>
                            <Badge text={imp.label} bg={imp.bg} bd={imp.bd} fg={imp.fg} />
                            <Badge text={pri.label} bg={pri.bg} bd={pri.bd} fg={pri.fg} />
                            {topic.themes?.length ? (
                              <span className="pill-lite" style={{ fontSize: 12 }}>
                                Thèmes : {topic.themes.join(", ")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <span className="chevron">
                          <ChevronDown className="chevron-down" size={18} />
                          <ChevronUp className="chevron-up" size={18} />
                        </span>
                      </div>
                    </Accordion.Trigger>
                  </Accordion.Header>

                  {/* Actions hors Trigger */}
                  <div className="hstack" style={{ gap: 6 }}>
                    <button
                      className="btn outline small"
                      onClick={() => { setEditorInitial(topic); setEditorOpen(true); }}
                      title="Modifier le sujet"
                    >
                      <Pencil size={14} /> Modifier
                    </button>
                    <button
                      className="btn ghost small"
                      onClick={() => setShowHistory(o => ({ ...o, [topic.id]: !o[topic.id] }))}
                      title="Historique"
                    >
                      <History size={14} />
                      {showHistory[topic.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                <Accordion.Content className="acc-panel">
                  {/* Historique (toggle) */}
                  {showHistory[topic.id] && (
                    <div className="vstack small" style={{ gap: 6, margin: "10px 12px 0" }}>
                      {topic.history.map((h, i) => (
                        <div key={i} className="hstack" style={{ gap: 8 }}>
                          <span className="muted">{formatDateNoSeconds(h.at)}</span>
                          <span>— {h.action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Corps : style “label muted + texte dessous” */}
                  <div className="card-body vstack" style={{ gap: 14 }}>
                    {topic.objectif ? (
                      <LabeledBlock label="Objectif">
                        {topic.objectif}
                      </LabeledBlock>
                    ) : null}

                    {topic.contexte ? (
                      <LabeledBlock label="Contexte">
                        <div style={{ whiteSpace: "pre-wrap" }}>{topic.contexte}</div>
                      </LabeledBlock>
                    ) : null}

                    {topic.hypothese ? (
                      <LabeledBlock label="Hypothèse">
                        <div style={{ whiteSpace: "pre-wrap" }}>{topic.hypothese}</div>
                      </LabeledBlock>
                    ) : null}

                    {/* Éléments préparés → cartes enrichies */}
                    <div className="vstack" style={{ gap: 8 }}>
                      <div className="small muted">Éléments préparés</div>

                      {topic.preparedItems.length === 0 && (
                        <div className="small muted">Aucun élément pour l’instant.</div>
                      )}

                      {topic.preparedItems.map(item => (
                        <PreparedItemCard
                          key={item.id}
                          item={item}
                          onEdit={() => editItem(topic.id, item)}
                          onRemove={() => removeItem(topic.id, item.id)}
                        />
                      ))}

                      <div>
                        <button className="btn secondary small" onClick={() => openKindModal(topic.id)}>
                          <Plus size={14} /> Ajouter un élément
                        </button>
                      </div>
                    </div>

                    {topic.ressources?.length ? (
                      <LabeledBlock label="Ressources">
                        <div className="vstack" style={{ gap: 6 }}>
                          {topic.ressources.map((r) => (
                            <div key={r.id} className="hstack small" style={{ gap: 8 }}>
                              {r.type === "link" ? <LinkIcon size={14} /> : <Paperclip size={14} />}
                              {r.url ? (
                                <a className="link-like" href={r.url} target="_blank" rel="noreferrer">
                                  {r.label}
                                </a>
                              ) : (
                                <span>{r.label}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </LabeledBlock>
                    ) : null}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          );
        })}
      </div>

      {/* Modals */}
      {editorInitial && (
        <SujetEditorModal
          initial={editorInitial}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={onSaveSujet}
        />
      )}

      <KindEditorModal
        open={kindModalOpen}
        specs={KIND_SPECS}
        initialId={kindInitialId}
        initialKind={kindInitialKind}
        initialData={kindInitialData}
        onClose={() => setKindModalOpen(false)}
        onSave={onSaveKind}
      />
    </div>
  );
}

/* ---------- UI helpers ---------- */

function LabeledBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="vstack" style={{ gap: 4 }}>
      <div className="small muted">{label}</div>
      <div>{children}</div>
    </div>
  );
}

/** Carte d’un élément préparé — sans sous-titre, détails en pile sûre (pas de grille) */
function PreparedItemCard({
  item, onEdit, onRemove
}: {
  item: PrepItem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const spec = KIND_SPECS[item.kind];
  const { title /*, subtitle*/ } = summarizeItem(item); // subtitle volontairement ignoré
  const data = item.data || {};

  // Champs primaires déjà utilisés comme titre → on les masque dans le détail
  const PRIMARY_FIELD_BY_KIND: Partial<Record<PrepKind, string>> = {
    question: "title",
    clarification: "title",
    hypothesis_check: "statement",
    request_document: "doc",
    request_testimony: "topic",
    request_contact: "who",
    request_permission: "what",
    invite_event: "title",
    invite_call: "title",
    invite_meeting: "title",
    invite_collaboration: "title",
    share_document: "label",
    share_info: "title",
    share_update: "title",
    share_media: "label",
    plan_meeting: "title",
    plan_event: "title",
    coordination: "topic",
    follow_up: "title",
    reminder: "title",
    thanks: "to",
  };

  const fields = KIND_FIELDS[item.kind] || [];
  const primary = PRIMARY_FIELD_BY_KIND[item.kind];

  // Ligne méta compacte (date/heure/lieu/url si présents)
  const metaDate = data.date ? formatDate(data.date) : "";
  const metaTime = data.time ? formatTime(data.time) : "";
  const metaPlace = data.place || "";
  const metaUrl = data.url || (typeof data.repository === "string" && data.repository.startsWith("http") ? data.repository : "");

  // Détails : tous les champs renseignés (sauf le champ primaire déjà en titre)
  const detailFields = fields
    .filter(f => f.name !== primary)
    .filter(f => {
      const v = data[f.name];
      return v !== undefined && v !== null && String(v).trim() !== "";
    });

  function renderValue(f: FieldSpec, v: any) {
    if (f.type === "chips") {
      const items = Array.isArray(v) ? v : String(v).split(",").map((s: string) => s.trim()).filter(Boolean);
      if (items.length === 0) return null;
      return (
        <div className="hstack" style={{ gap: 6, flexWrap: "wrap" as const }}>
          {items.map((t: string, i: number) => (
            <span key={i} className="pill-lite" style={{ fontSize: 11 }}>{t}</span>
          ))}
        </div>
      );
    }
    if (f.type === "select" && f.options) {
      const hit = f.options.find(o => o.value === v);
      return <span>{hit?.label ?? String(v)}</span>;
    }
    if (f.type === "url") {
      return <a className="link-like" href={String(v)} target="_blank" rel="noreferrer">{String(v)}</a>;
    }
    if (f.type === "email") {
      return <a className="link-like" href={`mailto:${String(v)}`}>{String(v)}</a>;
    }
    if (f.type === "tel") {
      return <a className="link-like" href={`tel:${String(v).replace(/\s+/g, "")}`}>{String(v)}</a>;
    }
    if (f.type === "date") {
      return <span>{formatDate(String(v))}</span>;
    }
    if (f.type === "time") {
      return <span>{formatTime(String(v))}</span>;
    }
    return <span style={{ whiteSpace: "pre-wrap" }}>{String(v)}</span>;
  }

  return (
    <div className="prepared-card">
      <div className="card-body">
        {/* Titre */}
        <div className="hstack" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="vstack" style={{ gap: 8, flex: 1 }}>
            <div className="hstack" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
              <span className="badge" style={{ background: `${spec.color}15`, color: `color-mix(in srgb, ${spec.color}, black 30%)` }}>
                <spec.Icon size={14} />
                {spec.label}
              </span>
              <div style={{ fontSize: 16 }}>{title}</div>
            </div>

            {/* Ligne méta (si applicable) */}
            {(metaDate || metaTime || metaPlace || metaUrl) && (
              <div className="hstack small muted" style={{ gap: 10, flexWrap: "wrap" as const }}>
                {metaDate && (<span className="hstack" style={{ gap: 6 }}><Calendar size={14}/>{metaDate}</span>)}
                {metaTime && (<span className="hstack" style={{ gap: 6 }}><ClockIcon size={14}/>{metaTime}</span>)}
                {metaPlace && (<span className="hstack" style={{ gap: 6 }}><MapPin size={14}/>{metaPlace}</span>)}
                {metaUrl && (
                  <span className="hstack" style={{ gap: 6 }}>
                    <Globe size={14}/>
                    <a className="link-like" href={metaUrl} target="_blank" rel="noreferrer">{metaUrl}</a>
                  </span>
                )}
              </div>
            )}

            {/* Détails en pile (pas de grille) */}
            {detailFields.length > 0 && (
              <div className="vstack" style={{ gap: 10 }}>
                {detailFields.map(f => (
                  <div key={f.name} className="vstack" style={{ gap: 4 }}>
                    <div className="small muted">{f.label}</div>
                    <div>{renderValue(f, data[f.name])}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="hstack" style={{ gap: 6 }}>
            <button className="btn outline small" onClick={onEdit}>
              <Pencil size={14} /> Éditer
            </button>
            <button className="btn ghost small" onClick={onRemove}>
              <X size={14} /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
