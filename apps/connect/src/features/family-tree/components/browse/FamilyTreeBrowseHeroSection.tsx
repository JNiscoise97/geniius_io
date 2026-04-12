import { Check, Compass, Heart, MapPin, Plus } from "lucide-react";
import { SmartImage } from "../../../../lib/media/useSmartImage";

type BranchChip = {
    id: string;
    chipClassName: string;
};

type Props = {
    personId: string;
    firstName: string;
    lastName: string;
    nickname?: string;
    sex?: string;
    canDisplay: boolean;
    canDisplayName: boolean;
    canDisplayPhoto: boolean;
    canDisplayInfo: boolean;
    photoSrc?: string;
    centerYears?: string | null;
    centerPath?: string | null;
    visibleOtherBranches: BranchChip[];
    heroClassName: string;
    isApprovedClaimForCurrentPerson: boolean;
    isOwnProfile: boolean;
    ownProfileBadgeClassName: string;
    relationshipSummary?: string | null;
    showRelationshipSummary: boolean;
    onOpenPerson: (personId: string) => void;
    attended2023?: boolean | null;
    attended2024?: boolean | null;
    isPresentToday?: boolean;
};

function PresenceBadge({
    label,
    active,
    highlight = false,
}: {
    label: string;
    active: boolean;
    highlight?: boolean;
}) {
    const className = highlight
        ? active
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-slate-200 bg-white text-slate-400"
        : active
            ? "border-indigo-200 bg-indigo-50 text-indigo-900"
            : "border-slate-200 bg-white text-slate-400";

    return (
        <div
            className={[
                "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black",
                className,
            ].join(" ")}
        >
            {active ? <Check className="mr-1.5 h-3.5 w-3.5" /> : null}
            {label}
        </div>
    );
}

export function FamilyTreeBrowseHeroSection({
    personId,
    firstName,
    lastName,
    nickname,
    sex,
    canDisplay,
    canDisplayName,
    canDisplayPhoto,
    canDisplayInfo,
    photoSrc,
    centerYears,
    centerPath,
    visibleOtherBranches,
    heroClassName,
    isApprovedClaimForCurrentPerson,
    isOwnProfile,
    ownProfileBadgeClassName,
    relationshipSummary,
    showRelationshipSummary,
    attended2023,
    attended2024,
    isPresentToday = false,
    onOpenPerson,
}: Props) {
    return (
        <>
            {canDisplay && canDisplayPhoto && photoSrc ? (
                <section className="mb-4 mt-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="aspect-square overflow-hidden rounded-[20px] bg-slate-100">
                        <SmartImage src={photoSrc} alt={`${firstName} ${lastName}`} />
                    </div>
                </section>
            ) : null}

            <section className="sticky top-0 z-30 -mx-1 mb-3 mt-3 border-b border-slate-200/80 bg-[color:var(--bg)]/95 px-1 pb-3 pt-1 backdrop-blur">
                <div
                    className={[
                        "rounded-[26px] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)]",
                        heroClassName,
                    ].join(" ")}
                >
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => onOpenPerson(personId)}
                            className="min-w-0 flex-1 text-left"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-white/70">
                                    Individu central
                                </span>

                                <div className="flex max-w-[70%] flex-wrap justify-end gap-2">
                                    {!canDisplay ? (
                                        <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold text-white">
                                            Profil masqué
                                        </span>
                                    ) : !canDisplayName || !canDisplayPhoto || !canDisplayInfo ? (
                                        <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1 text-[11px] font-extrabold text-white">
                                            Profil partiellement masqué
                                        </span>
                                    ) : null}

                                    {visibleOtherBranches.map((branch) => (
                                        <span
                                            key={branch.id}
                                            className={[
                                                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold",
                                                branch.chipClassName,
                                            ].join(" ")}
                                        >
                                            <Plus size={14} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-1 text-[26px] font-black leading-[1.02] tracking-tight">
                                {firstName} {lastName}
                            </div>

                            {nickname ? (
                                <div className="mb-2 mt-2 text-[20px] font-black leading-[1.02] tracking-tight">
                                    {sex === "F" ? "appelée" : "appelé"} {nickname}
                                </div>
                            ) : null}

                            {centerYears ? (
                                <div className="mt-2 text-[13px] font-extrabold text-white/90">
                                    {centerYears}
                                </div>
                            ) : null}

                            {centerPath ? (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-extrabold text-white/90">
                                    <MapPin size={12} />
                                    {centerPath}
                                </div>
                            ) : null}
                        </button>
                    </div>
                </div>
            </section>

            {isApprovedClaimForCurrentPerson || isOwnProfile ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    {isApprovedClaimForCurrentPerson ? (
                        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-3 py-2 text-[12px] font-semibold text-white">
                            <Check className="h-4 w-4" />
                            Profil vérifié
                        </div>
                    ) : null}

                    {isOwnProfile ? (
                        <div
                            className={[
                                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold",
                                ownProfileBadgeClassName,
                            ].join(" ")}
                        >
                            <Compass className="h-4 w-4" />
                            Mon profil
                        </div>
                    ) : null}
                </div>
            ) : null}

            {showRelationshipSummary && relationshipSummary ? (
                <div className="mt-4">
                    <div className="mt-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-2 text-sm font-black text-slate-900">
                            <Heart size={16} className="mt-[2px] shrink-0 text-indigo-600" />
                            <div>{relationshipSummary}</div>
                        </div>
                    </div>
                </div>
            ) : null}

            {(isPresentToday || attended2024 || attended2023) && <section className="mt-4">
                <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                        Présence aux éditions
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {isPresentToday && <PresenceBadge
                            label="Présent aujourd’hui · 2026"
                            active={isPresentToday}
                            highlight
                        />}

                        {attended2024 && <PresenceBadge
                            label="Édition 2024"
                            active={true}
                        />}

                        {attended2023 && <PresenceBadge
                            label="Édition 2023"
                            active={true}
                        />}
                    </div>
                </div>
            </section>}
        </>
    );
}