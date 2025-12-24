// components/panels/DocumenterPanel.tsx
import React, { useMemo, useState } from "react";
import {
  FileText, Link as LinkIcon, Paperclip, Upload, Copy, ExternalLink, Search,
  CheckCircle2, XCircle, NotebookPen, Filter, ChevronRight, ChevronDown, ChevronUp,
  Mail, MessageSquareText, Phone, MessageSquare, Calendar, FileSignature, Scissors, Merge,
  Tag, Plus, Trash2, Edit3, Save, BookOpen, ListChecks, UserCircle2
} from "lucide-react";

/**
 * DocumenterPanel – v1 (hardcoded demo)
 * Sections :
 * 1) Ressources partagées (fichiers + liens) avec filtres simple
 * 2) Historique des échanges (extraits formatés : mail, WhatsApp, Messenger, CR) → récit continu
 * 3) Résumé & décisions (synthèse courte + checklist)
 * 4) Références croisées (lier notes/extraits ↔ individus/actes)
 * 5) À classer / À valider (boîte de tri rapide)
 *
 * Notes:
 * - Le composant reprend l’esthétique d’InteragirPanel: Section, cards, badges, actions à droite.
 * - Les actions sont mockées (alert/console), à raccorder à ton store plus tard.
 */

type Resource = {
  id: string;
  kind: "document" | "image" | "link";
  name: string;
  href?: string;
  tags?: string[];
  addedAt: string;
};

type ExtractSource = "email" | "whatsapp" | "messenger" | "sms" | "cr" | "geneanet";
type ExtractItem = {
  id: string;
  source: ExtractSource;
  title: string;
  at: string;
  author?: string;
  content: string; // extrait texte
  link?: string;   // lien vers la source si disponible
  pinned?: boolean;
  tags?: string[];
};

type CrossRef = {
  id: string;
  label: string;          // "CR Visio 15/09 – lignée maternelle"
  targetType: "individu" | "acte";
  targetLabel: string;    // "André Stanislas (1804-?)" / "Acte naissance 1804"
  note?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function DocumenterPanel({ contactId }: { contactId: string }) {
  // --- MOCK Contact (aligné InteragirPanel) ---
  const contact = {
    id: contactId,
    name: "Élise Martin",
    email: "elise.martin@example.com",
    phone: "+33 6 12 34 56 78",
  };

  // --- RESSOURCES partagées (mock) ---
  const [resources, setResources] = useState<Resource[]>([
    { id: "r1", kind: "document", name: "Testament 1821 – DERAINE.pdf", href: "#", tags: ["notariat", "DERAINE"], addedAt: "2025-09-18T20:03:00Z" },
    { id: "r2", kind: "image", name: "Portrait_ancetre_1890.jpg", href: "#", tags: ["photo"], addedAt: "2025-09-15T09:12:00Z" },
    { id: "r3", kind: "link", name: "Arbre Geneanet (branche Bernier)", href: "#", tags: ["geneanet"], addedAt: "2025-09-12T14:05:00Z" },
  ]);
  const [resFilter, setResFilter] = useState<"all" | Resource["kind"]>("all");
  const [resQuery, setResQuery] = useState("");

  const filteredResources = useMemo(() => {
    return resources
      .filter(r => (resFilter === "all" ? true : r.kind === resFilter))
      .filter(r => (resQuery ? (r.name.toLowerCase().includes(resQuery.toLowerCase()) || (r.tags || []).some(t => t.toLowerCase().includes(resQuery.toLowerCase()))) : true));
  }, [resources, resFilter, resQuery]);

  // --- HISTORIQUE des échanges (extraits) ---
  const [extracts, setExtracts] = useState<ExtractItem[]>([
    {
      id: "e1",
      source: "email",
      title: "Mail du 12/09 – prise de contact",
      at: "2025-09-12T10:22:00Z",
      author: "Élise",
      content: "Bonjour Jordan, je vous confirme avoir la photo de la maison familiale. Je vous l’enverrai ce soir.",
      link: "#",
      tags: ["photo", "maison"]
    },
    {
      id: "e2",
      source: "whatsapp",
      title: "WhatsApp 15/09 – infos cousin",
      at: "2025-09-15T18:47:00Z",
      author: "Élise",
      content: "Le cousin à Sainte-Marie s’appelle Olivier, je te donne son numéro demain.",
      tags: ["contact", "Sainte-Marie"]
    },
    {
      id: "e3",
      source: "cr",
      title: "CR Visio 17/09 – lignée maternelle",
      at: "2025-09-17T19:10:00Z",
      content: "Décisions : (1) Demander l’acte de 1856 à la mairie ; (2) Obtenir autorisation pour poster 3 photos.",
      tags: ["CR", "décisions"]
    },
    {
      id: "e4",
      source: "geneanet",
      title: "Lien Geneanet partagé",
      at: "2025-09-18T09:05:00Z",
      content: "Arbre 'Bernier – Deshaies' ajouté aux favoris.",
      link: "#",
      tags: ["geneanet"]
    },
  ]);
  const [openExtractId, setOpenExtractId] = useState<string | null>(null);

  // --- RÉSUMÉ & décisions ---
  const [summary, setSummary] = useState<string>("Au 19/09, nous avons validé la piste ‘Maison familiale à Sainte-Marie’. En attente : numéros du cousin Olivier, retour mairie acte 1856.");
  const [decisions, setDecisions] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: "d1", text: "Demander l’acte de 1856 à la mairie", done: false },
    { id: "d2", text: "Demander autorisation pour 3 photos Instagram", done: true },
  ]);

  // --- Références croisées (notes/extraits ↔ individus/actes) ---
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([
    { id: "x1", label: "CR Visio 17/09 – lignée maternelle", targetType: "individu", targetLabel: "André Stanislas (1804-?)", note: "Mention de la mère Émilie Baptiste" },
    { id: "x2", label: "Mail 12/09 – photo maison", targetType: "acte", targetLabel: "Acte de naissance 1804", note: "Contexte visuel maison familiale" },
  ]);

  // --- À classer / À valider (inbox) ---
  const [inbox, setInbox] = useState<ExtractItem[]>([
    {
      id: "i1",
      source: "messenger",
      title: "Messenger 18/09 – scan acte",
      at: "2025-09-18T21:02:00Z",
      author: "Élise",
      content: "Je te mets ci-joint le scan, c’est le registre 1804, page 32.",
      tags: ["à classer"]
    }
  ]);

  // --- Modales rapides : Ajout ressource, Coller un extrait ---
  const [showAddRes, setShowAddRes] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  function detectSourceFrom(text: string): ExtractSource {
    const t = text.toLowerCase();
    if (/from:.*@/i.test(text) || /subject:/i.test(text)) return "email";
    if (/whatsapp|🟢|^\[\d{2}\/\d{2}\/\d{4}/im.test(text)) return "whatsapp";
    if (/messenger|facebook|msgr/i.test(text)) return "messenger";
    if (/compte rendu|cr|compte-rendu/i.test(t)) return "cr";
    if (/geneanet/i.test(t)) return "geneanet";
    if (/sms|mms/i.test(t)) return "sms";
    return "cr";
  }

  function handlePasteImport() {
    if (!pasteText.trim()) return;
    const src = detectSourceFrom(pasteText);
    const title = `Extrait collé – ${src.toUpperCase()}`;
    const item: ExtractItem = {
      id: uid(),
      source: src,
      title,
      at: new Date().toISOString(),
      content: pasteText.trim(),
      tags: ["à classer"]
    };
    setInbox(prev => [item, ...prev]);
    setPasteText("");
    setShowPaste(false);
  }

  // --- Helpers UI ---
  function toggleDecision(id: string) {
    setDecisions(ds => ds.map(d => d.id === id ? { ...d, done: !d.done } : d));
  }
  function addDecision() {
    const text = prompt("Nouvelle décision :");
    if (text) setDecisions(ds => [{ id: uid(), text, done: false }, ...ds]);
  }
  function addCrossRef() {
    const label = prompt("Intitulé (note/extrait) :");
    const targetType = (prompt("Cibler 'individu' ou 'acte' :", "individu") || "individu") as CrossRef["targetType"];
    const targetLabel = prompt("Libellé cible (ex: 'André Stanislas (1804-?)') :");
    if (label && targetLabel) {
      setCrossRefs(cs => [{ id: uid(), label, targetType, targetLabel }, ...cs]);
    }
  }
  function acceptInbox(id: string) {
    const it = inbox.find(x => x.id === id);
    if (!it) return;
    // Move to extracts (validated)
    setExtracts(es => [{ ...it, tags: (it.tags || []).filter(t => t !== "à classer") }, ...es]);
    setInbox(xs => xs.filter(x => x.id !== id));
  }
  function discardInbox(id: string) {
    setInbox(xs => xs.filter(x => x.id !== id));
  }

  // HEADER
  return (
    <div className="vstack" style={{ gap: 20 }}>
      <div className="card highlight">
        <div className="card-body hstack" style={{ gap: 12, justifyContent: "space-between", alignItems: "center" }}>
          <div className="vstack" style={{ gap: 2 }}>
            <div className="small muted">Documenter pour</div>
            <h3 style={{ margin: 0 }}>{contact.name}</h3>
            <div className="hstack small muted" style={{ gap: 10 }}>
              <a className="link-like" href={`mailto:${contact.email}`}>{contact.email}</a>
              <span>•</span>
              <a className="link-like" href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</a>
            </div>
          </div>
          <div className="hstack" style={{ gap: 8, flexWrap: "wrap" as const }}>
            <button className="btn small" onClick={() => setShowAddRes(true)}><Upload size={16}/> Joindre fichier / lien</button>
            <button className="btn outline small" onClick={() => setShowPaste(true)}><Copy size={16}/> Coller un extrait</button>
            <button className="btn ghost small" onClick={() => alert("Export PDF (mock)") }><FileText size={16}/> Exporter (PDF)</button>
          </div>
        </div>
      </div>

      {/* LIGNE 1 : RESSOURCES & RÉSUMÉ */}
      <div className="hstack" style={{ gap: 14, alignItems: "stretch" }}>
        <Section title="Ressources partagées" icon={<LinkIcon size={16}/>} style={{ flex: 1 }}>
          <div className="hstack" style={{ gap: 8, flexWrap: "wrap" as const }}>
            <div className="hstack" style={{ gap: 6 }}>
              <Filter size={14}/> <span className="small muted">Type</span>
              <select className="input" value={resFilter} onChange={e => setResFilter(e.target.value as any)}>
                <option value="all">Tous</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
                <option value="link">Liens</option>
              </select>
            </div>
            <div className="hstack" style={{ gap: 6, flex: 1 }}>
              <Search size={14}/> 
              <input className="input" placeholder="Rechercher par nom ou tag…" value={resQuery} onChange={e => setResQuery(e.target.value)} style={{ width: "100%" }} />
            </div>
            <button className="btn ghost small" onClick={() => setShowAddRes(true)}><Plus size={14}/> Ajouter</button>
          </div>

          <div className="vstack" style={{ gap: 8 }}>
            {filteredResources.map(r => (
              <a key={r.id} href={r.href || "#"} className="card" style={{ textDecoration: "none" }}>
                <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                  <div className="hstack" style={{ gap: 10 }}>
                    {iconForRes(r.kind)}
                    <div className="vstack" style={{ gap: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                      <div className="small muted">{new Date(r.addedAt).toLocaleString()} {r.tags?.length ? "• " + r.tags.map(t => `#${t}`).join(" ") : ""}</div>
                    </div>
                  </div>
                  <div className="hstack" style={{ gap: 6 }}>
                    <button className="btn ghost small" title="Ouvrir"><ExternalLink size={14}/></button>
                    <button className="btn ghost small" title="Taguer" onClick={(e) => {
                      e.preventDefault();
                      const tag = prompt("Nouveau tag :");
                      if (!tag) return;
                      setResources(rs => rs.map(x => x.id === r.id ? { ...x, tags: [...(x.tags || []), tag] } : x));
                    }}><Tag size={14}/></button>
                    <button className="btn ghost small" title="Supprimer" onClick={(e) => {
                      e.preventDefault();
                      setResources(rs => rs.filter(x => x.id !== r.id));
                    }}><Trash2 size={14}/></button>
                  </div>
                </div>
              </a>
            ))}
            {filteredResources.length === 0 && <div className="small muted">Aucune ressource.</div>}
          </div>
        </Section>

        <Section title="Résumé & décisions" icon={<ListChecks size={16}/>} style={{ width: 420 }}>
          <div className="vstack" style={{ gap: 8 }}>
            <label className="small muted">Résumé court</label>
            <textarea className="input" style={{ height: 100 }} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Synthèse des échanges…" />
            <div className="vstack" style={{ gap: 6 }}>
              <div className="small muted">Décisions</div>
              {decisions.map(d => (
                <label key={d.id} className="hstack" style={{ gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={d.done} onChange={() => toggleDecision(d.id)} />
                  <span className="small" style={{ textDecoration: d.done ? "line-through" : "none" }}>{d.text}</span>
                </label>
              ))}
              <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button className="btn ghost small" onClick={addDecision}><Plus size={14}/> Ajouter</button>
                <button className="btn primary small" onClick={() => alert("Résumé enregistré (mock)") }><Save size={14}/> Enregistrer</button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* LIGNE 2 : HISTORIQUE & RÉFÉRENCES */}
      <div className="hstack" style={{ gap: 14, alignItems: "start" }}>
        <Section title="Historique des échanges" subtitle="Récit multi-sources" icon={<BookOpen size={16}/>} style={{ flex: 1 }}>
          <div className="vstack" style={{ gap: 10 }}>
            {extracts.map(x => (
              <div key={x.id} className="card">
                <div className="card-body vstack" style={{ gap: 8 }}>
                  <div className="hstack" style={{ justifyContent: "space-between" }}>
                    <div className="hstack" style={{ gap: 10, alignItems: "center" }}>
                      <span className="badge" style={{ background: badgeBg(x.source), color: badgeFg(x.source) }}>
                        {iconForSrc(x.source)} {labelForSrc(x.source)}
                      </span>
                      <div className="vstack" style={{ gap: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{x.title}</div>
                        <div className="small muted">{new Date(x.at).toLocaleString()} {x.author ? `• par ${x.author}` : ""} {x.tags?.length ? "• " + x.tags.map(t => `#${t}`).join(" ") : ""}</div>
                      </div>
                    </div>
                    <div className="hstack" style={{ gap: 6 }}>
                      {x.link && <a className="btn ghost small" href={x.link}><ExternalLink size={14}/> Ouvrir</a>}
                      <button className="btn ghost small" onClick={() => navigator.clipboard?.writeText(x.content)}><Copy size={14}/> Copier</button>
                      <button className="btn ghost small" title="Ajouter au récit fusionné" onClick={() => alert("Fusionner (mock)") }><Merge size={14}/> Fusionner</button>
                      <button className="btn ghost small" onClick={() => setOpenExtractId(openExtractId === x.id ? null : x.id)}>
                        {openExtractId === x.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </button>
                    </div>
                  </div>
                  {openExtractId === x.id && (
                    <div className="vstack" style={{ gap: 6 }}>
                      <div className="small muted">Extrait</div>
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{x.content}</pre>
                      <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
                        <button className="btn outline small" onClick={() => {
                          const tag = prompt("Ajouter un tag :");
                          if (!tag) return;
                          setExtracts(es => es.map(e => e.id === x.id ? { ...e, tags: [...(e.tags || []), tag] } : e));
                        }}><Tag size={14}/> Taguer</button>
                        <button className="btn outline small" onClick={() => alert("Éditer (mock)") }><Edit3 size={14}/> Éditer</button>
                        <button className="btn ghost small" onClick={() => setExtracts(es => es.filter(e => e.id !== x.id))}><Trash2 size={14}/> Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {extracts.length === 0 && <div className="small muted">Aucun extrait documenté.</div>}
          </div>
        </Section>

        <Section title="Références croisées" subtitle="Relier aux individus/actes" icon={<UserCircle2 size={16}/>} style={{ width: 420 }}>
          <div className="vstack" style={{ gap: 8 }}>
            {crossRefs.map(c => (
              <div key={c.id} className="card">
                <div className="card-body hstack" style={{ gap: 10, justifyContent: "space-between" }}>
                  <div className="vstack" style={{ gap: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
                    <div className="small muted">→ {c.targetType === "individu" ? "Individu" : "Acte"} : {c.targetLabel}</div>
                    {c.note && <div className="small">{c.note}</div>}
                  </div>
                  <div className="hstack" style={{ gap: 6 }}>
                    <button className="btn ghost small" onClick={() => alert("Ouvrir cible (mock)") }><ExternalLink size={14}/></button>
                    <button className="btn ghost small" onClick={() => {
                      const note = prompt("Note (optionnelle) :", c.note || "");
                      setCrossRefs(cs => cs.map(x => x.id === c.id ? { ...x, note: note || undefined } : x));
                    }}><Edit3 size={14}/></button>
                    <button className="btn ghost small" onClick={() => setCrossRefs(cs => cs.filter(x => x.id !== c.id))}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
            {crossRefs.length === 0 && <div className="small muted">Aucune référence.</div>}
            <div className="hstack" style={{ justifyContent: "flex-end" }}>
              <button className="btn outline small" onClick={addCrossRef}><Plus size={14}/> Ajouter une référence</button>
            </div>
          </div>
        </Section>
      </div>

      {/* LIGNE 3 : À CLASSER / À VALIDER */}
      <Section title="À classer / À valider" subtitle="Boîte d’entrée des collages & imports" icon={<Scissors size={16}/>}>
        <div className="vstack" style={{ gap: 10 }}>
          {inbox.map(x => (
            <div key={x.id} className="card" style={{ border: "1px solid var(--border)" }}>
              <div className="card-body vstack" style={{ gap: 8 }}>
                <div className="hstack" style={{ justifyContent: "space-between" }}>
                  <div className="hstack" style={{ gap: 10, alignItems: "center" }}>
                    <span className="badge" style={{ background: badgeBg(x.source), color: badgeFg(x.source) }}>
                      {iconForSrc(x.source)} {labelForSrc(x.source)}
                    </span>
                    <div className="vstack" style={{ gap: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{x.title}</div>
                      <div className="small muted">{new Date(x.at).toLocaleString()} {x.author ? `• par ${x.author}` : ""}</div>
                    </div>
                  </div>
                  <div className="hstack" style={{ gap: 6 }}>
                    <button className="btn ghost small" title="Copier" onClick={() => navigator.clipboard?.writeText(x.content)}><Copy size={14}/></button>
                    <button className="btn ghost small" title="Valider" onClick={() => acceptInbox(x.id)}><CheckCircle2 size={14}/></button>
                    <button className="btn ghost small" title="Rejeter" onClick={() => discardInbox(x.id)}><XCircle size={14}/></button>
                  </div>
                </div>
                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{x.content}</pre>
              </div>
            </div>
          ))}
          {inbox.length === 0 && <div className="small muted">Rien à classer.</div>}
        </div>
      </Section>

      {/* MODALES */}
      {showAddRes && (
        <Modal title="Joindre un fichier ou un lien" onClose={() => setShowAddRes(false)}>
          <div className="vstack" style={{ gap: 10 }}>
            <div className="hstack" style={{ gap: 8, flexWrap: "wrap" as const }}>
              <button className="btn small"><Paperclip size={14}/> Importer un fichier (mock)</button>
              <button className="btn outline small" onClick={() => {
                const url = prompt("URL du lien :");
                if (!url) return;
                const name = prompt("Nom d'affichage :", url);
                setResources(rs => [{ id: uid(), kind: "link", name: name || url, href: url, addedAt: new Date().toISOString() }, ...rs]);
                setShowAddRes(false);
              }}><LinkIcon size={14}/> Ajouter un lien</button>
            </div>
            <div className="small muted">Astuce : tague tes ressources pour les retrouver plus vite (ex: #DERAINE, #photo).</div>
          </div>
        </Modal>
      )}

      {showPaste && (
        <Modal title="Coller un extrait" onClose={() => setShowPaste(false)}>
          <div className="vstack" style={{ gap: 10 }}>
            <textarea
              className="input"
              placeholder="Colle ici un email, un WhatsApp, un CR, etc. Je détecte automatiquement la source."
              style={{ height: 160 }}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
            />
            <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button className="btn outline small" onClick={() => setShowPaste(false)}>Annuler</button>
              <button className="btn primary small" onClick={handlePasteImport}><Scissors size={14}/> Importer dans “À classer”</button>
            </div>
          </div>
        </Modal>
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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="card" style={{ width: 640, maxWidth: "95vw" }}>
        <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "10px 12px", background: "#f8fafc" }}>
          <h4 style={{ margin: 0 }}>{title}</h4>
          <button className="btn ghost small" onClick={onClose}><XCircle size={16}/></button>
        </div>
        <div className="card-body">
          {children}
        </div>
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0; display: grid; place-items: center;
          background: rgba(0,0,0,0.15); z-index: 50; padding: 16px;
        }
      `}</style>
    </div>
  );
}

function iconForRes(kind: Resource["kind"]) {
  switch (kind) {
    case "document": return <FileText size={16}/>;
    case "image": return <Paperclip size={16}/>;
    case "link": return <LinkIcon size={16}/>;
  }
}

function iconForSrc(src: ExtractSource) {
  switch (src) {
    case "email": return <Mail size={12}/>;
    case "whatsapp": return <MessageSquareText size={12}/>;
    case "messenger": return <MessageSquare size={12}/>;
    case "sms": return <Phone size={12}/>;
    case "cr": return <FileSignature size={12}/>;
    case "geneanet": return <LinkIcon size={12}/>;
  }
}
function labelForSrc(src: ExtractSource) {
  switch (src) {
    case "email": return "Email";
    case "whatsapp": return "WhatsApp";
    case "messenger": return "Messenger";
    case "sms": return "SMS";
    case "cr": return "CR";
    case "geneanet": return "Geneanet";
  }
}
function badgeBg(src: ExtractSource) {
  switch (src) {
    case "email": return "#3b82f622";
    case "whatsapp": return "#10b98122";
    case "messenger": return "#6366f122";
    case "sms": return "#f59e0b22";
    case "cr": return "#0ea5e922";
    case "geneanet": return "#64748b22";
  }
}
function badgeFg(src: ExtractSource) {
  switch (src) {
    case "email": return "#1d4ed8";
    case "whatsapp": return "#047857";
    case "messenger": return "#4338ca";
    case "sms": return "#b45309";
    case "cr": return "#0369a1";
    case "geneanet": return "#334155";
  }
}
