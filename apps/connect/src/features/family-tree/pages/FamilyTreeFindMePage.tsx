// src/features/family-knowledge/pages/FamilyTreeFindMePage.tsx

import {
  ArrowLeft,
  Compass,
  Lock,
  Mail,
  Map,
  TreePine,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getParticipantDefaultGedcomPersonId } from "../api/getParticipantDefaultGedcomPersonId";
import { FIND_ME_PAGE_KEY } from "../config/findMeConfig";
import {
  getMyPersonIdentityClaims,
  type PersonIdentityClaim,
} from "../api/getMyPersonIdentityClaim";
import { FindMeModeCard } from "../components/FindMeModeCard";
import { MyIdentityClaimsSection } from "../components/MyIdentityClaimsSection";

function FindMeIntroStepper() {
  const steps = [
    {
      number: 1,
      title: "À quoi sert cette étape ?",
      text:
        "Cette étape te permet d’indiquer quelle personne de l’arbre te correspond, pour associer ton profil au bon membre de la famille.",
    },
    {
      number: 2,
      title: "Deux façons de procéder",
      text:
        "Soit tu explores l’arbre si tu sais à peu près où te situer, soit tu demandes de l’aide à l’organisateur si tu ne sais pas du tout où chercher.",
    },
    {
      number: 3,
      title: "Pourquoi certains profils sont masqués ?",
      text:
        "C’est normal. Par défaut, les personnes vivantes restent privées tant qu’elles ne se sont pas identifiées dans l’application et n’ont pas choisi leurs préférences de visibilité.",
    },
  ];

  return (
    <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[18px] font-black text-slate-900">
        Avant de commencer
      </div>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
        Lis ces quelques repères pour savoir quoi faire.
      </p>

      <div className="mt-4 space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
              {step.number}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-black text-slate-900">
                {step.title}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-600">
                {step.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type FindMeChoiceCardProps = {
  title: string;
  description: string;
  helper?: string;
  icon: React.ReactNode;
  onClick: () => void;
};

function FindMeChoiceCard({
  title,
  description,
  helper,
  icon,
  onClick,
}: FindMeChoiceCardProps) {
  return (
    <FindMeModeCard
      title={title}
      description={
        helper ? `${description}\n\n${helper}` : description
      }
      icon={icon}
      onClick={onClick}
    />
  );
}

export function FamilyTreeFindMePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [claims, setClaims] = useState<PersonIdentityClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<string | null>(null);
  const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] = useState(false);

  const [introAcknowledged, setIntroAcknowledged] = useState(false);

  const hasApprovedClaim = useMemo(
    () => claims.some((claim) => claim.claim_status === "approved"),
    [claims],
  );

  const hasDefaultTreeEntry = Boolean(defaultGedcomPersonId);

  async function loadClaims() {
    if (!participantId) {
      setClaims([]);
      return;
    }

    try {
      setClaimsLoading(true);
      setClaimsError(null);

      const data = await getMyPersonIdentityClaims({
        eventSlug: slug,
        participantId,
      });

      setClaims(data);
    } catch (error) {
      console.error(error);
      setClaimsError("Impossible de charger tes demandes pour le moment.");
    } finally {
      setClaimsLoading(false);
    }
  }

  async function loadDefaultGedcomPersonId() {
    if (!participantId) {
      setDefaultGedcomPersonId(null);
      return;
    }

    try {
      setDefaultGedcomPersonLoading(true);

      const personId = await getParticipantDefaultGedcomPersonId({
        eventSlug: slug,
        participantId,
      });

      setDefaultGedcomPersonId(personId?.trim() ? personId : null);
    } catch (error) {
      console.error(error);
      setDefaultGedcomPersonId(null);
    } finally {
      setDefaultGedcomPersonLoading(false);
    }
  }

  useEffect(() => {
    void loadClaims();
    void loadDefaultGedcomPersonId();
  }, [participantId, slug]);

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/${FIND_ME_PAGE_KEY}`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  function openNavigationMode() {
    navigate(`/e/${slug}/family-tree/browse`);
  }

  function openContactOrganizerMode() {
    navigate(`/e/${slug}/contact?preset=find-me-identification`);
  }

  function openCandidateInTree(personId: string) {
    navigate(
      `/e/${slug}/family-tree/browse?personId=${encodeURIComponent(personId)}&from=find-me`,
    );
  }

  function openFamilyKnowledge() {
    navigate(`/e/${slug}/family-knowledge`);
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
                <Map size={14} />
                Retrouve ton profil
              </div>

              <h1 className="mt-4 text-[28px] font-black leading-[1.05] tracking-tight text-slate-900">
                Me retrouver dans l’arbre
              </h1>

              <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                Cette étape t’aide à indiquer quelle personne de l’arbre te
                correspond.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/e/${slug}/family-tree`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>
        </section>

        <MyIdentityClaimsSection
          claims={claims}
          loading={claimsLoading}
          error={claimsError}
          onOpenPerson={openCandidateInTree}
        />

        {!defaultGedcomPersonLoading && !hasDefaultTreeEntry ? (
          <section className="mt-3 space-y-3">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-amber-900">
                    L’exploration de l’arbre n’est pas encore disponible pour toi
                  </div>
                  <div className="mt-1 text-xs leading-5 text-amber-800">
                    L’organisation n’a pas encore suffisamment d’éléments pour te
                    rattacher à une branche de l’arbre. Renseigne les informations sur
                    ta famille pour faciliter ton identification.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openFamilyKnowledge}
              className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
            >
              <Users size={16} />
              Renseigner ma famille
            </button>
          </section>
        ) : null}

        {!defaultGedcomPersonLoading && hasDefaultTreeEntry && !hasApprovedClaim ? (
          <>
            {!introAcknowledged ? (
              <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <FindMeIntroStepper />

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIntroAcknowledged(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
                  >
                    J’ai compris, continuer
                  </button>
                </div>
              </section>
            ) : (
              <section className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[18px] font-black text-slate-900">
                    Choisis comment continuer
                  </div>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                    Tu peux soit te repérer toi-même dans l’arbre, soit demander
                    de l’aide si tu ne sais pas du tout où chercher.
                  </p>
                </div>

                <FindMeChoiceCard
                  title="Explorer l’arbre pour me reconnaître"
                  description="Ouvre l’arbre généalogique et suis le repère en forme de feuille jusqu’à l’endroit où l’organisation pense que tu te situes."
                  helper="Quand tu penses être au bon endroit, indique la personne qui te correspond."
                  icon={<Compass size={22} />}
                  onClick={openNavigationMode}
                />

                <FindMeChoiceCard
                  title="Demander de l’aide à l’organisateur"
                  description="Si tu ne sais pas du tout où te situer, envoie une demande d’aide pour être guidé dans ton identification."
                  helper="Le formulaire sera prérempli. Si besoin, tu pourras y ajouter quelques informations sur ta famille."
                  icon={<Mail size={22} />}
                  onClick={openContactOrganizerMode}
                />
              </section>
            )}
          </>
        ) : null}

        {!defaultGedcomPersonLoading && hasDefaultTreeEntry && hasApprovedClaim ? (
          <section className="mt-4 space-y-3">
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <TreePine className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-900">
                    Ton profil a déjà été associé dans l’arbre
                  </div>
                  <div className="mt-1 text-xs leading-5 text-emerald-800">
                    Tu peux maintenant explorer l’arbre et commencer à enrichir la
                    mémoire familiale.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openNavigationMode}
              className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
            >
              <TreePine size={16} />
              Explorer l’arbre
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}