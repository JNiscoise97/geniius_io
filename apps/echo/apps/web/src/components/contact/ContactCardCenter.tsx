// ContactCardCenter.tsx

import {
  NotebookPen,
  MessageSquareMore,
  StickyNote,
  AlarmClock,
  Calendar,
  Activity,
  Upload,
  Download,
  Paperclip,
  Plus,
  Mail,
  Phone,
  CalendarCheck,
  Save,
  Repeat,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import PreparerPanel from "./panels/PreparerPanel";
import InteragirPanel from "./panels/InteragirPanel";
import DocumenterPanel from "./panels/DocumenterPanel";

type MidTab =
  | "preparer"
  | "interagir"
  | "documenter"
  | "relancer"
  | "Notes"
  | "Activity";

export function ContactCardCenter({ upper, contactId }: { upper: string; contactId: string }) {
  const [mid, setMid] = useState<MidTab>("preparer");
  const [search, setSearch] = useState("");

  return (
    <div className="grid" style={{ alignContent: "start" }}>
      <div className="card">
        <div className="card-body">
          <input
            className="input"
            placeholder="Rechercher activités, notes, e-mails…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Onglets */}
          <div className="tabs-lite" role="tablist" aria-label="Tabs">
            <Tab
              label="Préparer"
              icon={<NotebookPen size={22} strokeWidth={1.75} />}
              active={mid === "preparer"}
              onClick={() => setMid("preparer")}
            />
            <Tab
              label="Interagir"
              icon={<MessageSquareMore size={22} strokeWidth={1.75} />}
              active={mid === "interagir"}
              onClick={() => setMid("interagir")}
            />
            <Tab
              label="Documenter"
              icon={<StickyNote size={22} strokeWidth={1.75} />}
              active={mid === "documenter"}
              onClick={() => setMid("documenter")}
            />
            <Tab
              label="Relancer"
              icon={<AlarmClock size={22} strokeWidth={1.75} />}
              active={mid === "relancer"}
              onClick={() => setMid("relancer")}
            />

            <Tab
              label="Notes"
              icon={<StickyNote size={22} strokeWidth={1.75} />}
              active={mid === "Notes"}
              onClick={() => setMid("Notes")}
            />
          
            <Tab
              label="Activity"
              icon={<Activity size={22} strokeWidth={1.75} />}
              active={mid === "Activity"}
              onClick={() => setMid("Activity")}
            />
          </div>

          {/* Contenu selon l’onglet */}
          <div style={{ marginTop: 12 }}>
            {mid === "preparer" && <PreparerPanel contactId={contactId}  />}
            {mid === "interagir" && <InteragirPanel contactId={contactId} />}
            {mid === "documenter" && <DocumenterPanel contactId={contactId} />}
            {mid === "relancer" && <RelancerPanel />}

            {mid === "Notes" && <NotesComposer />}
            {mid === "Activity" && <Placeholder title="Activity timeline" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ——— Onglets cycle de vie ——— */


function RelancerPanel() {
  return (
    <div className="vstack" style={{ gap: 12 }}>
      {/* Paramètres de relance */}
      <div className="card">
        <div className="card-header">Plan de relance</div>
        <div className="card-body vstack" style={{ gap: 8 }}>
          <div className="hstack" style={{ gap: 8 }}>
            <select className="input" style={{ width: 200 }}>
              <option>Fréquence mensuelle</option>
              <option>Fréquence bimensuelle</option>
              <option>Fréquence trimestrielle</option>
            </select>
            <button className="btn">
              <Repeat size={16} style={{ marginRight: 6 }} />
              Programmer
            </button>
          </div>
          <div className="small muted">
            Astuce : la fréquence auto crée les prochaines tâches de suivi.
          </div>
        </div>
      </div>

      {/* Tâches & rappels */}
      <div className="card">
        <div className="card-header">Tâches & rappels</div>
        <div className="card-body vstack" style={{ gap: 10 }}>
          <TaskItem title="Relancer si pas de réponse" due="20 sept. 2025" />
          <TaskItem title="Envoyer récap après appel" due="16 sept. 2025" />
          <TaskItem title="Préparer questions pour le RDV" due="30 sept. 2025" />
        </div>
      </div>
    </div>
  );
}

/* ——— Onglets existants (Notes / Activity) ——— */

function NotesComposer() {
  const [title, setTitle] = useState("Summary Meeting 12 Jul, 2024");
  const [content, setContent] = useState("This is ");

  return (
    <div className="card" style={{ borderColor: "var(--border)" }}>
      <div className="card-body">
        <div className="small muted" style={{ marginBottom: 6 }}>
          Add new note
        </div>
        <input
          className="input"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="toolbar" style={{ marginTop: 8 }}>
          <button title="Bold">B</button>
          <button title="Italic">I</button>
          <button title="Underline">U</button>
          <button title="List">•</button>
          <button title="Link">🔗</button>
          <div style={{ flex: 1 }} />
          <select className="input" style={{ width: 220, height: 32, padding: "0 8px" }}>
            <option>Associated with 3 records</option>
          </select>
          <button className="btn">Add note</button>
        </div>
        <textarea
          className="input"
          style={{ minHeight: 120, marginTop: 8 }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="card">
      <div className="card-body small muted">({title})</div>
    </div>
  );
}

/* ——— Petits composants ——— */

function Tab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={"tab-lite" + (active ? " active" : "")} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function InteractionItem({ type, title }: { type: string; title: string }) {
  return (
    <div className="hstack small" style={{ justifyContent: "space-between" }}>
      <div>
        <span className="badge" style={{ marginRight: 8 }}>
          {type}
        </span>
        {title}
      </div>
      <button className="btn ghost small">Voir</button>
    </div>
  );
}

function CRCard({
  kind,
  date,
  title,
  excerpt,
}: {
  kind: string;
  date: string;
  title: string;
  excerpt: string;
}) {
  return (
    <div className="card">
      <div className="card-body vstack" style={{ gap: 6 }}>
        <div className="hstack" style={{ justifyContent: "space-between" }}>
          <div className="hstack" style={{ gap: 8 }}>
            <span className="badge">{kind}</span>
            <strong>{title}</strong>
          </div>
          <span className="small muted">{date}</span>
        </div>
        <div className="small muted">{excerpt}</div>
        <div className="hstack" style={{ gap: 8 }}>
          <button className="btn small">Ouvrir</button>
          <button className="btn small secondary">
            <Download size={14} style={{ marginRight: 6 }} />
            Exporter PDF
          </button>
          <button className="btn ghost small">
            <Trash2 size={14} style={{ marginRight: 6 }} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ title, due }: { title: string; due: string }) {
  return (
    <div className="hstack" style={{ justifyContent: "space-between" }}>
      <div className="vstack" style={{ gap: 2 }}>
        <div className="small">{title}</div>
        <div className="small muted">Échéance : {due}</div>
      </div>
      <div className="hstack" style={{ gap: 6 }}>
        <button className="btn small secondary">Marquer fait</button>
        <button className="btn small ghost">Reporter</button>
      </div>
    </div>
  );
}
