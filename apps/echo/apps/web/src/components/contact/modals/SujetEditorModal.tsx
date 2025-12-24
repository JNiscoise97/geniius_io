// SujetEditorModal.tsx
import React, { useState, useRef } from "react";
import {
  Upload,
  Link as LinkIcon,
  Paperclip,
  Trash2,
  Tags,
  BookOpen,
  Target,
  Star,
  Flag
} from "lucide-react";
import { Modal } from "@echo/ui";
import { uid } from "@echo/ui/utils/ids";

export type Sujet = {
  id: string;
  titre: string;
  objectif: string;
  contexte: string;
  hypothese: string;
  ressources: { id: string; type: "link" | "file"; label: string; url?: string }[];
  themes: string[];
  createdAt: string;
  /** ↓↓↓ nouveaux champs ↓↓↓ **/
  importance?: "critique" | "elevee" | "moyenne" | "faible";
  priorite?: "haute" | "moyenne" | "basse";
};

export function SujetEditorModal({
  initial,
  open,
  onClose,
  onSave,
}: {
  initial: Sujet;
  open: boolean;
  onClose: () => void;
  onSave: (s: Sujet) => void;
}) {
  if (!open) return null;

  const [titre, setTitre] = useState(initial.titre ?? "");
  const [objectif, setObjectif] = useState(initial.objectif ?? "");
  const [contexte, setContexte] = useState(initial.contexte ?? "");
  const [hypothese, setHypothese] = useState(initial.hypothese ?? "");
  const [themes, setThemes] = useState<string[]>(initial.themes ?? []);
  const [ressources, setRessources] = useState(initial.ressources ?? []);

  // nouveaux états
  const [importance, setImportance] = useState<Sujet["importance"]>(initial.importance ?? "moyenne");
  const [priorite, setPriorite] = useState<Sujet["priorite"]>(initial.priorite ?? "moyenne");

  const themeInput = themes.join(", ");
  function parseThemes(v: string) {
    setThemes(v.split(",").map((s) => s.trim()).filter(Boolean));
  }

  // File upload (mock)
  const fileInput = useRef<HTMLInputElement | null>(null);
  function pickFiles() { fileInput.current?.click(); }
  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    const mapped = list.map((f) => ({
      id: uid(),
      type: "file" as const,
      label: f.name,
    }));
    setRessources((prev) => [...prev, ...mapped]);
  }
  function addLink() {
    const label = prompt("Intitulé du lien");
    if (!label) return;
    const url = prompt("URL du lien (https://...)") || undefined;
    setRessources((prev) => [...prev, { id: uid(), type: "link", label, url }]);
  }
  function removeRes(id: string) {
    setRessources((prev) => prev.filter((r) => r.id !== id));
  }

  function save() {
    onSave({
      ...initial,
      titre: titre.trim(),
      objectif: objectif.trim(),
      contexte: contexte.trim(),
      hypothese: hypothese.trim(),
      ressources,
      themes,
      importance,
      priorite,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Enrichir le sujet" size="xl">
      <div className="form-wrap">
        {/* Infos générales */}
        <section className="section">
          <h2 className="section-title hstack" style={{ gap: 8 }}>
            <Target size={18} /> Informations générales
          </h2>
          <p className="section-sub">Comment définir clairement ce sujet ?</p>

          <div className="field">
            <label>Titre*</label>
            <input
              className="input"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex. Les voisins de grand-mère Émilie"
            />
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>Objectif principal</label>
            <textarea
              className="input"
              style={{ minHeight: 70 }}
              value={objectif}
              onChange={(e) => setObjectif(e.target.value)}
              placeholder="Ex. Clarifier le lien de parenté avec la famille X"
            />
          </div>

          {/* Importance & Priorité */}
          <div className="field-grid-2" style={{ marginTop: 12 }}>
            <div className="field">
              <label className="hstack" style={{ gap: 6 }}>
                <Star size={16} /> Importance (impact)
              </label>
              <select
                className="select-lite"
                value={importance}
                onChange={(e) => setImportance(e.target.value as Sujet["importance"])}
              >
                <option value="critique">Critique</option>
                <option value="elevee">Élevée</option>
                <option value="moyenne">Moyenne</option>
                <option value="faible">Faible</option>
              </select>
            </div>
            <div className="field">
              <label className="hstack" style={{ gap: 6 }}>
                <Flag size={16} /> Priorité (urgence)
              </label>
              <select
                className="select-lite"
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as Sujet["priorite"])}
              >
                <option value="haute">Haute</option>
                <option value="moyenne">Moyenne</option>
                <option value="basse">Basse</option>
              </select>
            </div>
          </div>
        </section>

        {/* Contexte & hypothèse */}
        <section className="section">
          <h2 className="section-title hstack" style={{ gap: 8 }}>
            <BookOpen size={18} /> Contexte & hypothèse
          </h2>
          <p className="section-sub">Quels repères ou suppositions cadrent ce sujet ?</p>

          <div className="field">
            <label>Contexte</label>
            <textarea
              className="input"
              style={{ minHeight: 70 }}
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              placeholder="Branche, village, période, témoins…"
            />
          </div>

          <div className="field" style={{ marginTop: 12 }}>
            <label>Hypothèse (à confirmer)</label>
            <textarea
              className="input"
              style={{ minHeight: 70 }}
              value={hypothese}
              onChange={(e) => setHypothese(e.target.value)}
              placeholder="Ex. Les frères Durand étaient peut-être voisins de sa mère"
            />
          </div>
        </section>

        {/* Thèmes */}
        <section className="section">
          <h2 className="section-title hstack" style={{ gap: 8 }}>
            <Tags size={18} /> Thèmes
          </h2>
          <p className="section-sub">Quels mots-clés balisent ce sujet ?</p>

          <input
            className="input"
            value={themeInput}
            onChange={(e) => parseThemes(e.target.value)}
            placeholder="voisinage, fratrie, migration…"
          />
        </section>

        {/* Ressources */}
        <section className="section">
          <h2 className="section-title hstack" style={{ gap: 8 }}>
            <Paperclip size={18} /> Ressources
          </h2>
          <p className="section-sub">Quels documents ou liens accompagnent ce sujet ?</p>

          <div className="hstack" style={{ gap: 8, marginBottom: 12 }}>
            <button className="btn" onClick={addLink}>
              <LinkIcon size={16} /> Ajouter un lien
            </button>
            <button className="btn secondary" onClick={pickFiles}>
              <Upload size={16} /> Importer fichiers
            </button>
            <input ref={fileInput} type="file" multiple hidden onChange={onFilesChosen} />
          </div>

          {ressources.length > 0 && (
            <div className="table-lite">
              <div className="table-row head">
                <div>Type</div><div>Libellé</div><div>URL</div><div></div>
              </div>
              {ressources.map((r) => (
                <div className="table-row" key={r.id}>
                  <div>{r.type === "link" ? "Lien" : "Fichier"}</div>
                  <div>{r.label}</div>
                  <div>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="link-like">
                        {r.url}
                      </a>
                    ) : "—"}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <button className="icon-btn-lite danger" onClick={() => removeRes(r.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="form-footer">
          <button className="btn ghost" onClick={onClose}>Annuler</button>
          <button className="btn primary" onClick={save}>Enregistrer</button>
        </div>
      </div>
    </Modal>
  );
}
