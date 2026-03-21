// src/features/family-knowledge/pages/FamilyTreeFindMePage.tsx

import {
  ArrowLeft,
  Compass,
  Mail,
  Map,
  Search,
  TreePine,
  UserCircle2,
  Lock,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { searchFindMeCandidates } from "../api/findMeCandidates";
import { getParticipantDefaultGedcomPersonId } from "../api/getParticipantDefaultGedcomPersonId";
import {
  FIND_ME_EMPTY_ANSWERS,
  FIND_ME_MINIMAL_INPUT_COUNT,
  FIND_ME_PAGE_KEY,
} from "../config/findMeConfig";
import type { FindMeAnswers } from "../lib/findMeMatching";
import { FindMeCandidateCard } from "../components/FindMeCandidateCard";
import { FindMeModeCard } from "../components/FindMeModeCard";
import { FindMeSearchField } from "../components/FindMeSearchField";
import {
  getMyPersonIdentityClaims,
  type PersonIdentityClaim,
} from "../api/getMyPersonIdentityClaim";
import { MyIdentityClaimsSection } from "../components/MyIdentityClaimsSection";

type FindMeMode = "home" | "guided";

function countFilledFields(values: FindMeAnswers) {
  return Object.values(values).filter((value) => Boolean(value?.trim())).length;
}

export function FamilyTreeFindMePage() {
  const navigate = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const [mode, setMode] = useState<FindMeMode>("home");
  const [answers, setAnswers] = useState<FindMeAnswers>(FIND_ME_EMPTY_ANSWERS);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [claims, setClaims] = useState<PersonIdentityClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<string | null>(null);
  const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] = useState(false);

  const hasApprovedClaim = useMemo(
    () => claims.some((claim) => claim.claim_status === "approved"),
    [claims],
  );

  const hasDefaultTreeEntry = Boolean(defaultGedcomPersonId);
  const allowGuidedSearch = false;

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

  const filledCount = useMemo(() => countFilledFields(answers), [answers]);

  const candidates = useMemo(() => {
    if (!hasSubmitted) return [];
    return searchFindMeCandidates(answers);
  }, [answers, hasSubmitted]);

  function updateField<K extends keyof FindMeAnswers>(key: K, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSubmit() {
    setHasSubmitted(true);
  }

  function handleReset() {
    setAnswers(FIND_ME_EMPTY_ANSWERS);
    setHasSubmitted(false);
  }

  function openNavigationMode() {
    navigate(`/e/${slug}/family-tree/browse`);
  }

  function openContactOrganizerMode() {
    navigate(`/e/${slug}/contact?preset=find-me-identification`, {
      state: {
        findMeDraft: answers,
      },
    });
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
                Parcours l’arbre familial pour te repérer, ou demande à l’organisateur
                de t’aider à t’identifier.
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

        {!defaultGedcomPersonLoading && hasDefaultTreeEntry && !hasApprovedClaim ? (
          <div className="mt-4 rounded-[20px] border border-indigo-200 bg-indigo-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-indigo-950">
                  Il est normal que certaines personnes soient masquées
                </div>
                <div className="mt-1 text-xs leading-5 text-indigo-900">
                  Pour protéger la vie privée de chacun, certaines personnes de
                  l’arbre restent masquées tant qu’elles n’ont pas été identifiées
                  ou n’ont pas donné leur accord. Tu peux toutefois te repérer à
                  partir de tes proches visibles et signaler le profil qui pourrait
                  correspondre à toi.
                </div>
              </div>
            </div>
          </div>
        ) : null}

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

        {mode === "home" ? (
          <div className="mt-3 space-y-3">
            {allowGuidedSearch ? (
              <FindMeModeCard
                title="Je veux être guidé"
                description="Renseigne quelques infos sur toi, tes parents ou tes grands-parents pour faire ressortir les profils les plus probables."
                icon={<Search size={22} />}
                onClick={() => setMode("guided")}
              />
            ) : null}

            {!defaultGedcomPersonLoading && hasDefaultTreeEntry ? (
              <FindMeModeCard
                title="Je préfère explorer l’arbre"
                description="Ouvre l’arbre et navigue librement jusqu’à l’endroit où tu penses te reconnaître."
                icon={<Compass size={22} />}
                onClick={openNavigationMode}
              />
            ) : null}

            <FindMeModeCard
              title="Je préfère contacter l’organisateur"
              description="Tu recevras une notification par mail quand il t’aura identifié."
              icon={<Mail size={22} />}
              onClick={openContactOrganizerMode}
            />
          </div>
        ) : null}

        {mode === "guided" ? (
          <div className="space-y-4">
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <UserCircle2 size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[20px] font-black text-slate-900">
                    Indices familiaux
                  </div>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                    Mets seulement ce que tu sais. Même 2 ou 3 indices peuvent
                    suffire pour faire ressortir des candidats.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-900">
                      Prénom
                    </label>
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <input
                        value={answers.firstName ?? ""}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        placeholder="Ex. Jordan"
                        className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-900">
                      Nom
                    </label>
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <input
                        value={answers.lastName ?? ""}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        placeholder="Ex. Niscoise"
                        className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-900">
                      Année de naissance
                    </label>
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <input
                        value={answers.birthYear ?? ""}
                        onChange={(e) => updateField("birthYear", e.target.value)}
                        placeholder="Ex. 1997"
                        inputMode="numeric"
                        className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-slate-900">
                      Lieu de naissance
                    </label>
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <input
                        value={answers.birthPlace ?? ""}
                        onChange={(e) => updateField("birthPlace", e.target.value)}
                        placeholder="Ex. Saint-Denis"
                        className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <FindMeSearchField
                  label="Père"
                  placeholder="Recherche par prénom et nom"
                  value={answers.fatherQuery ?? ""}
                  onChange={(value) => updateField("fatherQuery", value)}
                />

                <FindMeSearchField
                  label="Mère"
                  placeholder="Recherche par prénom et nom"
                  value={answers.motherQuery ?? ""}
                  onChange={(value) => updateField("motherQuery", value)}
                />

                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-900">
                    Grands-parents
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Tu peux renseigner un à quatre noms si tu les connais.
                  </p>

                  <div className="mt-4 grid gap-4">
                    <FindMeSearchField
                      label="Grand-parent 1"
                      placeholder="Ex. Prénom Nom"
                      value={answers.grandparentQuery1 ?? ""}
                      onChange={(value) => updateField("grandparentQuery1", value)}
                    />
                    <FindMeSearchField
                      label="Grand-parent 2"
                      placeholder="Ex. Prénom Nom"
                      value={answers.grandparentQuery2 ?? ""}
                      onChange={(value) => updateField("grandparentQuery2", value)}
                    />
                    <FindMeSearchField
                      label="Grand-parent 3"
                      placeholder="Ex. Prénom Nom"
                      value={answers.grandparentQuery3 ?? ""}
                      onChange={(value) => updateField("grandparentQuery3", value)}
                    />
                    <FindMeSearchField
                      label="Grand-parent 4"
                      placeholder="Ex. Prénom Nom"
                      value={answers.grandparentQuery4 ?? ""}
                      onChange={(value) => updateField("grandparentQuery4", value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={filledCount < FIND_ME_MINIMAL_INPUT_COUNT}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lancer la recherche
                  <Search size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
                >
                  Réinitialiser
                </button>

                {hasDefaultTreeEntry ? (
                  <button
                    type="button"
                    onClick={openNavigationMode}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-900 transition active:scale-[0.99]"
                  >
                    <TreePine size={16} />
                    Explorer l’arbre
                  </button>
                ) : null}
              </div>

              {filledCount < FIND_ME_MINIMAL_INPUT_COUNT ? (
                <div className="mt-3 text-xs font-bold text-slate-500">
                  Ajoute au moins {FIND_ME_MINIMAL_INPUT_COUNT} indices pour lancer
                  une recherche utile.
                </div>
              ) : null}
            </section>

            {hasSubmitted ? (
              <section className="space-y-3">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[20px] font-black text-slate-900">
                    Résultats possibles
                  </div>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                    On te propose les profils les plus probables. C’est toi qui
                    confirmes ensuite si tu te reconnais.
                  </p>
                </div>

                {candidates.length === 0 ? (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 shadow-sm">
                    Aucun profil suffisamment proche n’a été trouvé avec ces
                    indices. Essaie d’ajouter un parent, un grand-parent ou un lieu.
                  </div>
                ) : (
                  candidates.map((candidate) => (
                    <FindMeCandidateCard
                      key={candidate.person.id}
                      candidate={candidate}
                      onOpenInTree={openCandidateInTree}
                    />
                  ))
                )}
              </section>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}