import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { FamilyPersonForm } from "../components/FamilyPersonForm";
import { closeFamilyFormConfig } from "../config/closeFamilyFormConfig";
import {
  createEmptyFamilyKnowledgePerson,
  getDefaultFamilyKnowledgeCloseFamilyValues,
  getFamilyKnowledgeCloseFamily,
  type FamilyKnowledgeCloseFamilyValues,
  type FamilyKnowledgePersonEntry,
} from "../api/getFamilyKnowledgeCloseFamily";
import { saveFamilyKnowledgeCloseFamily } from "../api/saveFamilyKnowledgeCloseFamily";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";



export function FamilyKnowledgeCloseFamilyPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeCloseFamilyValues>(
    getDefaultFamilyKnowledgeCloseFamilyValues(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = closeFamilyFormConfig;

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
        const existing = await getFamilyKnowledgeCloseFamily({
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

  function validateKnownPerson(
    person: FamilyKnowledgePersonEntry,
    label: string,
  ): string | null {
    if (!person.known) return null;
    if (!person.firstName.trim() && !person.lastName.trim()) {
      return `${config.validation.missingIdentity} ${label}.`;
    }
    return null;
  }

  function validate(): string | null {
    const parent1Error = validateKnownPerson(
      values.parent1,
      config.validation.parent1Label,
    );
    if (parent1Error) return parent1Error;

    const parent2Error = validateKnownPerson(
      values.parent2,
      config.validation.parent2Label,
    );
    if (parent2Error) return parent2Error;

    for (let i = 0; i < values.siblings.length; i += 1) {
      const err = validateKnownPerson(
        values.siblings[i],
        `${config.validation.siblingLabel} #${i + 1}`,
      );
      if (err) return err;
    }

    if (values.knowsSiblingOrder) {
      const siblingWithMissingOrder = values.siblings.find(
        (s) => s.known && !s.birthOrder.trim(),
      );
      if (siblingWithMissingOrder) {
        return config.validation.missingSiblingOrder;
      }
    }

    for (let i = 0; i < values.children.length; i += 1) {
      const err = validateKnownPerson(
        values.children[i],
        `${config.validation.childLabel} #${i + 1}`,
      );
      if (err) return err;
    }

    if (values.isInRelationship === "yes") {
      const partnerError = validateKnownPerson(
        values.partner,
        config.validation.partnerLabel,
      );
      if (partnerError) return partnerError;
    }

    return null;
  }

  function setSibling(index: number, patch: Partial<FamilyKnowledgePersonEntry>) {
    setValues((prev) => ({
      ...prev,
      siblings: prev.siblings.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function setChild(index: number, patch: Partial<FamilyKnowledgePersonEntry>) {
    setValues((prev) => ({
      ...prev,
      children: prev.children.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
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
      await saveFamilyKnowledgeCloseFamily({
        participantId: participantSession.participantId,
        values,
      });

      localStorage.setItem(`connect:${slug}:family-knowledge:close_family`, "done");
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
            <Users size={18} className="text-slate-800" />
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
            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.parents.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.parents.subtitle}
              </div>

              <div className="mt-4 grid gap-3">
                <FamilyPersonForm
                  title={config.sections.parents.parent1Label}
                  value={values.parent1}
                  onChange={(patch) =>
                    setValues((prev) => ({
                      ...prev,
                      parent1: { ...prev.parent1, ...patch },
                    }))
                  }
                  labels={config.personFields}
                />

                <FamilyPersonForm
                  title={config.sections.parents.parent2Label}
                  value={values.parent2}
                  onChange={(patch) =>
                    setValues((prev) => ({
                      ...prev,
                      parent2: { ...prev.parent2, ...patch },
                    }))
                  }
                  labels={config.personFields}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-black text-slate-900">
                    {config.sections.siblings.title}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {config.sections.siblings.subtitle}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({
                      ...prev,
                      siblings: [
                        ...prev.siblings,
                        createEmptyFamilyKnowledgePerson(true),
                      ],
                    }))
                  }
                  className="h-10 px-3 rounded-xl font-extrabold text-sm inline-flex items-center gap-2 border bg-indigo-50 text-slate-900 border-indigo-100"
                >
                  <Plus size={16} />
                  {config.sections.siblings.addLabel}
                </button>
              </div>

              <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={values.knowsSiblingOrder}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      knowsSiblingOrder: e.target.checked,
                    }))
                  }
                />
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {config.sections.siblings.knowsOrderLabel}
                  </div>
                  <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                    {config.sections.siblings.knowsOrderHelp}
                  </div>
                </div>
              </label>

              <div className="mt-4 grid gap-3">
                {values.siblings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                    {config.sections.siblings.emptyText}
                  </div>
                ) : null}

                {values.siblings.map((sibling, index) => (
                  <FamilyPersonForm
                    key={index}
                    title={`${config.sections.siblings.itemLabel} ${index + 1}`}
                    value={sibling}
                    showBirthOrder={values.knowsSiblingOrder}
                    onChange={(patch) => setSibling(index, patch)}
                    onRemove={() =>
                      setValues((prev) => ({
                        ...prev,
                        siblings: prev.siblings.filter((_, i) => i !== index),
                      }))
                    }
                    labels={config.personFields}
                  />
                ))}
              </div>
            </section>

            <FamilyPeopleList
              title={config.sections.children.title}
              subtitle={config.sections.children.subtitle}
              addLabel={config.sections.children.addLabel}
              emptyText={config.sections.children.emptyText}
              items={values.children}
              onAdd={() =>
                setValues((prev) => ({
                  ...prev,
                  children: [
                    ...prev.children,
                    createEmptyFamilyKnowledgePerson(true),
                  ],
                }))
              }
              renderItem={(child, index) => (
                <FamilyPersonForm
                  key={index}
                  title={`${config.sections.children.itemLabel} ${index + 1}`}
                  value={child}
                  onChange={(patch) => setChild(index, patch)}
                  onRemove={() =>
                    setValues((prev) => ({
                      ...prev,
                      children: prev.children.filter((_, i) => i !== index),
                    }))
                  }
                  labels={config.personFields}
                />
              )}
            />

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.partner.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.partner.subtitle}
              </div>

              <label className="grid gap-1 mt-4">
                <span className="text-xs font-extrabold text-slate-800">
                  {config.sections.partner.fieldLabel}
                </span>
                <select
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={values.isInRelationship}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      isInRelationship: e.target.value as "" | "yes" | "no",
                    }))
                  }
                >
                  <option value="">{config.personFields.chooseLabel}</option>
                  <option value="yes">{config.personFields.yesLabel}</option>
                  <option value="no">{config.personFields.noLabel}</option>
                </select>
              </label>

              {values.isInRelationship === "yes" ? (
                <div className="mt-4">
                  <FamilyPersonForm
                    title={config.sections.partner.partnerLabel}
                    value={values.partner}
                    onChange={(patch) =>
                      setValues((prev) => ({
                        ...prev,
                        partner: { ...prev.partner, ...patch },
                      }))
                    }
                    labels={config.personFields}
                  />
                </div>
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