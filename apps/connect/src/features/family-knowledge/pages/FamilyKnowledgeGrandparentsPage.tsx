// features/family-knowledge/pages/FamilyKnowledgeGrandparentsPage.tsx

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Network,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPersonForm } from "../components/FamilyPersonForm";
import { RelationshipTypeField } from "../components/RelationshipTypeField";
import {
  SiblingOrderField,
  type SiblingOrderItem,
} from "../components/SiblingOrderField";
import { grandparentsFormConfig } from "../config/grandparentsFormConfig";
import {
  createEmptyFamilyKnowledgeAuntUnclePerson,
  FATHER_SIBLING_ORDER_KEY,
  getDefaultFamilyKnowledgeGrandparentsValues,
  getFamilyKnowledgeGrandparents,
  MOTHER_SIBLING_ORDER_KEY,
  type FamilyKnowledgeAuntUnclePerson,
  type FamilyKnowledgeGrandparentsValues,
} from "../api/getFamilyKnowledgeGrandparents";
import { saveFamilyKnowledgeGrandparents } from "../api/saveFamilyKnowledgeGrandparents";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import {
  getPersonDisplayName,
  normalizeOrderedKeys,
} from "../lib/siblingOrder";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

function YesNoQuestion({
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  value: "" | "yes" | "no";
  onChange: (value: "" | "yes" | "no") => void;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange("yes")}
        className={[
          "h-12 rounded-2xl border font-extrabold transition",
          value === "yes"
            ? "border-indigo-200 bg-indigo-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-700",
        ].join(" ")}
      >
        {yesLabel}
      </button>

      <button
        type="button"
        onClick={() => onChange("no")}
        className={[
          "h-12 rounded-2xl border font-extrabold transition",
          value === "no"
            ? "border-indigo-200 bg-indigo-50 text-slate-900"
            : "border-slate-200 bg-white text-slate-700",
        ].join(" ")}
      >
        {noLabel}
      </button>
    </div>
  );
}

function AuntUncleCard({
  title,
  value,
  onChange,
  onRemove,
  labels,
}: {
  title: string;
  value: FamilyKnowledgeAuntUnclePerson;
  onChange: (patch: Partial<FamilyKnowledgeAuntUnclePerson>) => void;
  onRemove: () => void;
  labels: any;
}) {
  return (
    <FamilyPersonForm
      title={title}
      value={value}
      onChange={onChange}
      onRemove={onRemove}
      labels={labels}
      extraFields={
        <RelationshipTypeField
          label={labels.relationshipTypeLabel}
          value={value.relationshipType}
          onChange={(relationshipType) =>
            onChange({
              relationshipType: relationshipType as
                | ""
                | "both_parents"
                | "father_only"
                | "mother_only",
            })
          }
          options={[
            {
              value: "both_parents",
              label: "Enfant de tes deux grands-parents",
            },
            {
              value: "father_only",
              label: "Enfant du grand-père seulement",
            },
            {
              value: "mother_only",
              label: "Enfant de la grand-mère seulement",
            },
          ]}
        />
      }
    />
  );
}

export function FamilyKnowledgeGrandparentsPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeGrandparentsValues>(
    getDefaultFamilyKnowledgeGrandparentsValues(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = grandparentsFormConfig;
  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/family-knowledge/grandparents`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
    let isMounted = true;

    async function loadExistingData() {
      const session = getParticipantSession(slug);

      if (!session?.participantId) {
        if (isMounted) {
          setLoadingInitialData(false);
        }
        return;
      }

      try {
        const existing = await getFamilyKnowledgeGrandparents({
          participantId: session.participantId,
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

  const paternalOrderItems = useMemo(() => {
    const knownKeys = values.paternalAuntsUncles
      .filter((person) => person.known)
      .map((person) => `paternal:${person.id}`);

    const order = normalizeOrderedKeys({
      existingKeys: values.paternalSiblingOrder,
      allowedKeys: [FATHER_SIBLING_ORDER_KEY, ...knownKeys],
      fixedKey: FATHER_SIBLING_ORDER_KEY,
    });

    const items: Array<SiblingOrderItem | null> = order.map((key) => {
      if (key === FATHER_SIBLING_ORDER_KEY) {
        return {
          key,
          label: config.sections.paternalAuntsUncles.selfLabel,
          meta: "Lecture seule",
          readOnly: true,
        };
      }

      const personId = key.replace("paternal:", "");
      const person = values.paternalAuntsUncles.find((item) => item.id === personId);

      if (!person || !person.known) {
        return null;
      }

      return {
        key,
        label: getPersonDisplayName(person),
        meta: "Oncle / tante paternel(le)",
        readOnly: false,
      };
    });

    return items.filter((item): item is SiblingOrderItem => item !== null);
  }, [
    config.sections.paternalAuntsUncles.selfLabel,
    values.paternalAuntsUncles,
    values.paternalSiblingOrder,
  ]);

  const maternalOrderItems = useMemo(() => {
    const knownKeys = values.maternalAuntsUncles
      .filter((person) => person.known)
      .map((person) => `maternal:${person.id}`);

    const order = normalizeOrderedKeys({
      existingKeys: values.maternalSiblingOrder,
      allowedKeys: [MOTHER_SIBLING_ORDER_KEY, ...knownKeys],
      fixedKey: MOTHER_SIBLING_ORDER_KEY,
    });

    const items: Array<SiblingOrderItem | null> = order.map((key) => {
      if (key === MOTHER_SIBLING_ORDER_KEY) {
        return {
          key,
          label: config.sections.maternalAuntsUncles.selfLabel,
          meta: "Lecture seule",
          readOnly: true,
        };
      }

      const personId = key.replace("maternal:", "");
      const person = values.maternalAuntsUncles.find((item) => item.id === personId);

      if (!person || !person.known) {
        return null;
      }

      return {
        key,
        label: getPersonDisplayName(person),
        meta: "Oncle / tante maternel(le)",
        readOnly: false,
      };
    });

    return items.filter((item): item is SiblingOrderItem => item !== null);
  }, [
    config.sections.maternalAuntsUncles.selfLabel,
    values.maternalAuntsUncles,
    values.maternalSiblingOrder,
  ]);

  function setPaternalAuntUncle(
    index: number,
    patch: Partial<FamilyKnowledgeAuntUnclePerson>,
  ) {
    setValues((prev) => ({
      ...prev,
      paternalAuntsUncles: prev.paternalAuntsUncles.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function setMaternalAuntUncle(
    index: number,
    patch: Partial<FamilyKnowledgeAuntUnclePerson>,
  ) {
    setValues((prev) => ({
      ...prev,
      maternalAuntsUncles: prev.maternalAuntsUncles.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function validateAuntUncle(person: FamilyKnowledgeAuntUnclePerson): string | null {
    if (!person.known) return null;

    if (!person.firstName.trim() && !person.lastName.trim()) {
      return config.validation.missingAuntUncleIdentity;
    }

    if (!person.relationshipType) {
      return config.validation.missingAuntUncleRelationship;
    }

    return null;
  }

  function validate(): string | null {
    const grandparents = [
      values.paternalGrandfather,
      values.paternalGrandmother,
      values.maternalGrandfather,
      values.maternalGrandmother,
    ];

    for (const gp of grandparents) {
      if (!gp.known) continue;
      if (!gp.firstName.trim() && !gp.lastName.trim()) {
        return config.validation.missingGrandparentIdentity;
      }
    }

    if (!values.hasPaternalAuntsUncles) {
      return config.validation.missingPaternalAuntsUnclesAnswer;
    }

    if (values.hasPaternalAuntsUncles === "yes") {
      for (const person of values.paternalAuntsUncles) {
        const err = validateAuntUncle(person);
        if (err) return err;
      }

      if (values.knowsFatherSiblingOrder) {
        const knownKeys = values.paternalAuntsUncles
          .filter((person) => person.known)
          .map((person) => `paternal:${person.id}`);

        const normalizedOrder = normalizeOrderedKeys({
          existingKeys: values.paternalSiblingOrder,
          allowedKeys: [FATHER_SIBLING_ORDER_KEY, ...knownKeys],
          fixedKey: FATHER_SIBLING_ORDER_KEY,
        });

        const missingKnownPerson = knownKeys.some(
          (key) => !normalizedOrder.includes(key),
        );

        if (
          !normalizedOrder.includes(FATHER_SIBLING_ORDER_KEY) ||
          missingKnownPerson
        ) {
          return config.validation.missingFatherSiblingOrder;
        }
      }
    }

    if (!values.hasMaternalAuntsUncles) {
      return config.validation.missingMaternalAuntsUnclesAnswer;
    }

    if (values.hasMaternalAuntsUncles === "yes") {
      for (const person of values.maternalAuntsUncles) {
        const err = validateAuntUncle(person);
        if (err) return err;
      }

      if (values.knowsMotherSiblingOrder) {
        const knownKeys = values.maternalAuntsUncles
          .filter((person) => person.known)
          .map((person) => `maternal:${person.id}`);

        const normalizedOrder = normalizeOrderedKeys({
          existingKeys: values.maternalSiblingOrder,
          allowedKeys: [MOTHER_SIBLING_ORDER_KEY, ...knownKeys],
          fixedKey: MOTHER_SIBLING_ORDER_KEY,
        });

        const missingKnownPerson = knownKeys.some(
          (key) => !normalizedOrder.includes(key),
        );

        if (
          !normalizedOrder.includes(MOTHER_SIBLING_ORDER_KEY) ||
          missingKnownPerson
        ) {
          return config.validation.missingMotherSiblingOrder;
        }
      }
    }

    return null;
  }

  function addPaternalAuntUncle() {
    setValues((prev) => {
      const nextPerson = createEmptyFamilyKnowledgeAuntUnclePerson(true);

      return {
        ...prev,
        hasPaternalAuntsUncles: "yes",
        paternalAuntsUncles: [...prev.paternalAuntsUncles, nextPerson],
        paternalSiblingOrder: normalizeOrderedKeys({
          existingKeys: prev.paternalSiblingOrder,
          allowedKeys: [
            FATHER_SIBLING_ORDER_KEY,
            ...prev.paternalAuntsUncles
              .filter((person) => person.known)
              .map((person) => `paternal:${person.id}`),
            `paternal:${nextPerson.id}`,
          ],
          fixedKey: FATHER_SIBLING_ORDER_KEY,
        }),
      };
    });
  }

  function addMaternalAuntUncle() {
    setValues((prev) => {
      const nextPerson = createEmptyFamilyKnowledgeAuntUnclePerson(true);

      return {
        ...prev,
        hasMaternalAuntsUncles: "yes",
        maternalAuntsUncles: [...prev.maternalAuntsUncles, nextPerson],
        maternalSiblingOrder: normalizeOrderedKeys({
          existingKeys: prev.maternalSiblingOrder,
          allowedKeys: [
            MOTHER_SIBLING_ORDER_KEY,
            ...prev.maternalAuntsUncles
              .filter((person) => person.known)
              .map((person) => `maternal:${person.id}`),
            `maternal:${nextPerson.id}`,
          ],
          fixedKey: MOTHER_SIBLING_ORDER_KEY,
        }),
      };
    });
  }

  function removePaternalAuntUncle(index: number) {
    setValues((prev) => {
      const removed = prev.paternalAuntsUncles[index];

      return {
        ...prev,
        paternalAuntsUncles: prev.paternalAuntsUncles.filter((_, i) => i !== index),
        paternalSiblingOrder: prev.paternalSiblingOrder.filter(
          (key) => key !== `paternal:${removed.id}`,
        ),
      };
    });
  }

  function removeMaternalAuntUncle(index: number) {
    setValues((prev) => {
      const removed = prev.maternalAuntsUncles[index];

      return {
        ...prev,
        maternalAuntsUncles: prev.maternalAuntsUncles.filter((_, i) => i !== index),
        maternalSiblingOrder: prev.maternalSiblingOrder.filter(
          (key) => key !== `maternal:${removed.id}`,
        ),
      };
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const session = getParticipantSession(slug);
    if (!session?.participantId) {
      setError(config.validation.missingParticipant);
      return;
    }

    setLoading(true);

    try {
      await saveFamilyKnowledgeGrandparents({
        participantId: session.participantId,
        values: {
          ...values,
          paternalSiblingOrder: paternalOrderItems.map((item) => item.key),
          maternalSiblingOrder: maternalOrderItems.map((item) => item.key),
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
              <Network size={14} />
              Famille élargie
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

        {loadingInitialData ? (
          <section className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-bold text-slate-700">
              Chargement des informations…
            </div>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="mt-3 grid gap-3">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[16px] font-black text-slate-900">
                Famille paternelle
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Les grands-parents et la fratrie de ton père.
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {config.sections.grandparents.title}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    Branche du père
                  </div>

                  <div className="mt-4 grid gap-3">
                    <FamilyPersonForm
                      title={config.sections.grandparents.paternalGrandfatherLabel}
                      value={values.paternalGrandfather}
                      onChange={(patch) =>
                        setValues((prev) => ({
                          ...prev,
                          paternalGrandfather: {
                            ...prev.paternalGrandfather,
                            ...patch,
                          },
                        }))
                      }
                      labels={config.personFields}
                    />

                    <FamilyPersonForm
                      title={config.sections.grandparents.paternalGrandmotherLabel}
                      value={values.paternalGrandmother}
                      onChange={(patch) =>
                        setValues((prev) => ({
                          ...prev,
                          paternalGrandmother: {
                            ...prev.paternalGrandmother,
                            ...patch,
                          },
                        }))
                      }
                      labels={config.personFields}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[16px] font-black text-slate-900">
                    {config.sections.paternalAuntsUncles.title}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {config.sections.paternalAuntsUncles.subtitle}
                  </div>

                  <div className="mt-4 grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">
                      {config.sections.paternalAuntsUncles.questionLabel}
                    </span>

                    <YesNoQuestion
                      value={values.hasPaternalAuntsUncles}
                      onChange={(next) =>
                        setValues((prev) => ({
                          ...prev,
                          hasPaternalAuntsUncles: next,
                          paternalAuntsUncles:
                            next === "yes" ? prev.paternalAuntsUncles : [],
                          knowsFatherSiblingOrder:
                            next === "yes" ? prev.knowsFatherSiblingOrder : false,
                          paternalSiblingOrder:
                            next === "yes"
                              ? prev.paternalSiblingOrder
                              : [FATHER_SIBLING_ORDER_KEY],
                        }))
                      }
                      yesLabel={config.personFields.yesLabel}
                      noLabel={config.personFields.noLabel}
                    />
                  </div>

                  {values.hasPaternalAuntsUncles === "yes" ? (
                    <>
                      <div className="mt-4 grid gap-3">
                        {values.paternalAuntsUncles.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
                            {config.sections.paternalAuntsUncles.emptyText}
                          </div>
                        ) : null}

                        {values.paternalAuntsUncles.map((person, index) => (
                          <AuntUncleCard
                            key={person.id}
                            title={`${config.sections.paternalAuntsUncles.itemLabel} ${index + 1}`}
                            value={person}
                            onChange={(patch) => setPaternalAuntUncle(index, patch)}
                            onRemove={() => removePaternalAuntUncle(index)}
                            labels={config.personFields}
                          />
                        ))}

                        <button
                          type="button"
                          onClick={addPaternalAuntUncle}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-sm font-extrabold text-slate-900"
                        >
                          <Plus size={16} />
                          {config.sections.paternalAuntsUncles.addLabel}
                        </button>
                      </div>

                      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={values.knowsFatherSiblingOrder}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              knowsFatherSiblingOrder: e.target.checked,
                              paternalSiblingOrder: e.target.checked
                                ? normalizeOrderedKeys({
                                    existingKeys: prev.paternalSiblingOrder,
                                    allowedKeys: [
                                      FATHER_SIBLING_ORDER_KEY,
                                      ...prev.paternalAuntsUncles
                                        .filter((person) => person.known)
                                        .map((person) => `paternal:${person.id}`),
                                    ],
                                    fixedKey: FATHER_SIBLING_ORDER_KEY,
                                  })
                                : prev.paternalSiblingOrder,
                            }))
                          }
                        />
                        <div>
                          <div className="text-sm font-black text-slate-900">
                            {config.sections.paternalAuntsUncles.knowsOrderLabel}
                          </div>
                          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                            {config.sections.paternalAuntsUncles.knowsOrderHelp}
                          </div>
                        </div>
                      </label>

                      {values.knowsFatherSiblingOrder ? (
                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                          <SiblingOrderField
                            label={config.sections.paternalAuntsUncles.orderLabel}
                            helpText={config.sections.paternalAuntsUncles.orderHelp}
                            items={paternalOrderItems}
                            onChange={(items) =>
                              setValues((prev) => ({
                                ...prev,
                                paternalSiblingOrder: items.map((item) => item.key),
                              }))
                            }
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[16px] font-black text-slate-900">
                Famille maternelle
              </div>
              <div className="mt-1 text-sm font-bold text-slate-700">
                Les grands-parents et la fratrie de ta mère.
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {config.sections.grandparents.title}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    Branche de la mère
                  </div>

                  <div className="mt-4 grid gap-3">
                    <FamilyPersonForm
                      title={config.sections.grandparents.maternalGrandfatherLabel}
                      value={values.maternalGrandfather}
                      onChange={(patch) =>
                        setValues((prev) => ({
                          ...prev,
                          maternalGrandfather: {
                            ...prev.maternalGrandfather,
                            ...patch,
                          },
                        }))
                      }
                      labels={config.personFields}
                    />

                    <FamilyPersonForm
                      title={config.sections.grandparents.maternalGrandmotherLabel}
                      value={values.maternalGrandmother}
                      onChange={(patch) =>
                        setValues((prev) => ({
                          ...prev,
                          maternalGrandmother: {
                            ...prev.maternalGrandmother,
                            ...patch,
                          },
                        }))
                      }
                      labels={config.personFields}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[16px] font-black text-slate-900">
                    {config.sections.maternalAuntsUncles.title}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-700">
                    {config.sections.maternalAuntsUncles.subtitle}
                  </div>

                  <div className="mt-4 grid gap-1">
                    <span className="text-xs font-extrabold text-slate-800">
                      {config.sections.maternalAuntsUncles.questionLabel}
                    </span>

                    <YesNoQuestion
                      value={values.hasMaternalAuntsUncles}
                      onChange={(next) =>
                        setValues((prev) => ({
                          ...prev,
                          hasMaternalAuntsUncles: next,
                          maternalAuntsUncles:
                            next === "yes" ? prev.maternalAuntsUncles : [],
                          knowsMotherSiblingOrder:
                            next === "yes" ? prev.knowsMotherSiblingOrder : false,
                          maternalSiblingOrder:
                            next === "yes"
                              ? prev.maternalSiblingOrder
                              : [MOTHER_SIBLING_ORDER_KEY],
                        }))
                      }
                      yesLabel={config.personFields.yesLabel}
                      noLabel={config.personFields.noLabel}
                    />
                  </div>

                  {values.hasMaternalAuntsUncles === "yes" ? (
                    <>
                      <div className="mt-4 grid gap-3">
                        {values.maternalAuntsUncles.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-bold text-slate-600">
                            {config.sections.maternalAuntsUncles.emptyText}
                          </div>
                        ) : null}

                        {values.maternalAuntsUncles.map((person, index) => (
                          <AuntUncleCard
                            key={person.id}
                            title={`${config.sections.maternalAuntsUncles.itemLabel} ${index + 1}`}
                            value={person}
                            onChange={(patch) => setMaternalAuntUncle(index, patch)}
                            onRemove={() => removeMaternalAuntUncle(index)}
                            labels={config.personFields}
                          />
                        ))}

                        <button
                          type="button"
                          onClick={addMaternalAuntUncle}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-sm font-extrabold text-slate-900"
                        >
                          <Plus size={16} />
                          {config.sections.maternalAuntsUncles.addLabel}
                        </button>
                      </div>

                      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={values.knowsMotherSiblingOrder}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              knowsMotherSiblingOrder: e.target.checked,
                              maternalSiblingOrder: e.target.checked
                                ? normalizeOrderedKeys({
                                    existingKeys: prev.maternalSiblingOrder,
                                    allowedKeys: [
                                      MOTHER_SIBLING_ORDER_KEY,
                                      ...prev.maternalAuntsUncles
                                        .filter((person) => person.known)
                                        .map((person) => `maternal:${person.id}`),
                                    ],
                                    fixedKey: MOTHER_SIBLING_ORDER_KEY,
                                  })
                                : prev.maternalSiblingOrder,
                            }))
                          }
                        />
                        <div>
                          <div className="text-sm font-black text-slate-900">
                            {config.sections.maternalAuntsUncles.knowsOrderLabel}
                          </div>
                          <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                            {config.sections.maternalAuntsUncles.knowsOrderHelp}
                          </div>
                        </div>
                      </label>

                      {values.knowsMotherSiblingOrder ? (
                        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                          <SiblingOrderField
                            label={config.sections.maternalAuntsUncles.orderLabel}
                            helpText={config.sections.maternalAuntsUncles.orderHelp}
                            items={maternalOrderItems}
                            onChange={(items) =>
                              setValues((prev) => ({
                                ...prev,
                                maternalSiblingOrder: items.map((item) => item.key),
                              }))
                            }
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
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
              {loading ? config.footer.loadingLabel : config.footer.submitLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}