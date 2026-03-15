import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { KnownToggleField } from "../components/KnownToggleField";
import { LivingStatusField } from "../components/LivingStatusField";
import { PhotoPresenceField } from "../components/PhotoPresenceField";
import { godparentsFormConfig } from "../config/godparentsFormConfig";
import {
  createEmptyFamilyKnowledgeGodchildPerson,
  getDefaultFamilyKnowledgeGodparentsValues,
  getFamilyKnowledgeGodparents,
  type FamilyKnowledgeGodchildPerson,
  type FamilyKnowledgeGodparentLinkPerson,
  type FamilyKnowledgeGodparentsValues,
  type FamilyKnowledgeParrainageSection,
} from "../api/getFamilyKnowledgeGodparents";
import { saveFamilyKnowledgeGodparents } from "../api/saveFamilyKnowledgeGodparents";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getFamilyKnowledgeCloseFamily } from "../api/getFamilyKnowledgeCloseFamily";
import { getFamilyKnowledgeGrandparents } from "../api/getFamilyKnowledgeGrandparents";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

type VisibleSections = {
  self: boolean;
  father: boolean;
  mother: boolean;
  paternalGrandfather: boolean;
  paternalGrandmother: boolean;
  maternalGrandfather: boolean;
  maternalGrandmother: boolean;
};

type SectionKey = keyof FamilyKnowledgeGodparentsValues;

function personHasIdentity(person: {
  firstName: string;
  lastName: string;
  nickname: string;
}): boolean {
  return Boolean(
    person.firstName.trim() || person.lastName.trim() || person.nickname.trim(),
  );
}

function LinkPersonCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: FamilyKnowledgeGodparentLinkPerson;
  onChange: (patch: Partial<FamilyKnowledgeGodparentLinkPerson>) => void;
}) {
  const labels = godparentsFormConfig.personFields;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[15px] font-black text-slate-900">{title}</div>

      <div className="mt-3">
        <KnownToggleField
          checked={value.known}
          onChange={(checked) =>
            onChange({
              known: checked,
              firstName: checked ? value.firstName : "",
              lastName: checked ? value.lastName : "",
              nickname: checked ? value.nickname : "",
              isAlive: checked ? value.isAlive : "",
              hasPhoto: checked ? value.hasPhoto : "",
              isFamilyMember: checked ? value.isFamilyMember : "",
              familyRelationshipDetail: checked
                ? value.familyRelationshipDetail
                : "",
            })
          }
          label={labels.knownLabel}
          helpText={labels.knownHelp}
        />
      </div>

      {value.known ? (
        <div className="mt-3 grid gap-3">
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

          <LivingStatusField
            value={value.isAlive}
            onChange={(isAlive) => onChange({ isAlive })}
            label={labels.isAliveLabel}
            yesLabel={labels.yesLabel}
            noLabel={labels.noLabel}
          />

          <PhotoPresenceField
            value={value.hasPhoto}
            onChange={(hasPhoto) => onChange({ hasPhoto })}
            label={labels.hasPhotoLabel}
            yesLabel={labels.yesLabel}
            noLabel={labels.noLabel}
          />

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {labels.isFamilyMemberLabel}
            </span>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    isFamilyMember: "yes",
                  })
                }
                className={[
                  "h-12 rounded-2xl border font-extrabold transition",
                  value.isFamilyMember === "yes"
                    ? "border-indigo-200 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {labels.yesLabel}
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    isFamilyMember: "no",
                    familyRelationshipDetail: "",
                  })
                }
                className={[
                  "h-12 rounded-2xl border font-extrabold transition",
                  value.isFamilyMember === "no"
                    ? "border-indigo-200 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {labels.noLabel}
              </button>
            </div>
          </div>

          {value.isFamilyMember === "yes" ? (
            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                Quel lien exact avec la famille ?
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.familyRelationshipDetail}
                onChange={(e) =>
                  onChange({ familyRelationshipDetail: e.target.value })
                }
                placeholder="Ex : tante maternelle, cousin germain, grande-tante…"
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GodchildCard({
  title,
  value,
  onChange,
  onRemove,
}: {
  title: string;
  value: FamilyKnowledgeGodchildPerson;
  onChange: (patch: Partial<FamilyKnowledgeGodchildPerson>) => void;
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3">
        <KnownToggleField
          checked={value.known}
          onChange={(checked) =>
            onChange({
              known: checked,
              firstName: checked ? value.firstName : "",
              lastName: checked ? value.lastName : "",
              nickname: checked ? value.nickname : "",
              isAlive: checked ? value.isAlive : "",
              hasPhoto: checked ? value.hasPhoto : "",
              isFamilyMember: checked ? value.isFamilyMember : "",
              familyRelationshipDetail: checked
                ? value.familyRelationshipDetail
                : "",
            })
          }
          label={labels.knownLabel}
          helpText={labels.knownHelp}
        />
      </div>

      {value.known ? (
        <div className="mt-3 grid gap-3">
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

          <LivingStatusField
            value={value.isAlive}
            onChange={(isAlive) => onChange({ isAlive })}
            label={labels.isAliveLabel}
            yesLabel={labels.yesLabel}
            noLabel={labels.noLabel}
          />

          <PhotoPresenceField
            value={value.hasPhoto}
            onChange={(hasPhoto) => onChange({ hasPhoto })}
            label={labels.hasPhotoLabel}
            yesLabel={labels.yesLabel}
            noLabel={labels.noLabel}
          />

          <div className="grid gap-1">
            <span className="text-xs font-extrabold text-slate-800">
              {labels.isFamilyMemberLabel}
            </span>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    isFamilyMember: "yes",
                  })
                }
                className={[
                  "h-12 rounded-2xl border font-extrabold transition",
                  value.isFamilyMember === "yes"
                    ? "border-indigo-200 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {labels.yesLabel}
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    isFamilyMember: "no",
                    familyRelationshipDetail: "",
                  })
                }
                className={[
                  "h-12 rounded-2xl border font-extrabold transition",
                  value.isFamilyMember === "no"
                    ? "border-indigo-200 bg-indigo-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {labels.noLabel}
              </button>
            </div>
          </div>

          {value.isFamilyMember === "yes" ? (
            <label className="grid gap-1">
              <span className="text-xs font-extrabold text-slate-800">
                Quel lien exact avec la famille ?
              </span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 font-extrabold text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                value={value.familyRelationshipDetail}
                onChange={(e) =>
                  onChange({ familyRelationshipDetail: e.target.value })
                }
                placeholder="Ex : tante maternelle, cousin germain, grande-tante…"
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ParrainageSectionCard({
  title,
  subtitle,
  baptizedQuestion,
  godfatherLabel,
  godmotherLabel,
  hasGodchildrenQuestion,
  godchildrenTitle,
  godchildrenSubtitle,
  godchildrenEmptyText,
  godchildrenItemLabel,
  godchildrenAddLabel,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  baptizedQuestion: string;
  godfatherLabel: string;
  godmotherLabel: string;
  hasGodchildrenQuestion: string;
  godchildrenTitle: string;
  godchildrenSubtitle?: string;
  godchildrenEmptyText: string;
  godchildrenItemLabel: string;
  godchildrenAddLabel: string;
  value: FamilyKnowledgeParrainageSection;
  onChange: (patch: Partial<FamilyKnowledgeParrainageSection>) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[16px] font-black text-slate-900">{title}</div>
      <div className="mt-1 text-sm font-bold text-slate-700">{subtitle}</div>

      <div className="mt-4">
        <div className="text-xs font-extrabold text-slate-800">
          {baptizedQuestion}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                isBaptized: "yes",
              })
            }
            className={[
              "h-12 rounded-2xl border font-extrabold transition",
              value.isBaptized === "yes"
                ? "border-indigo-200 bg-indigo-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            Oui
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                isBaptized: "no",
              })
            }
            className={[
              "h-12 rounded-2xl border font-extrabold transition",
              value.isBaptized === "no"
                ? "border-indigo-200 bg-indigo-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            Non
          </button>
        </div>
      </div>

      {value.isBaptized === "yes" ? (
        <div className="mt-4 grid gap-3">
          <LinkPersonCard
            title={godfatherLabel}
            value={value.godfather}
            onChange={(patch) =>
              onChange({
                godfather: { ...value.godfather, ...patch },
              })
            }
          />

          <LinkPersonCard
            title={godmotherLabel}
            value={value.godmother}
            onChange={(patch) =>
              onChange({
                godmother: { ...value.godmother, ...patch },
              })
            }
          />
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-xs font-extrabold text-slate-800">
          {hasGodchildrenQuestion}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                hasGodchildren: "yes",
              })
            }
            className={[
              "h-12 rounded-2xl border font-extrabold transition",
              value.hasGodchildren === "yes"
                ? "border-indigo-200 bg-indigo-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            Oui
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                hasGodchildren: "no",
                godchildren: [],
              })
            }
            className={[
              "h-12 rounded-2xl border font-extrabold transition",
              value.hasGodchildren === "no"
                ? "border-indigo-200 bg-indigo-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700",
            ].join(" ")}
          >
            Non
          </button>
        </div>
      </div>

      {value.hasGodchildren === "yes" ? (
        <div className="mt-4 grid gap-3">
          <FamilyPeopleList
            title={godchildrenTitle}
            subtitle={godchildrenSubtitle}
            emptyText={godchildrenEmptyText}
            items={value.godchildren}
            renderItem={(person, index) => (
              <GodchildCard
                key={person.id}
                title={`${godchildrenItemLabel} ${index + 1}`}
                value={person}
                onChange={(patch) =>
                  onChange({
                    godchildren: value.godchildren.map((item, i) =>
                      i === index ? { ...item, ...patch } : item,
                    ),
                  })
                }
                onRemove={() =>
                  onChange({
                    godchildren: value.godchildren.filter((_, i) => i !== index),
                  })
                }
              />
            )}
          />

          <button
            type="button"
            onClick={() =>
              onChange({
                godchildren: [
                  ...value.godchildren,
                  createEmptyFamilyKnowledgeGodchildPerson(true),
                ],
              })
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-sm font-extrabold text-slate-900"
          >
            <Plus size={16} />
            {godchildrenAddLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function FamilyKnowledgeGodparentsPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const [values, setValues] = useState<FamilyKnowledgeGodparentsValues>(
    getDefaultFamilyKnowledgeGodparentsValues(),
  );
  const [visibleSections, setVisibleSections] = useState<VisibleSections>({
    self: true,
    father: false,
    mother: false,
    paternalGrandfather: false,
    paternalGrandmother: false,
    maternalGrandfather: false,
    maternalGrandmother: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const config = godparentsFormConfig;
    const participantSession = getParticipantSession(slug);
    const participantId = participantSession?.participantId ?? null;
  
    useEffect(() => {
        if (!participantId) return;
    
        const tracker = createPageTimeTracker({
          participantId,
          eventSlug: slug,
          pageKey: `/e/${slug}/family-knowledge/godparents`,
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
        const [existingGodparents, closeFamily, grandparents] = await Promise.all(
          [
            getFamilyKnowledgeGodparents({
              participantId: participantSession.participantId,
            }),
            getFamilyKnowledgeCloseFamily({
              participantId: participantSession.participantId,
            }),
            getFamilyKnowledgeGrandparents({
              participantId: participantSession.participantId,
            }),
          ],
        );

        if (!isMounted) return;

        if (existingGodparents) {
          setValues(existingGodparents);
        }

        setVisibleSections({
          self: true,
          father: Boolean(closeFamily?.parent1?.known),
          mother: Boolean(closeFamily?.parent2?.known),
          paternalGrandfather: Boolean(grandparents?.paternalGrandfather?.known),
          paternalGrandmother: Boolean(grandparents?.paternalGrandmother?.known),
          maternalGrandfather: Boolean(grandparents?.maternalGrandfather?.known),
          maternalGrandmother: Boolean(grandparents?.maternalGrandmother?.known),
        });
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

  function validateLinkPerson(
    person: FamilyKnowledgeGodparentLinkPerson,
  ): string | null {
    if (!person.known) return null;

    if (!personHasIdentity(person)) {
      return config.validation.missingKnownPersonIdentity;
    }

    if (
      person.isFamilyMember === "yes" &&
      !person.familyRelationshipDetail.trim()
    ) {
      return config.validation.missingFamilyRelationshipDetail;
    }

    return null;
  }

  function validateGodchild(
    person: FamilyKnowledgeGodchildPerson,
  ): string | null {
    if (!person.known) return null;

    if (!personHasIdentity(person)) {
      return config.validation.missingGodchildIdentity;
    }

    if (
      person.isFamilyMember === "yes" &&
      !person.familyRelationshipDetail.trim()
    ) {
      return config.validation.missingFamilyRelationshipDetail;
    }

    return null;
  }

  function validateSection(
    section: FamilyKnowledgeParrainageSection,
  ): string | null {
    if (!section.isBaptized) {
      return config.validation.missingBaptizedAnswer;
    }

    if (section.isBaptized === "yes") {
      const godfatherError = validateLinkPerson(section.godfather);
      if (godfatherError) return godfatherError;

      const godmotherError = validateLinkPerson(section.godmother);
      if (godmotherError) return godmotherError;
    }

    if (!section.hasGodchildren) {
      return config.validation.missingGodchildrenAnswer;
    }

    if (section.hasGodchildren === "yes") {
      for (const godchild of section.godchildren) {
        const godchildError = validateGodchild(godchild);
        if (godchildError) return godchildError;
      }
    }

    return null;
  }

  function validate(): string | null {
    const sectionsToValidate: Array<[boolean, FamilyKnowledgeParrainageSection]> =
      [
        [visibleSections.self, values.self],
        [visibleSections.father, values.father],
        [visibleSections.mother, values.mother],
        [visibleSections.paternalGrandfather, values.paternalGrandfather],
        [visibleSections.paternalGrandmother, values.paternalGrandmother],
        [visibleSections.maternalGrandfather, values.maternalGrandfather],
        [visibleSections.maternalGrandmother, values.maternalGrandmother],
      ];

    for (const [visible, section] of sectionsToValidate) {
      if (!visible) continue;
      const err = validateSection(section);
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

      nav(`/e/${slug}/family-knowledge`);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  function renderSection(sectionKey: SectionKey) {
    const sectionConfig = config.sections[sectionKey];
    const sectionValue = values[sectionKey];

    return (
      <ParrainageSectionCard
        key={sectionKey}
        title={sectionConfig.title}
        subtitle={sectionConfig.subtitle}
        baptizedQuestion={sectionConfig.baptizedQuestion}
        godfatherLabel={sectionConfig.godfatherLabel}
        godmotherLabel={sectionConfig.godmotherLabel}
        hasGodchildrenQuestion={sectionConfig.hasGodchildrenQuestion}
        godchildrenTitle={sectionConfig.godchildrenTitle}
        godchildrenSubtitle={sectionConfig.godchildrenSubtitle}
        godchildrenEmptyText={sectionConfig.godchildrenEmptyText}
        godchildrenItemLabel={sectionConfig.godchildrenItemLabel}
        godchildrenAddLabel={sectionConfig.godchildrenAddLabel}
        value={sectionValue}
        onChange={(patch) =>
          setValues((prev) => ({
            ...prev,
            [sectionKey]: {
              ...prev[sectionKey],
              ...patch,
            },
          }))
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-3 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <HeartHandshake size={14} />
              Liens de parrainage
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
            {visibleSections.self ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[16px] font-black text-slate-900">
                  Pour toi
                </div>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  Ton baptême, tes parrains et marraines, et les éventuels
                  filleuls que tu as eus.
                </div>

                <div className="mt-4">{renderSection("self")}</div>
              </section>
            ) : null}

            {visibleSections.father || visibleSections.mother ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[16px] font-black text-slate-900">
                  Pour tes parents
                </div>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  Les liens de parrainage autour de ton père et de ta mère.
                </div>

                <div className="mt-4 grid gap-3">
                  {visibleSections.father ? renderSection("father") : null}
                  {visibleSections.mother ? renderSection("mother") : null}
                </div>
              </section>
            ) : null}

            {visibleSections.paternalGrandfather ||
            visibleSections.paternalGrandmother ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[16px] font-black text-slate-900">
                  Du côté paternel
                </div>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  Les liens de parrainage de tes grands-parents paternels.
                </div>

                <div className="mt-4 grid gap-3">
                  {visibleSections.paternalGrandfather
                    ? renderSection("paternalGrandfather")
                    : null}
                  {visibleSections.paternalGrandmother
                    ? renderSection("paternalGrandmother")
                    : null}
                </div>
              </section>
            ) : null}

            {visibleSections.maternalGrandfather ||
            visibleSections.maternalGrandmother ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-[16px] font-black text-slate-900">
                  Du côté maternel
                </div>
                <div className="mt-1 text-sm font-bold text-slate-700">
                  Les liens de parrainage de tes grands-parents maternels.
                </div>

                <div className="mt-4 grid gap-3">
                  {visibleSections.maternalGrandfather
                    ? renderSection("maternalGrandfather")
                    : null}
                  {visibleSections.maternalGrandmother
                    ? renderSection("maternalGrandmother")
                    : null}
                </div>
              </section>
            ) : null}

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

      <footer className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0">
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