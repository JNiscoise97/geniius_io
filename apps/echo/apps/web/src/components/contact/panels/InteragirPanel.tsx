// components/panels/InteragirPanel.tsx
import React, { useMemo, useState } from "react";
import {
  Mail, Phone, MessageSquareText, Video, Clock, CheckCircle2, ExternalLink,
  FileText, ChevronRight, NotebookPen, Tag, ArrowRight, Copy, Link as LinkIcon,
  Mic, Send, Sparkles, Plus, Trash2, ChevronDown, ChevronUp
} from "lucide-react";

/**
 * InteragirPanel – v2 (hardcoded demo, UI alignée avec PreparerPanel)
 * Au premier coup d'œil :
 * 1) Créer une interaction (synchrone/asynchrone)
 * 2) Brouillons non documentés
 * 3) Sujets prêts (depuis Préparer)
 * 4) Réponses attendues
 * 5) Historique (5 derniers)
 * 6) Ressources partagées
 *
 * Deux modes d’édition :
 * - Interaction INDIRECTE (asynchrone) → éditeur à blocs (texte, modèle, sujet narratif) + Envoyer/Copier
 * - Interaction DIRECTE (synchrone) → prise de note en fil (sections, questions de Préparer auto-trackées, réponses),
 *   puis Terminer → questionnaire à chaud (fluidité, attitude, maîtrise par sujet)
 */

type InteractionType = "direct" | "indirect";
type Block =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "template"; label: string; content: string }
  | { id: string; type: "topicNarrative"; topicId: string; content: string };

type DirectEntry =
  | { id: string; kind: "section"; title: string }
  | { id: string; kind: "question"; text: string; fromPrepared?: { id: string; label: string } }
  | { id: string; kind: "answer"; text: string }
  | { id: string; kind: "note"; text: string };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function InteragirPanel({ contactId }: { contactId: string }) {
  // --- MOCK Contact ---
  const contact = {
    id: contactId,
    name: "Élise Martin",
    email: "elise.martin@example.com",
    phone: "+33 6 12 34 56 78",
  };

  // --- MOCK Historique / Attentes / Sujets prêts / Ressources ---
  const history = [
    { id: "h1", type: "email" as const, title: "Mail de prise de contact", at: "2025-09-10 09:42" },
    { id: "h2", type: "call" as const, title: "Appel – 12 min", at: "2025-09-12 14:10" },
    { id: "h3", type: "video" as const, title: "Visio – lignée maternelle", at: "2025-09-15 18:00" },
    { id: "h4", type: "meeting" as const, title: "RDV mairie Sainte-Suzanne confirmé", at: "2025-09-17 11:30" },
    { id: "h5", type: "message" as const, title: "DM Instagram – 2 photos anciennes", at: "2025-09-18 20:07" },
  ];
  const waiting = [
    { id: "w1", what: "Réponse mairie sur l'acte de 1856", since: "2025-09-12", channel: "email" },
    { id: "w2", what: "Confirmation créneau de visio", since: "2025-09-18", channel: "message" },
  ];
  const topicsReady = [
    { id: "t1", label: "Valider le lien Olive ITALIE ↔ Prosper (fratrie)", priority: "haute" as const, color: "#ef4444" },
    { id: "t2", label: "Autorisation de partager 3 photos sur Instagram", priority: "moyenne" as const, color: "#3b82f6" },
    { id: "t3", label: "Coordonnées du cousin à Sainte-Marie", priority: "basse" as const, color: "#10b981" },
  ];
  const sharedResources = [
    { id: "r1", kind: "document", name: "Testament 1821 – DERAINE.pdf", href: "#" },
    { id: "r2", kind: "photo", name: "Portrait_ancetre_vers_1890.jpg", href: "#" },
    { id: "r3", kind: "invite", name: "Invitation visio (20/09, 19:00)", href: "#" },
  ];
  const templates = [
    {
      id: "m1",
      label: "Demande d'acte (mairie)",
      text: `Bonjour,

Je me permets de vous contacter concernant l'acte de naissance de [Prénom NOM], vers [année], à [commune]. Il s'agit d'une recherche familiale. Pourriez-vous m'indiquer la procédure et les délais ?

Bien cordialement,
Jordan`,
    },
    {
      id: "m2",
      label: "Remerciements après entretien",
      text: `Bonjour [Prénom],

Merci pour votre temps et vos partages. Comme convenu, je vous renvoie un court récapitulatif. N'hésitez pas à m'envoyer les photos quand vous aurez un moment.

Belle journée,
Jordan`,
    },
  ];

  // --- STATE : interactions en brouillon (non documentées) ---
  type Draft = {
    id: string;
    type: InteractionType;
    title: string;
    createdAt: string;
    // indirect
    blocks?: Block[];
    // direct
    entries?: DirectEntry[];
    askedPreparedIds?: string[]; // marquer les questions de Préparer posées
    // fin de direct
    impressions?: {
      fluidity?: number; // 1..5
      attitude?: "indifférent" | "récalcitrant" | "prometteur";
      masteryByTopic?: Record<string, number>; // topicId → 1..5
    };
  };

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const current = useMemo(() => drafts.find(d => d.id === currentId) || null, [drafts, currentId]);

  // --- Actions globales ---
  function startInteraction(type: InteractionType) {
    const id = uid();
    const base: Draft = {
      id,
      type,
      title: type === "direct" ? "Prise de note (direct)" : "Message (indirect)",
      createdAt: new Date().toISOString(),
      blocks: type === "indirect" ? [{ id: uid(), type: "text", content: "" }] : undefined,
      entries: type === "direct" ? [{ id: uid(), kind: "section", title: "Salutations" }] : undefined,
      askedPreparedIds: type === "direct" ? [] : undefined,
    };
    setDrafts(d => [base, ...d]);
    setCurrentId(id);
  }

  function removeDraft(id: string) {
    setDrafts(d => d.filter(x => x.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  function markDocumented(id: string) {
    // Ici, on enverra vers Documenter. Pour la démo : on retire le brouillon.
    setDrafts(d => d.filter(x => x.id !== id));
    if (currentId === id) setCurrentId(null);
    alert("Brouillon envoyé vers Documenter (mock) ✔");
  }

  // --- Helpers UI ---
  const startEmail = () => (window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent("[Echo] Suite à notre échange")}`);
  const startCall = () => (window.location.href = `tel:${contact.phone.replace(/\s+/g, "")}`);

  return (
    <div className="vstack" style={{ gap: 20 }}>
      {/* HEADER aligné PreparerPanel */}
      <div className="card highlight">
        <div className="card-body hstack" style={{ gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <div className="vstack" style={{ gap: 2 }}>
            <div className="small muted">Interagir avec</div>
            <h3 style={{ margin: 0 }}>{contact.name}</h3>
            <div className="hstack small muted" style={{ gap: 10 }}>
              <a className="link-like" href={`mailto:${contact.email}`}>{contact.email}</a>
              <span>•</span>
              <a className="link-like" href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</a>
            </div>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <button className="btn primary small" onClick={startEmail}><Mail size={16}/> Email</button>
            <button className="btn outline small" onClick={startCall}><Phone size={16}/> Appel</button>
            <button className="btn ghost small"><Video size={16}/> Visio</button>
          </div>
        </div>
      </div>

      {/* CTA : Nouvelle interaction */}
      <Section title="Nouvelle interaction" icon={<Plus size={16}/>}>
        <div className="hstack" style={{ gap: 8, flexWrap: "wrap" as const }}>
          <button className="btn primary small" onClick={() => startInteraction("direct")}><Mic size={16}/> Synchrone (directe)</button>
          <button className="btn outline small" onClick={() => startInteraction("indirect")}><MessageSquareText size={16}/> Asynchrone (indirecte)</button>
        </div>
      </Section>

      {/* Brouillons non documentés */}
      <Section title="Interactions à formaliser" subtitle="brouillons non encore envoyés vers Documenter" icon={<FileText size={16}/>}>
        <div className="vstack" style={{ gap: 10 }}>
          {drafts.length === 0 && <div className="small muted">Aucun brouillon en attente.</div>}
          {drafts.map(d => (
            <div key={d.id} className="card" style={{ border: "1px solid var(--border)" }}>
              <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                <div className="vstack" style={{ gap: 4 }}>
                  <div className="hstack" style={{ gap: 8, alignItems: "center" }}>
                    <span className="badge" style={{ background: d.type === "direct" ? "#10b98122" : "#3b82f622", color: d.type === "direct" ? "#047857" : "#1d4ed8" }}>
                      {d.type === "direct" ? <Mic size={14}/> : <MessageSquareText size={14}/>} {d.type === "direct" ? "Direct" : "Indirect"}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{d.title}</div>
                  </div>
                  <div className="small muted">{new Date(d.createdAt).toLocaleString()}</div>
                </div>
                <div className="hstack" style={{ gap: 8 }}>
                  <button className={`btn small ${currentId === d.id ? "primary" : "outline"}`} onClick={() => setCurrentId(d.id)}>
                    {currentId === d.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} Ouvrir
                  </button>
                  <button className="btn ghost small" onClick={() => markDocumented(d.id)} title="Envoyer vers Documenter">
                    <ArrowRight size={14}/> Documenter
                  </button>
                  <button className="btn ghost small" onClick={() => removeDraft(d.id)}><Trash2 size={14}/> Supprimer</button>
                </div>
              </div>

              {/* Zone d’édition conditionnelle */}
              {currentId === d.id && (
                <div className="card-body">
                  {d.type === "indirect" ? (
                    <IndirectEditor
                      draft={d}
                      templates={templates}
                      topicsReady={topicsReady}
                      onChange={(blocks) => setDrafts(prev => prev.map(x => x.id === d.id ? { ...x, blocks } : x))}
                      onCopy={() => alert("Copié dans le presse-papiers (mock)")}
                      onSend={() => alert("Message envoyé (mock)")}
                    />
                  ) : (
                    <DirectEditor
                      draft={d}
                      topicsReady={topicsReady}
                      onChange={(entries, askedPreparedIds) => setDrafts(prev => prev.map(x => x.id === d.id ? { ...x, entries, askedPreparedIds } : x))}
                      onFinish={(impressions) => setDrafts(prev => prev.map(x => x.id === d.id ? { ...x, impressions } : x))}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Ligne : Sujets prêts / Réponses attendues */}
      <div className="hstack" style={{ gap: 14, alignItems: "stretch" }}>
        <Section title="Sujets à aborder (prêts)" subtitle="issus de Préparer" icon={<NotebookPen size={16}/>} style={{ flex: 1 }}>
          <div className="vstack" style={{ gap: 10 }}>
            {topicsReady.map(t => (
              <div key={t.id} className="card" style={{ border: "1px solid var(--border)" }}>
                <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                  <div className="hstack" style={{ gap: 10 }}>
                    <span className="badge" style={{ background: `${t.color}15`, color: `color-mix(in srgb, ${t.color}, black 30%)` }}>
                      <ChevronRight size={14}/> À discuter
                    </span>
                    <div className="vstack" style={{ gap: 4 }}>
                      <div style={{ fontSize: 16 }}>{t.label}</div>
                      <div className="small muted">Priorité : {t.priority}</div>
                    </div>
                  </div>
                  <button className="btn ghost small"><Sparkles size={14}/> Utiliser</button>
                </div>
              </div>
            ))}
            {topicsReady.length === 0 && <div className="small muted">Aucun sujet prêt.</div>}
          </div>
        </Section>

        <Section title="Réponses attendues" icon={<Clock size={16}/>} style={{ width: 420 }}>
          <div className="vstack" style={{ gap: 10 }}>
            {waiting.map(w => (
              <div key={w.id} className="card">
                <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                  <div className="hstack" style={{ gap: 10 }}>
                    <Clock size={16}/>
                    <div className="vstack" style={{ gap: 2 }}>
                      <div style={{ fontSize: 14 }}>{w.what}</div>
                      <div className="small muted">Depuis : {w.since} • Canal : {w.channel}</div>
                    </div>
                  </div>
                  <button className="btn ghost small" title="Marquer reçu"><CheckCircle2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Ligne : Historique / Ressources */}
      <div className="hstack" style={{ gap: 14, alignItems: "start" }}>
        <Section title="Historique d'interactions" subtitle="5 derniers" icon={<ActivityDot/>} style={{ flex: 1 }}>
          <div className="vstack" style={{ gap: 10 }}>
            {history.map(h => (
              <div key={h.id} className="card">
                <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                  <div className="hstack" style={{ gap: 10 }}>
                    <span>{iconFor(h.type)}</span>
                    <div className="vstack" style={{ gap: 2 }}>
                      <div style={{ fontSize: 14 }}>{h.title}</div>
                      <div className="small muted">{h.at}</div>
                    </div>
                  </div>
                  <button className="btn ghost small"><ExternalLink size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Ressources partagées" icon={<LinkIcon size={16}/> } style={{ width: 420 }}>
          <div className="vstack" style={{ gap: 8 }}>
            {sharedResources.map(r => (
              <a key={r.id} href={r.href} className="card" style={{ textDecoration: 'none' }}>
                <div className="card-body hstack" style={{ gap: 8 }}>
                  <FileText size={16}/>
                  <div style={{ fontSize: 14 }}>{r.name}</div>
                </div>
              </a>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ---------------- INDIRET EDITOR (blocs) ---------------- */
function IndirectEditor({
  draft, templates, topicsReady, onChange, onCopy, onSend
}: {
  draft: { blocks?: Block[] };
  templates: { id: string; label: string; text: string }[];
  topicsReady: { id: string; label: string }[];
  onChange: (blocks: Block[]) => void;
  onCopy: () => void;
  onSend: () => void;
}) {
  const blocks = draft.blocks ?? [];

  function addText() {
    onChange([...(blocks || []), { id: uid(), type: "text", content: "" }]);
  }
  function addTemplate(tid: string) {
    const t = templates.find(x => x.id === tid);
    if (!t) return;
    onChange([...(blocks || []), { id: uid(), type: "template", label: t.label, content: t.text }]);
  }
  function addTopicNarrative(topicId: string) {
    const topic = topicsReady.find(t => t.id === topicId);
    if (!topic) return;
    const narrative = `Sujet : ${topic.label}\n\nContexte & intention :\n- (à compléter)\n\nFormulation :\nBonjour …\nJe voulais aborder ${topic.label.toLowerCase()} …\n`;
    onChange([...(blocks || []), { id: uid(), type: "topicNarrative", topicId, content: narrative }]);
  }
  function updateBlock(id: string, content: string) {
    onChange((blocks || []).map(b => b.id === id ? { ...b, content } as Block : b));
  }
  function removeBlock(id: string) {
    onChange((blocks || []).filter(b => b.id !== id));
  }
  const fullText = (blocks || []).map(b => b.content).join("\n\n");

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ gap: 8, flexWrap: "wrap" as const }}>
        <button className="btn small" onClick={addText}><Plus size={14}/> Bloc texte</button>
        <TemplatePicker templates={templates} onPick={addTemplate} />
        <TopicPicker topics={topicsReady} onPick={addTopicNarrative} />
      </div>

      <div className="vstack" style={{ gap: 10 }}>
        {(blocks || []).map(b => (
          <div key={b.id} className="card">
            <div className="card-body vstack" style={{ gap: 8 }}>
              <div className="hstack" style={{ gap: 8, justifyContent: "space-between" }}>
                <div className="hstack" style={{ gap: 6 }}>
                  {b.type === "text" && <span className="badge">Texte</span>}
                  {b.type === "template" && <span className="badge"><Copy size={12}/> Modèle</span>}
                  {b.type === "topicNarrative" && <span className="badge"><NotebookPen size={12}/> Sujet</span>}
                </div>
                <button className="btn ghost small" onClick={() => removeBlock(b.id)}><Trash2 size={14}/> Supprimer</button>
              </div>
              <textarea
                className="input"
                style={{ height: 120 }}
                placeholder="Rédige ici…"
                value={b.content}
                onChange={e => updateBlock(b.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hstack" style={{ gap: 8, justifyContent: "flex-end" }}>
        <button className="btn outline small" onClick={() => { navigator.clipboard?.writeText(fullText); onCopy(); }}>
          <Copy size={14}/> Copier
        </button>
        <button className="btn primary small" onClick={onSend}><Send size={14}/> Envoyer</button>
      </div>
    </div>
  );
}

/* ---------------- DIRECT EDITOR (fil) ---------------- */
function DirectEditor({
  draft, topicsReady, onChange, onFinish
}: {
  draft: { entries?: DirectEntry[]; askedPreparedIds?: string[]; impressions?: any };
  topicsReady: { id: string; label: string }[];
  onChange: (entries: DirectEntry[], askedPreparedIds: string[]) => void;
  onFinish: (impressions: { fluidity?: number; attitude?: "indifférent" | "récalcitrant" | "prometteur"; masteryByTopic?: Record<string, number> }) => void;
}) {
  const entries = draft.entries ?? [];
  const asked = new Set(draft.askedPreparedIds ?? []);

  function addSection(title?: string) {
    onChange([...entries, { id: uid(), kind: "section", title: title || "Nouvelle section" }], [...asked]);
  }
  function addQ(text: string, prepared?: { id: string; label: string }) {
    const newAsked = new Set(asked);
    if (prepared?.id) newAsked.add(prepared.id);
    onChange([...entries, { id: uid(), kind: "question", text, fromPrepared: prepared }], [...newAsked]);
  }
  function addA(text: string) {
    onChange([...entries, { id: uid(), kind: "answer", text }], [...asked]);
  }
  function addNote(text: string) {
    onChange([...entries, { id: uid(), kind: "note", text }], [...asked]);
  }

  // Impressions à chaud
  const [showFinish, setShowFinish] = useState(false);
  const [fluidity, setFluidity] = useState<number>(3);
  const [attitude, setAttitude] = useState<"indifférent"|"récalcitrant"|"prometteur">("prometteur");
  const [mastery, setMastery] = useState<Record<string, number>>({});

  function setMasteryFor(topicId: string, v: number) {
    setMastery(m => ({ ...m, [topicId]: v }));
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      {/* Raccourcis */}
      <div className="hstack" style={{ gap: 8, flexWrap: "wrap" as const }}>
        <button className="btn small" onClick={() => addSection("Salutations")}><Sparkles size={14}/> Section</button>
        <QuickPreparedQuestion topics={topicsReady} onPick={(t) => addQ(`(Préparer) ${t.label}`, { id: t.id, label: t.label })} />
        <button className="btn outline small" onClick={() => {
          const q = prompt("Question (nouvelle) :");
          if (q) addQ(q);
        }}>+ Question</button>
        <button className="btn outline small" onClick={() => {
          const a = prompt("Réponse / point noté :");
          if (a) addA(a);
        }}>+ Réponse</button>
        <button className="btn ghost small" onClick={() => {
          const n = prompt("Note rapide :");
          if (n) addNote(n);
        }}>+ Note</button>
      </div>

      {/* Fil de discussion */}
      <div className="vstack" style={{ gap: 8 }}>
        {entries.map(e => (
          <div key={e.id} className="card">
            <div className="card-body vstack" style={{ gap: 6 }}>
              {e.kind === "section" && <div className="semibold">{e.title}</div>}
              {e.kind === "question" && (
                <div>
                  <span className="badge" style={{ marginRight: 6 }}>Question</span>
                  <span>{e.text}</span>
                  {e.fromPrepared && (
                    <span className="badge" style={{ marginLeft: 8, background: "#0ea5e922", color: "#0369a1" }}>
                      Préparer
                    </span>
                  )}
                </div>
              )}
              {e.kind === "answer" && (
                <div className="hstack" style={{ gap: 6 }}>
                  <span className="badge" style={{ background: "#10b98122", color: "#047857" }}>Réponse</span>
                  <span>{e.text}</span>
                </div>
              )}
              {e.kind === "note" && (
                <div className="hstack" style={{ gap: 6 }}>
                  <span className="badge" style={{ background: "#eab30822", color: "#a16207" }}>Note</span>
                  <span>{e.text}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && <div className="small muted">Commence avec une section, puis ajoute des questions/réponses.</div>}
      </div>

      {!showFinish ? (
        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <button className="btn primary small" onClick={() => setShowFinish(true)}>
            <ArrowRight size={14}/> Terminer la prise de note
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="card-body vstack" style={{ gap: 10 }}>
            <div className="semibold">Impressions à chaud</div>
            <div className="hstack" style={{ gap: 10, flexWrap: "wrap" as const }}>
              <label className="small muted">Fluidité</label>
              <input type="range" min={1} max={5} value={fluidity} onChange={e => setFluidity(Number(e.target.value))} />
              <span className="small">{fluidity}/5</span>
            </div>
            <div className="hstack" style={{ gap: 10, flexWrap: "wrap" as const }}>
              <label className="small muted">Attitude du contact</label>
              <select className="input" value={attitude} onChange={e => setAttitude(e.target.value as any)}>
                <option>indifférent</option>
                <option>récalcitrant</option>
                <option>prometteur</option>
              </select>
            </div>
            <div className="vstack" style={{ gap: 6 }}>
              <div className="small muted">Niveau de maîtrise par sujet (1–5)</div>
              {topicsReady.map(t => (
                <div key={t.id} className="hstack" style={{ gap: 8, alignItems: "center" }}>
                  <span className="small" style={{ width: 260 }}>{t.label}</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={mastery[t.id] ?? 3}
                    onChange={e => setMasteryFor(t.id, Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span className="small">{mastery[t.id] ?? 3}/5</span>
                </div>
              ))}
            </div>

            <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button className="btn outline small" onClick={() => setShowFinish(false)}><ChevronUp size={14}/> Revenir au fil</button>
              <button
                className="btn primary small"
                onClick={() => onFinish({ fluidity, attitude, masteryByTopic: mastery })}
              >
                <ArrowRight size={14}/> Valider l’échange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Small UI helpers ---------------- */
function Section({ title, subtitle, icon, children, style }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section className="card" style={{ ...(style || {}), border: "1px solid var(--border)" }}>
      <div className="hstack" style={{ justifyContent: "space-between", width: "100%", borderBottom: "1px solid var(--border)", background: "#f1f5f9", padding: "10px 12px" }}>
        <h4 className="hstack" style={{ gap: 8, margin: 0, alignItems: "center" }}>
          {icon} {title}
        </h4>
        {subtitle ? <span className="small muted">{subtitle}</span> : null}
      </div>
      <div className="card-body vstack" style={{ gap: 8 }}>
        {children}
      </div>
    </section>
  );
}
function ActivityDot() {
  return (
    <div className="relative" style={{ width: 16, height: 16 }}>
      <span className="absolute inset-0 rounded-full" style={{ background: "rgb(16 185 129 / 0.2)" }} />
      <span className="absolute inset-1 rounded-full" style={{ background: "rgb(16 185 129)" }} />
    </div>
  );
}
function iconFor(type: "email" | "call" | "video" | "message" | "meeting") {
  switch (type) {
    case "email": return <Mail size={16}/>;
    case "call": return <Phone size={16}/>;
    case "video": return <Video size={16}/>;
    case "message": return <MessageSquareText size={16}/>;
    case "meeting": return <Clock size={16}/>;
  }
}

/* Pickers */
function TemplatePicker({ templates, onPick }: { templates: { id: string; label: string }[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dropdown">
      <button className="btn small" onClick={() => setOpen(o => !o)}><Copy size={14}/> Modèle</button>
      {open && (
        <div className="card" style={{ position: "absolute", zIndex: 5, padding: 6 }}>
          {templates.map(t => (
            <button key={t.id} className="btn ghost small" onClick={() => { onPick(t.id); setOpen(false); }}>{t.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
function TopicPicker({ topics, onPick }: { topics: { id: string; label: string }[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dropdown">
      <button className="btn small" onClick={() => setOpen(o => !o)}><NotebookPen size={14}/> Sujet</button>
      {open && (
        <div className="card" style={{ position: "absolute", zIndex: 5, padding: 6, maxWidth: 360 }}>
          {topics.map(t => (
            <button key={t.id} className="btn ghost small" onClick={() => { onPick(t.id); setOpen(false); }}>{t.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
function QuickPreparedQuestion({ topics, onPick }: { topics: { id: string; label: string }[]; onPick: (t: {id: string; label: string}) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dropdown">
      <button className="btn small" onClick={() => setOpen(o => !o)}><NotebookPen size={14}/> Question (Préparer)</button>
      {open && (
        <div className="card" style={{ position: "absolute", zIndex: 5, padding: 6, maxWidth: 420 }}>
          {topics.map(t => (
            <button key={t.id} className="btn ghost small" onClick={() => { onPick(t); setOpen(false); }}>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
