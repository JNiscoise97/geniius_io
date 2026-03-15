import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { FamilyPersonForm } from "../components/FamilyPersonForm";
import { SiblingOrderField, type SiblingOrderItem } from "../components/SiblingOrderField";
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
import {
  getPersonDisplayName,
  normalizeOrderedKeys,
} from "../lib/siblingOrder";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

const SELF_SIBLING_ORDER_KEY = "self";

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
  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  useEffect(() => {
      if (!participantId) return;
  
      const tracker = createPageTimeTracker({
        participantId,
        eventSlug: slug,
        pageKey: `/e/${slug}/family-knowledge/close-family`,
      });
  
      tracker.start();
  
      return () => {
        void tracker.stop();
      };
    }, [participantId, slug]);

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

  const siblingOrderItems = useMemo(() => {
    const knownSiblingKeys = values.siblings
      .filter((sibling) => sibling.known)
      .map((sibling) => `sibling:${sibling.id}`);

    const order = normalizeOrderedKeys({
      existingKeys: values.siblingOrder,
      allowedKeys: [SELF_SIBLING_ORDER_KEY, ...knownSiblingKeys],
      fixedKey: SELF_SIBLING_ORDER_KEY,
    });

    const items: Array<SiblingOrderItem | null> = order.map((key) => {
      if (key === SELF_SIBLING_ORDER_KEY) {
        return {
          key,
          label: config.sections.siblings.selfLabel,
          meta: "Individu courant",
          readOnly: true,
        };
      }

      const siblingId = key.replace("sibling:", "");
      const sibling = values.siblings.find((item) => item.id === siblingId);

      if (!sibling || !sibling.known) {
        return null;
      }

      return {
        key,
        label: getPersonDisplayName(sibling),
        meta: "Frère / sœur",
        readOnly: false,
      };
    });

    return items.filter(
      (item): item is SiblingOrderItem => item !== null,
    );
  }, [config.sections.siblings.selfLabel, values.siblingOrder, values.siblings]);

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

    if (!values.hasSiblings) {
      return "Merci d’indiquer si tu as des frères et sœurs.";
    }

    if (values.hasSiblings === "yes") {
      for (let i = 0; i < values.siblings.length; i += 1) {
        const siblingError = validateKnownPerson(
          values.siblings[i],
          `${config.validation.siblingLabel} #${i + 1}`,
        );
        if (siblingError) return siblingError;
      }

      if (values.knowsSiblingOrder) {
        const knownSiblingKeys = values.siblings
          .filter((sibling) => sibling.known)
          .map((sibling) => `sibling:${sibling.id}`);

        const normalizedOrder = normalizeOrderedKeys({
          existingKeys: values.siblingOrder,
          allowedKeys: [SELF_SIBLING_ORDER_KEY, ...knownSiblingKeys],
          fixedKey: SELF_SIBLING_ORDER_KEY,
        });

        const missingKnownSibling = knownSiblingKeys.some(
          (key) => !normalizedOrder.includes(key),
        );

        if (!normalizedOrder.includes(SELF_SIBLING_ORDER_KEY) || missingKnownSibling) {
          return config.validation.missingSiblingOrder;
        }
      }
    }

    if (!values.hasChildren) {
      return "Merci d’indiquer si tu as des enfants.";
    }

    if (values.hasChildren === "yes") {
      for (let i = 0; i < values.children.length; i += 1) {
        const childError = validateKnownPerson(
          values.children[i],
          `${config.validation.childLabel} #${i + 1}`,
        );
        if (childError) return childError;
      }
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

  function setSibling(
    index: number,
    patch: Partial<FamilyKnowledgePersonEntry>,
  ) {
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

  function addSibling() {
    setValues((prev) => {
      const nextSibling = createEmptyFamilyKnowledgePerson(true);

      return {
        ...prev,
        hasSiblings: "yes",
        siblings: [...prev.siblings, nextSibling],
        siblingOrder: normalizeOrderedKeys({
          existingKeys: prev.siblingOrder,
          allowedKeys: [
            SELF_SIBLING_ORDER_KEY,
            ...prev.siblings
              .filter((sibling) => sibling.known)
              .map((sibling) => `sibling:${sibling.id}`),
            `sibling:${nextSibling.id}`,
          ],
          fixedKey: SELF_SIBLING_ORDER_KEY,
        }),
      };
    });
  }

  function removeSibling(index: number) {
    setValues((prev) => {
      const removed = prev.siblings[index];
      const nextSiblings = prev.siblings.filter((_, i) => i !== index);

      return {
        ...prev,
        siblings: nextSiblings,
        siblingOrder: prev.siblingOrder.filter(
          (key) => key !== `sibling:${removed.id}`,
        ),
      };
    });
  }

  function addChild() {
    setValues((prev) => ({
      ...prev,
      hasChildren: "yes",
      children: [...prev.children, createEmptyFamilyKnowledgePerson(true)],
    }));
  }

  function setHasSiblings(next: "" | "yes" | "no") {
    setValues((prev) => ({
      ...prev,
      hasSiblings: next,
      siblings: next === "yes" ? prev.siblings : [],
      knowsSiblingOrder: next === "yes" ? prev.knowsSiblingOrder : false,
      siblingOrder: next === "yes" ? prev.siblingOrder : [SELF_SIBLING_ORDER_KEY],
    }));
  }

  function setHasChildren(next: "" | "yes" | "no") {
    setValues((prev) => ({
      ...prev,
      hasChildren: next,
      children: next === "yes" ? prev.children : [],
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
        values: {
          ...values,
          siblingOrder: siblingOrderItems.map((item) => item.key),
        },
      });

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
              Famille proche
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
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.siblings.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.siblings.subtitle}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasSiblings("yes")}
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    values.hasSiblings === "yes"
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {config.personFields.yesLabel}
                </button>

                <button
                  type="button"
                  onClick={() => setHasSiblings("no")}
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    values.hasSiblings === "no"
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {config.personFields.noLabel}
                </button>
              </div>

              {values.hasSiblings === "yes" ? (
                <>
                  <div className="mt-4 grid gap-3">
                    {values.siblings.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                        {config.sections.siblings.emptyText}
                      </div>
                    ) : null}

                    {values.siblings.map((sibling, index) => (
                      <FamilyPersonForm
                        key={sibling.id}
                        title={`${config.sections.siblings.itemLabel} ${index + 1}`}
                        value={sibling}
                        onChange={(patch) => setSibling(index, patch)}
                        onRemove={() => removeSibling(index)}
                        labels={config.personFields}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={addSibling}
                      className="h-10 px-3 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 border bg-indigo-50 text-slate-900 border-indigo-100"
                    >
                      <Plus size={16} />
                      {config.sections.siblings.addLabel}
                    </button>

                    <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={values.knowsSiblingOrder}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            knowsSiblingOrder: e.target.checked,
                            siblingOrder: e.target.checked
                              ? normalizeOrderedKeys({
                                existingKeys: prev.siblingOrder,
                                allowedKeys: [
                                  SELF_SIBLING_ORDER_KEY,
                                  ...prev.siblings
                                    .filter((sibling) => sibling.known)
                                    .map((sibling) => `sibling:${sibling.id}`),
                                ],
                                fixedKey: SELF_SIBLING_ORDER_KEY,
                              })
                              : prev.siblingOrder,
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

                    {values.knowsSiblingOrder ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <SiblingOrderField
                          label={config.sections.siblings.orderLabel}
                          helpText={config.sections.siblings.orderHelp}
                          items={siblingOrderItems}
                          onChange={(items) =>
                            setValues((prev) => ({
                              ...prev,
                              siblingOrder: items.map((item) => item.key),
                            }))
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </section>

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.children.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.children.subtitle}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHasChildren("yes")}
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    values.hasChildren === "yes"
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {config.personFields.yesLabel}
                </button>

                <button
                  type="button"
                  onClick={() => setHasChildren("no")}
                  className={[
                    "h-12 rounded-2xl border font-extrabold transition",
                    values.hasChildren === "no"
                      ? "border-indigo-200 bg-indigo-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  {config.personFields.noLabel}
                </button>
              </div>

              {values.hasChildren === "yes" ? (
                <>
                  <div className="mt-4 grid gap-3">
                    <FamilyPeopleList
                      title=""
                      emptyText={config.sections.children.emptyText}
                      items={values.children}
                      renderItem={(child, index) => (
                        <FamilyPersonForm
                          key={child.id}
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

                    <button
                      type="button"
                      onClick={addChild}
                      className="h-10 px-3 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 border bg-indigo-50 text-slate-900 border-indigo-100"
                    >
                      <Plus size={16} />
                      {config.sections.children.addLabel}
                    </button>
                  </div>
                </>
              ) : null}
            </section>

            <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="text-[16px] font-black text-slate-900">
                {config.sections.partner.title}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                {config.sections.partner.subtitle}
              </div>

              <div className="mt-4">
                <div className="text-xs font-extrabold text-slate-800">
                  {config.sections.partner.fieldLabel}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        isInRelationship: "yes",
                      }))
                    }
                    className={[
                      "h-12 rounded-2xl border font-extrabold transition",
                      values.isInRelationship === "yes"
                        ? "border-indigo-200 bg-indigo-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700",
                    ].join(" ")}
                  >
                    {config.personFields.yesLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setValues((prev) => ({
                        ...prev,
                        isInRelationship: "no",
                        partner: createEmptyFamilyKnowledgePerson(false),
                      }))
                    }
                    className={[
                      "h-12 rounded-2xl border font-extrabold transition",
                      values.isInRelationship === "no"
                        ? "border-indigo-200 bg-indigo-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700",
                    ].join(" ")}
                  >
                    {config.personFields.noLabel}
                  </button>
                </div>
              </div>

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
          </div>
        </div>
      </footer>
    </div>
  );
}