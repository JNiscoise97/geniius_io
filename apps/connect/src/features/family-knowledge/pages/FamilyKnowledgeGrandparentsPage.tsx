import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Network,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BirthOrderField } from "../components/BirthOrderField";
import { FamilyPeopleList } from "../components/FamilyPeopleList";
import { FamilyPersonForm } from "../components/FamilyPersonForm";
import { KnownToggleField } from "../components/KnownToggleField";
import { LivingStatusField } from "../components/LivingStatusField";
import { PhotoPresenceField } from "../components/PhotoPresenceField";
import { RelationshipTypeField } from "../components/RelationshipTypeField";
import { grandparentsFormConfig } from "../config/grandparentsFormConfig";
import {
    createEmptyFamilyKnowledgeAuntUnclePerson,
    getDefaultFamilyKnowledgeGrandparentsValues,
    getFamilyKnowledgeGrandparents,
    type FamilyKnowledgeAuntUnclePerson,
    type FamilyKnowledgeGrandparentsValues,
} from "../api/getFamilyKnowledgeGrandparents";
import { saveFamilyKnowledgeGrandparents } from "../api/saveFamilyKnowledgeGrandparents";

type LocalParticipantSession = {
    participantId: string;
    firstName?: string;
    lastName?: string;
};

function AuntUncleCard({
    title,
    value,
    onChange,
    onRemove,
    showBirthOrder,
}: {
    title: string;
    value: FamilyKnowledgeAuntUnclePerson;
    onChange: (patch: Partial<FamilyKnowledgeAuntUnclePerson>) => void;
    onRemove: () => void;
    showBirthOrder: boolean;
}) {
    const labels = grandparentsFormConfig.personFields;

    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-[15px] font-black text-slate-900">{title}</div>

                <button
                    type="button"
                    onClick={onRemove}
                    className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 inline-flex items-center justify-center"
                >
                    <span className="text-lg leading-none">×</span>
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
                        <label className="grid gap-1">
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

                        <label className="grid gap-1">
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
                            { value: "both_parents", label: "Enfant de tes deux grands-parents" },
                            { value: "father_only", label: "Enfant du grand-père seulement" },
                            { value: "mother_only", label: "Enfant de la grand-mère seulement" },
                        ]}
                    />

                    {showBirthOrder ? (
                        <BirthOrderField
                            label={labels.birthOrderLabel}
                            value={value.birthOrder}
                            placeholder={labels.birthOrderPlaceholder}
                            onChange={(birthOrder) => onChange({ birthOrder })}
                        />
                    ) : null}

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
                </div>
            ) : null}
        </div>
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

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    function getParticipantSession(): LocalParticipantSession | null {
        const raw = localStorage.getItem(`connect:${slug}:participant`);
        if (!raw) return null;

        try {
            return JSON.parse(raw) as LocalParticipantSession;
        } catch {
            return null;
        }
    }

    useEffect(() => {
        let isMounted = true;

        async function loadExistingData() {
            const participantSession = getParticipantSession();

            if (!participantSession?.participantId) {
                if (isMounted) {
                    setLoadingInitialData(false);
                }
                return;
            }

            try {
                const existing = await getFamilyKnowledgeGrandparents({
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

    function validateAuntUncle(
        person: FamilyKnowledgeAuntUnclePerson,
    ): string | null {
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

        for (const person of values.paternalAuntsUncles) {
            const err = validateAuntUncle(person);
            if (err) return err;
        }

        for (const person of values.maternalAuntsUncles) {
            const err = validateAuntUncle(person);
            if (err) return err;
        }

        if (values.knowsFatherSiblingOrder) {
            const missing = values.paternalAuntsUncles.find(
                (p) => p.known && !p.birthOrder.trim(),
            );
            if (missing) return config.validation.missingFatherSiblingOrder;
        }

        if (values.knowsMotherSiblingOrder) {
            const missing = values.maternalAuntsUncles.find(
                (p) => p.known && !p.birthOrder.trim(),
            );
            if (missing) return config.validation.missingMotherSiblingOrder;
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

        const participantSession = getParticipantSession();
        if (!participantSession?.participantId) {
            setError(config.validation.missingParticipant);
            return;
        }

        setLoading(true);
        try {
            await saveFamilyKnowledgeGrandparents({
                participantId: participantSession.participantId,
                values,
            });

            localStorage.setItem(`connect:${slug}:family-knowledge:grandparents`, "done");
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
                        <Network size={18} className="text-slate-800" />
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
                                {config.sections.grandparents.title}
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-700">
                                {config.sections.grandparents.subtitle}
                            </div>

                            <div className="mt-4 grid gap-3">
                                <FamilyPersonForm
                                    title={config.sections.grandparents.paternalGrandfatherLabel}
                                    value={values.paternalGrandfather}
                                    onChange={(patch) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            paternalGrandfather: { ...prev.paternalGrandfather, ...patch },
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
                                            paternalGrandmother: { ...prev.paternalGrandmother, ...patch },
                                        }))
                                    }
                                    labels={config.personFields}
                                />

                                <FamilyPersonForm
                                    title={config.sections.grandparents.maternalGrandfatherLabel}
                                    value={values.maternalGrandfather}
                                    onChange={(patch) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            maternalGrandfather: { ...prev.maternalGrandfather, ...patch },
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
                                            maternalGrandmother: { ...prev.maternalGrandmother, ...patch },
                                        }))
                                    }
                                    labels={config.personFields}
                                />
                            </div>
                        </section>

                        <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
                            <div className="mt-0">
                                <div className="text-[16px] font-black text-slate-900">
                                    {config.sections.paternalAuntsUncles.title}
                                </div>
                                <div className="mt-1 text-sm font-bold text-slate-700">
                                    {config.sections.paternalAuntsUncles.subtitle}
                                </div>
                            </div>

                            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={values.knowsFatherSiblingOrder}
                                    onChange={(e) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            knowsFatherSiblingOrder: e.target.checked,
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

                            <div className="mt-4">
                                <FamilyPeopleList
                                    title=""
                                    addLabel={config.sections.paternalAuntsUncles.addLabel}
                                    emptyText={config.sections.paternalAuntsUncles.emptyText}
                                    items={values.paternalAuntsUncles}
                                    onAdd={() =>
                                        setValues((prev) => ({
                                            ...prev,
                                            paternalAuntsUncles: [
                                                ...prev.paternalAuntsUncles,
                                                createEmptyFamilyKnowledgeAuntUnclePerson(true),
                                            ],
                                        }))
                                    }
                                    renderItem={(person, index) => (
                                        <AuntUncleCard
                                            key={index}
                                            title={`${config.sections.paternalAuntsUncles.itemLabel} ${index + 1}`}
                                            value={person}
                                            showBirthOrder={values.knowsFatherSiblingOrder}
                                            onChange={(patch) => setPaternalAuntUncle(index, patch)}
                                            onRemove={() =>
                                                setValues((prev) => ({
                                                    ...prev,
                                                    paternalAuntsUncles: prev.paternalAuntsUncles.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                }))
                                            }
                                        />
                                    )}
                                />
                            </div>
                        </section>

                        <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-4">
                            <div className="mt-0">
                                <div className="text-[16px] font-black text-slate-900">
                                    {config.sections.maternalAuntsUncles.title}
                                </div>
                                <div className="mt-1 text-sm font-bold text-slate-700">
                                    {config.sections.maternalAuntsUncles.subtitle}
                                </div>
                            </div>

                            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={values.knowsMotherSiblingOrder}
                                    onChange={(e) =>
                                        setValues((prev) => ({
                                            ...prev,
                                            knowsMotherSiblingOrder: e.target.checked,
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

                            <div className="mt-4">
                                <FamilyPeopleList
                                    title=""
                                    addLabel={config.sections.maternalAuntsUncles.addLabel}
                                    emptyText={config.sections.maternalAuntsUncles.emptyText}
                                    items={values.maternalAuntsUncles}
                                    onAdd={() =>
                                        setValues((prev) => ({
                                            ...prev,
                                            maternalAuntsUncles: [
                                                ...prev.maternalAuntsUncles,
                                                createEmptyFamilyKnowledgeAuntUnclePerson(true),
                                            ],
                                        }))
                                    }
                                    renderItem={(person, index) => (
                                        <AuntUncleCard
                                            key={index}
                                            title={`${config.sections.maternalAuntsUncles.itemLabel} ${index + 1}`}
                                            value={person}
                                            showBirthOrder={values.knowsMotherSiblingOrder}
                                            onChange={(patch) => setMaternalAuntUncle(index, patch)}
                                            onRemove={() =>
                                                setValues((prev) => ({
                                                    ...prev,
                                                    maternalAuntsUncles: prev.maternalAuntsUncles.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                }))
                                            }
                                        />
                                    )}
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
                            {loading ? config.footer.loadingLabel : config.footer.submitLabel}
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