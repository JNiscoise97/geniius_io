import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ScrollText,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { familyMemoryFormConfig } from "../config/familyMemoryFormConfig";
import {
  createEmptyFamilyKnowledgeStoryTeller,
  getDefaultFamilyKnowledgeMemoryValues,
  getFamilyKnowledgeMemory,
  type FamilyKnowledgeMemoryValues,
  type FamilyKnowledgeStoryTellerEntry,
} from "../api/getFamilyKnowledgeMemory";
import { saveFamilyKnowledgeMemory } from "../api/saveFamilyKnowledgeMemory";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";



function StoryTellerCard({
  title,
  value,
  onChange,
  onRemove,
}: {
  title: string;
  value: FamilyKnowledgeStoryTellerEntry;
  onChange: (patch: Partial<FamilyKnowledgeStoryTellerEntry>) => void;
  onRemove: () => void;
}) {
  const fields = familyMemoryFormConfig.fields;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[15px] font-black text-slate-900">{title}</div>

        <button
          type="button"
          onClick={onRemove}
          className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 inline-flex items-center justify-center"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              {fields.firstNameLabel}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              placeholder={fields.firstNameLabel}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-slate-800">
              {fields.lastNameLabel}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              placeholder={fields.lastNameLabel}
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-extrabold text-slate-800">
            {fields.relationshipLabel}
          </span>
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            value={value.relationshipLabel}
            onChange={(e) => onChange({ relationshipLabel: e.target.value })}
            placeholder={fields.relationshipPlaceholder}
          />
        </label>
      </div>
    </div>
  );
}

export function FamilyKnowledgeMemoryPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeMemoryValues>(
    getDefaultFamilyKnowledgeMemoryValues(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = familyMemoryFormConfig;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  

  useEffect(() => {
    let isMounted = true;

    async function loadExistingData() {
      const participantSession = getParticipantSession(slug);

      if (!participantSession?.participantId) {
        if (isMounted) {
          setLoadingInitialData(false);
        }
        return;
      }

      try {
        const existing = await getFamilyKnowledgeMemory({
          participantId: participantSession.participantId,
        });

        if (!isMounted) return;

        if (existing) {
          setValues(existing);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(
          e?.message ?? "Impossible de charger les informations existantes.",
        );
      } finally {
        if (isMounted) {
          setLoadingInitialData(false);
        }
      }
    }

    void loadExistingData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  function setStoryTeller(
    index: number,
    patch: Partial<FamilyKnowledgeStoryTellerEntry>,
  ) {
    setValues((prev) => ({
      ...prev,
      storyTellers: prev.storyTellers.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function validate(): string | null {
    for (const person of values.storyTellers) {
      if (!person.firstName.trim() && !person.lastName.trim()) {
        return config.validation.missingStoryTellerIdentity;
      }

      if (!person.relationshipLabel.trim()) {
        return config.validation.missingStoryTellerRelationship;
      }
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const participantSession = getParticipantSession(slug);
    if (!participantSession?.participantId) {
      setError(config.validation.missingParticipant);
      return;
    }

    setLoading(true);
    try {
      await saveFamilyKnowledgeMemory({
        participantId: participantSession.participantId,
        values,
      });

      localStorage.setItem(`connect:${slug}:family-knowledge:memory`, "done");
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
        <div className="flex items-center gap-3 px-1">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center">
            <ScrollText size={18} className="text-slate-800" />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-black tracking-tight text-slate-900">
              {config.pageTitle}
            </div>
            <div className="text-xs font-bold text-slate-700">
              {config.pageSubtitle}
            </div>
          </div>
        </div>



        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
            <div className='min-w-0'>
              <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
              <div className='mt-0.5 text-xs text-amber-800'>
                <ol>
                  <li>Ajouter un bouton "retour"</li>
                  <li>Revoir l'en-tête</li>
                  <li>Si parent non connu pas la section</li>
                  <li>faire une lib qui dit les conditions pour qu'une section soit dite complète</li>
                  <li>revoir les labels des cartes</li>
                  <li>Nom et prénom se chevauchent</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-2xl bg-white shadow-sm border border-[rgba(220,38,38,0.22)] p-3">
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

        {loadingInitialData ? (
          <section className="mt-3 rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement des informations…
            </div>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="mt-3 grid gap-3">
            <FamilyPeopleList
              title={config.sections.storyTellers.title}
              subtitle={config.sections.storyTellers.subtitle}
              addLabel={config.sections.storyTellers.addLabel}
              emptyText={config.sections.storyTellers.emptyText}
              items={values.storyTellers}
              onAdd={() =>
                setValues((prev) => ({
                  ...prev,
                  storyTellers: [
                    ...prev.storyTellers,
                    createEmptyFamilyKnowledgeStoryTeller(),
                  ],
                }))
              }
              renderItem={(person, index) => (
                <StoryTellerCard
                  key={index}
                  title={`${config.sections.storyTellers.itemLabel} ${index + 1}`}
                  value={person}
                  onChange={(patch) => setStoryTeller(index, patch)}
                  onRemove={() =>
                    setValues((prev) => ({
                      ...prev,
                      storyTellers: prev.storyTellers.filter((_, i) => i !== index),
                    }))
                  }
                />
              )}
            />

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.anecdote.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.anecdote.subtitle}
              </div>

              <label className="grid gap-1 mt-4">
                <span className="text-xs font-extrabold text-slate-800">
                  {config.sections.anecdote.fieldLabel}
                </span>
                <textarea
                  className="min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={values.familyAnecdote}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      familyAnecdote: e.target.value.slice(
                        0,
                        config.sections.anecdote.maxLength,
                      ),
                    }))
                  }
                  placeholder={config.sections.anecdote.placeholder}
                />
                <div className="text-[11px] font-extrabold text-slate-400 text-right">
                  {values.familyAnecdote.length}/{config.sections.anecdote.maxLength}
                </div>
              </label>
            </section>

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.photos.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.photos.subtitle}
              </div>

              <label className="grid gap-1 mt-4">
                <span className="text-xs font-extrabold text-slate-800">
                  {config.sections.photos.hasPhotosLabel}
                </span>
                <select
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={values.hasFamilyPhotos}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      hasFamilyPhotos: e.target.value as "" | "yes" | "no",
                    }))
                  }
                >
                  <option value="">{config.fields.hasPhotosChooseLabel}</option>
                  <option value="yes">{config.fields.yesLabel}</option>
                  <option value="no">{config.fields.noLabel}</option>
                </select>
              </label>

              {values.hasFamilyPhotos === "yes" ? (
                <label className="grid gap-1 mt-4">
                  <span className="text-xs font-extrabold text-slate-800">
                    {config.sections.photos.noteLabel}
                  </span>
                  <textarea
                    className="min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 outline-none resize-y focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    value={values.familyPhotosNote}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        familyPhotosNote: e.target.value,
                      }))
                    }
                    placeholder={config.sections.photos.notePlaceholder}
                  />
                </label>
              ) : null}
            </section>

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-[color:var(--ok)]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {config.sections.info.title}
                  </div>
                  <div className="text-xs font-bold leading-5 text-slate-700">
                    {config.sections.info.text}
                  </div>
                </div>
              </div>
            </section>
          </form>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
        <div className="c-container">
          <div className="rounded-3xl bg-white/95 backdrop-blur border border-slate-200 shadow-[0_16px_38px_rgba(15,23,42,0.10)] p-2">
            <button
              type="button"
              onClick={(e) => void onSubmit(e as unknown as FormEvent)}
              className={[
                "w-full h-12 rounded-2xl font-black inline-flex items-center justify-center gap-2 transition",
                loading
                  ? "bg-[color:var(--blue)] text-white opacity-70 cursor-wait"
                  : "bg-[color:var(--blue)] text-white",
              ].join(" ")}
              disabled={loading}
            >
              <ArrowRight size={18} />
              {loading
                ? config.footer.loadingLabel
                : config.footer.submitLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}