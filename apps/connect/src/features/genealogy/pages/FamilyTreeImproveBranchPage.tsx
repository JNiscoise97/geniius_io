// FamilyTreeImproveBranchPage.tsx

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { GenealogyUpdateActionPicker } from "../components/GenealogyUpdateActionPicker";
import { MissingPersonRequestForm } from "../components/MissingPersonRequestForm";
import { ExistingPersonUpdateForm } from "../components/ExistingPersonUpdateForm";
import type {
  ExistingPersonProposal,
  GenealogyUpdateAction,
  MissingPersonProposal,
} from "../types/genealogyUpdateTypes";

function createDefaultPrivacy() {
  return {
    personIsLiving: "" as const,
    personIsMinor: "" as const,
    hasConsentToShare: false,
    allowDisplayToFamily: false,
  };
}

function createDefaultMissingPersonProposal(): MissingPersonProposal {
  return {
    relativeKind: "",
    firstName: "",
    lastName: "",
    nickname: "",
    birthYear: "",
    note: "",
    hasPhoto: "",
    privacy: createDefaultPrivacy(),
  };
}

function createDefaultExistingPersonProposal(
  action: "complete_person" | "correct_person",
): ExistingPersonProposal {
  return {
    action,
    fieldKey: "",
    proposedValue: "",
    note: "",
    privacy: createDefaultPrivacy(),
  };
}

export function FamilyTreeImproveBranchPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const [searchParams] = useSearchParams();

  const slug = eventSlug ?? "demo";
  const targetPersonId = searchParams.get("personId");
  const targetPersonLabel = searchParams.get("personLabel") ?? "cette personne";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [action, setAction] = useState<GenealogyUpdateAction | null>(null);
  const [missingPerson, setMissingPerson] = useState<MissingPersonProposal>(
    createDefaultMissingPersonProposal(),
  );
  const [existingPerson, setExistingPerson] = useState<ExistingPersonProposal>(
    createDefaultExistingPersonProposal("complete_person"),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageTitle = useMemo(() => {
    if (targetPersonId) return "Améliorer cette fiche";
    return "Améliorer cette branche";
  }, [targetPersonId]);

  function validate(): string | null {
    if (!action) {
      return "Merci de choisir le type de mise à jour que tu veux proposer.";
    }

    if (action === "add_missing_person") {
      if (!missingPerson.relativeKind) {
        return "Merci d’indiquer le lien familial de la personne manquante.";
      }

      if (!missingPerson.firstName.trim() && !missingPerson.lastName.trim()) {
        return "Merci d’indiquer au moins un prénom ou un nom.";
      }

      if (!missingPerson.note.trim()) {
        return "Merci d’ajouter une petite précision sur cette personne manquante.";
      }
    }

    if (action === "complete_person" || action === "correct_person") {
      if (!existingPerson.fieldKey) {
        return "Merci d’indiquer le type d’information concerné.";
      }

      if (!existingPerson.proposedValue.trim()) {
        return "Merci d’indiquer l’information que tu proposes.";
      }
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!participantId) {
      setError("Impossible de retrouver ton profil participant.");
      return;
    }

    setLoading(true);

    try {
      const payload =
        action === "add_missing_person"
          ? {
              type: action,
              participantId,
              targetPersonId,
              values: missingPerson,
            }
          : {
              type: action,
              participantId,
              targetPersonId,
              values: {
                ...existingPerson,
                action,
              },
            };

      console.log("TODO save genealogy update request", payload);

      nav(`/e/${slug}/family-knowledge`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <Sparkles size={14} />
              Mise à jour généalogique
            </div>

            <button
              type="button"
              onClick={() => nav(-1)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {pageTitle}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            Propose une mise à jour de l’arbre : ajout, complément ou correction.
          </p>
        </section>

        {error ? (
          <div className="mt-3 rounded-2xl border border-[rgba(220,38,38,0.22)] bg-white p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-black text-slate-900">Oups</div>
                <div className="text-sm font-bold text-slate-700">{error}</div>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-3 grid gap-3">
          <GenealogyUpdateActionPicker
            value={action}
            onChange={(next) => {
              setAction(next);

              if (next === "complete_person") {
                setExistingPerson(createDefaultExistingPersonProposal("complete_person"));
              }

              if (next === "correct_person") {
                setExistingPerson(createDefaultExistingPersonProposal("correct_person"));
              }
            }}
          />

          {action === "add_missing_person" ? (
            <MissingPersonRequestForm
              value={missingPerson}
              onChange={(patch) =>
                setMissingPerson((prev) => ({ ...prev, ...patch }))
              }
            />
          ) : null}

          {action === "complete_person" || action === "correct_person" ? (
            <ExistingPersonUpdateForm
              personLabel={targetPersonLabel}
              value={existingPerson}
              onChange={(patch) =>
                setExistingPerson((prev) => ({ ...prev, ...patch }))
              }
            />
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--ok)]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">
                  Ce que tu envoies est une proposition
                </div>
                <div className="text-xs font-bold leading-5 text-slate-700">
                  Les informations seront relues avant intégration dans l’arbre.
                  Certaines données concernant des personnes vivantes pourront
                  rester masquées ou partiellement affichées.
                </div>
              </div>
            </div>
          </section>
        </form>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="c-container">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
            <button
              type="button"
              onClick={(e) => void onSubmit(e as unknown as FormEvent)}
              className={[
                "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-black transition",
                loading
                  ? "cursor-wait bg-[color:var(--blue)] text-white opacity-70"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading ? "Envoi en cours…" : "Envoyer ma proposition"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}