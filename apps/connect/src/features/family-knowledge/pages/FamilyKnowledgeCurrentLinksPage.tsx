import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { PhotoPresenceField } from "../components/PhotoPresenceField";
import {
  RelationshipTypeField,
} from "../components/RelationshipTypeField";
import { currentLinksFormConfig } from "../config/currentLinksFormConfig";
import {
  createEmptyFamilyKnowledgeCurrentLink,
  getDefaultFamilyKnowledgeCurrentLinksValues,
  getFamilyKnowledgeCurrentLinks,
  type FamilyKnowledgeCurrentLinkEntry,
  type FamilyKnowledgeCurrentLinksValues,
} from "../api/getFamilyKnowledgeCurrentLinks";
import { saveFamilyKnowledgeCurrentLinks } from "../api/saveFamilyKnowledgeCurrentLinks";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";



function CurrentLinkCard({
  title,
  value,
  onChange,
  onRemove,
}: {
  title: string;
  value: FamilyKnowledgeCurrentLinkEntry;
  onChange: (patch: Partial<FamilyKnowledgeCurrentLinkEntry>) => void;
  onRemove: () => void;
}) {
  const fields = currentLinksFormConfig.fields;

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

        <RelationshipTypeField
          label={fields.relationshipTypeLabel}
          value={value.relationshipType}
          onChange={(relationshipType) => onChange({ relationshipType })}
          options={[
            { value: "cousin", label: "Cousin / cousine" },
            { value: "aunt", label: "Tante" },
            { value: "uncle", label: "Oncle" },
            { value: "other", label: "Autre" },
          ]}
        />

        {value.relationshipType === "other" ? (
          <label className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {fields.relationshipTypeOtherLabel}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.relationshipLabel}
              onChange={(e) => onChange({ relationshipLabel: e.target.value })}
              placeholder={fields.relationshipTypeOtherPlaceholder}
            />
          </label>
        ) : null}

        <PhotoPresenceField
          label={fields.hasPhotoLabel}
          value={value.hasPhoto}
          onChange={(hasPhoto) => onChange({ hasPhoto })}
          chooseLabel={fields.chooseLabel}
          yesLabel={fields.yesLabel}
          noLabel={fields.noLabel}
        />
      </div>
    </div>
  );
}

export function FamilyKnowledgeCurrentLinksPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeCurrentLinksValues>(
    getDefaultFamilyKnowledgeCurrentLinksValues(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = currentLinksFormConfig;

  

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
        const existing = await getFamilyKnowledgeCurrentLinks({
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

  function setContact(
    index: number,
    patch: Partial<FamilyKnowledgeCurrentLinkEntry>,
  ) {
    setValues((prev) => ({
      ...prev,
      contacts: prev.contacts.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function validate(): string | null {
    for (const person of values.contacts) {
      if (!person.firstName.trim() && !person.lastName.trim()) {
        return config.validation.missingIdentity;
      }

      if (!person.relationshipType) {
        return config.validation.missingRelationship;
      }

      if (
        person.relationshipType === "other" &&
        !person.relationshipLabel.trim()
      ) {
        return config.validation.missingOtherRelationship;
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
      await saveFamilyKnowledgeCurrentLinks({
        participantId: participantSession.participantId,
        values,
      });

      localStorage.setItem(
        `connect:${slug}:family-knowledge:current_links`,
        "done",
      );
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
            <Users size={14} />
            Famille en contact
          </div>

          <button
              type="button"
              onClick={() => nav(`/e/${slug}/family-knowledge`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
            </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {config.pageTitle}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            {config.pageSubtitle}
          </p>
        </section>

        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
            <div className='min-w-0'>
              <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
              <div className='mt-0.5 text-xs text-amber-800'>
                <ol>
                  <li>Si parent non connu pas la section</li>
                  <li>faire une lib qui dit les conditions pour qu'une section soit dite complète</li>
                  <li>revoir les labels des cartes</li>
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
              title={config.section.title}
              subtitle={config.section.subtitle}
              addLabel={config.section.addLabel}
              emptyText={config.section.emptyText}
              items={values.contacts}
              onAdd={() =>
                setValues((prev) => ({
                  ...prev,
                  contacts: [
                    ...prev.contacts,
                    createEmptyFamilyKnowledgeCurrentLink(),
                  ],
                }))
              }
              renderItem={(person, index) => (
                <CurrentLinkCard
                  key={index}
                  title={`${config.section.itemLabel} ${index + 1}`}
                  value={person}
                  onChange={(patch) => setContact(index, patch)}
                  onRemove={() =>
                    setValues((prev) => ({
                      ...prev,
                      contacts: prev.contacts.filter((_, i) => i !== index),
                    }))
                  }
                />
              )}
            />

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 text-[color:var(--ok)]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {config.info.title}
                  </div>
                  <div className="text-xs font-bold leading-5 text-slate-700">
                    {config.info.text}
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