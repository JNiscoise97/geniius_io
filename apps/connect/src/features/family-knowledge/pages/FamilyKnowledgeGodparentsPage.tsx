import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Plus,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { KnownToggleField } from "../components/KnownToggleField";
import { LivingStatusField } from "../components/LivingStatusField";
import { PhotoPresenceField } from "../components/PhotoPresenceField";
import { godparentsFormConfig } from "../config/godparentsFormConfig";
import {
  createEmptyFamilyKnowledgeGodparentPerson,
  getDefaultFamilyKnowledgeGodparentsValues,
  getFamilyKnowledgeGodparents,
  type FamilyKnowledgeGodparentPerson,
  type FamilyKnowledgeGodparentsValues,
  type FamilyKnowledgeParentGodparentPerson,
} from "../api/getFamilyKnowledgeGodparents";
import { saveFamilyKnowledgeGodparents } from "../api/saveFamilyKnowledgeGodparents";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";



function PersonalGodparentCard({
  title,
  value,
  onChange,
  onRemove,
}: {
  title: string;
  value: FamilyKnowledgeGodparentPerson;
  onChange: (patch: Partial<FamilyKnowledgeGodparentPerson>) => void;
  onRemove: () => void;
}) {
  const labels = godparentsFormConfig.personFields;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[15px] font-black text-slate-900">{title}</div>

        <button
          type="button"
          onClick={onRemove}
          className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 inline-flex items-center justify-center"
        >
          <Plus size={16} className="rotate-45" />
        </button>
      </div>

      <div className="mt-3">
        <KnownToggleField
          checked={value.known}
          onChange={(checked) => onChange({ known: checked })}
          label={labels.knownLabel}
          helpText={labels.knownHelp}
        />
      </div>

      {value.known ? (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {labels.firstNameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.firstName}
                onChange={(e) => onChange({ firstName: e.target.value })}
                placeholder={labels.firstNameLabel}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {labels.lastNameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
                placeholder={labels.lastNameLabel}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {labels.nicknameLabel}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              placeholder={labels.nicknameLabel}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <LivingStatusField
              value={value.isAlive}
              onChange={(isAlive) => onChange({ isAlive })}
              label={labels.isAliveLabel}
              chooseLabel={labels.chooseLabel}
              yesLabel={labels.yesLabel}
              noLabel={labels.noLabel}
            />

            <PhotoPresenceField
              value={value.hasPhoto}
              onChange={(hasPhoto) => onChange({ hasPhoto })}
              label={labels.hasPhotoLabel}
              chooseLabel={labels.chooseLabel}
              yesLabel={labels.yesLabel}
              noLabel={labels.noLabel}
            />
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {labels.isFamilyMemberLabel}
            </span>
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.isFamilyMember}
              onChange={(e) =>
                onChange({
                  isFamilyMember: e.target.value as "" | "yes" | "no",
                })
              }
            >
              <option value="">{labels.chooseLabel}</option>
              <option value="yes">{labels.yesLabel}</option>
              <option value="no">{labels.noLabel}</option>
            </select>
          </label>
        </div>
      ) : null}
    </div>
  );
}

function ParentGodparentCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: FamilyKnowledgeParentGodparentPerson;
  onChange: (patch: Partial<FamilyKnowledgeParentGodparentPerson>) => void;
}) {
  const labels = godparentsFormConfig.personFields;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[15px] font-black text-slate-900">{title}</div>

      <div className="mt-3">
        <KnownToggleField
          checked={value.known}
          onChange={(checked) => onChange({ known: checked })}
          label={labels.knownLabel}
          helpText={labels.knownHelp}
        />
      </div>

      {value.known ? (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {labels.firstNameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.firstName}
                onChange={(e) => onChange({ firstName: e.target.value })}
                placeholder={labels.firstNameLabel}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                {labels.lastNameLabel}
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
                placeholder={labels.lastNameLabel}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {labels.nicknameLabel}
            </span>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              value={value.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              placeholder={labels.nicknameLabel}
            />
          </label>

          <PhotoPresenceField
            value={value.hasPhoto}
            onChange={(hasPhoto) => onChange({ hasPhoto })}
            label={labels.hasPhotoLabel}
            chooseLabel={labels.chooseLabel}
            yesLabel={labels.yesLabel}
            noLabel={labels.noLabel}
          />
        </div>
      ) : null}
    </div>
  );
}

export function FamilyKnowledgeGodparentsPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeGodparentsValues>(
    getDefaultFamilyKnowledgeGodparentsValues(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = godparentsFormConfig;

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
        const existing = await getFamilyKnowledgeGodparents({
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

  function setPersonalGodparent(
    index: number,
    patch: Partial<FamilyKnowledgeGodparentPerson>,
  ) {
    setValues((prev) => ({
      ...prev,
      personalGodparents: prev.personalGodparents.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function validateKnownParentGodparent(
    person: FamilyKnowledgeParentGodparentPerson,
  ): string | null {
    if (!person.known) return null;
    if (!person.firstName.trim() && !person.lastName.trim()) {
      return config.validation.missingParentGodparentIdentity;
    }
    return null;
  }

  function validate(): string | null {
    for (const person of values.personalGodparents) {
      if (!person.known) continue;
      if (!person.firstName.trim() && !person.lastName.trim()) {
        return config.validation.missingPersonalIdentity;
      }
    }

    const parentGodparents = [
      values.fatherGodfather,
      values.fatherGodmother,
      values.motherGodfather,
      values.motherGodmother,
    ];

    for (const person of parentGodparents) {
      const err = validateKnownParentGodparent(person);
      if (err) return err;
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
      await saveFamilyKnowledgeGodparents({
        participantId: participantSession.participantId,
        values,
      });

      localStorage.setItem(`connect:${slug}:family-knowledge:godparents`, "done");
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
            <HeartHandshake size={18} className="text-slate-800" />
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
              title={config.sections.personalGodparents.title}
              subtitle={config.sections.personalGodparents.subtitle}
              addLabel={config.sections.personalGodparents.addLabel}
              emptyText={config.sections.personalGodparents.emptyText}
              items={values.personalGodparents}
              onAdd={() =>
                setValues((prev) => ({
                  ...prev,
                  personalGodparents: [
                    ...prev.personalGodparents,
                    createEmptyFamilyKnowledgeGodparentPerson(true),
                  ],
                }))
              }
              renderItem={(person, index) => (
                <PersonalGodparentCard
                  key={index}
                  title={`${config.sections.personalGodparents.itemLabel} ${index + 1}`}
                  value={person}
                  onChange={(patch) => setPersonalGodparent(index, patch)}
                  onRemove={() =>
                    setValues((prev) => ({
                      ...prev,
                      personalGodparents: prev.personalGodparents.filter(
                        (_, i) => i !== index,
                      ),
                    }))
                  }
                />
              )}
            />

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.parentsGodparents.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.parentsGodparents.subtitle}
              </div>

              <div className="mt-4 grid gap-3">
                <ParentGodparentCard
                  title={config.sections.parentsGodparents.fatherGodfatherLabel}
                  value={values.fatherGodfather}
                  onChange={(patch) =>
                    setValues((prev) => ({
                      ...prev,
                      fatherGodfather: { ...prev.fatherGodfather, ...patch },
                    }))
                  }
                />

                <ParentGodparentCard
                  title={config.sections.parentsGodparents.fatherGodmotherLabel}
                  value={values.fatherGodmother}
                  onChange={(patch) =>
                    setValues((prev) => ({
                      ...prev,
                      fatherGodmother: { ...prev.fatherGodmother, ...patch },
                    }))
                  }
                />

                <ParentGodparentCard
                  title={config.sections.parentsGodparents.motherGodfatherLabel}
                  value={values.motherGodfather}
                  onChange={(patch) =>
                    setValues((prev) => ({
                      ...prev,
                      motherGodfather: { ...prev.motherGodfather, ...patch },
                    }))
                  }
                />

                <ParentGodparentCard
                  title={config.sections.parentsGodparents.motherGodmotherLabel}
                  value={values.motherGodmother}
                  onChange={(patch) =>
                    setValues((prev) => ({
                      ...prev,
                      motherGodmother: { ...prev.motherGodmother, ...patch },
                    }))
                  }
                />
              </div>
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

            <div className="mt-2 px-1 text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
              <span>{config.footer.stepLabel}</span>
              <span className="text-slate-900">
                {loading ? "…" : config.footer.readyLabel}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}