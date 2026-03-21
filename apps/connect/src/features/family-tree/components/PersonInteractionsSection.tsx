import {
    Camera,
    Check,
    Eye,
    Heart,
    Loader2,
    Megaphone,
    MessageCircle,
    UserCheck,
} from "lucide-react";

type BrowsePanelMode =
    | "relations"
    | "memories"
    | "memory_editor"
    | "photo_upload"
    | "photos"
    | "touched"
    | "visibility_request";

function ReactionCountBadge({
    count,
    active,
}: {
    count: number;
    active: boolean;
}) {
    return (
        <span
            className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
        >
            {count}
        </span>
    );
}

export type PersonInteractionsSectionProps = {
    canDisplay: boolean;
    isPossiblyAlive: boolean;
    sex?: string;
    isApprovedClaimForCurrentPerson: boolean;
    hasPendingClaimForCurrentPerson: boolean;
    hasRejectedClaimForCurrentPerson: boolean;
    hasPendingVisibilityRequestForCurrentPerson: boolean;
    hasRejectedVisibilityRequestForCurrentPerson: boolean;
    isSavingIdentityClaim: boolean;
    isSavingVisibilityRequest: boolean;
    sourcePersonId: string | null;

    hasTouchedPerson: boolean;
    hasKnownPerson: boolean;
    hasHeardOfPerson: boolean;
    hasAnySubmittedMemory: boolean;
    hasAnySubmittedPhoto: boolean;

    totalMemoriesCount: number;
    totalPhotosCount: number;
    reactionsCount: number;
    knownCount: number;
    heardCount: number;

    panelMode: BrowsePanelMode;
    moderatorComment: string | null;

    onOpenMemories: () => void;
    onOpenPhotos: () => void;
    onOpenTouched?: () => void;
    onOpenMemoryEditor: () => void;
    onOpenPhotoEditor: () => void;

    onToggleTouched: () => void;
    onToggleKnown: () => void;
    onToggleHeard: () => void;

    onSetAsMe: () => void;
    onCancelIdentityClaim: () => void;
    onOpenVisibilityRequestForm: () => void;
    onCancelVisibilityRequest: () => void;
};

export function PersonInteractionsSection({
    canDisplay,
    isPossiblyAlive,
    sex,
    isApprovedClaimForCurrentPerson,
    hasPendingClaimForCurrentPerson,
    hasRejectedClaimForCurrentPerson,
    hasPendingVisibilityRequestForCurrentPerson,
    hasRejectedVisibilityRequestForCurrentPerson,
    isSavingIdentityClaim,
    isSavingVisibilityRequest,
    sourcePersonId,
    hasTouchedPerson,
    hasKnownPerson,
    hasHeardOfPerson,
    hasAnySubmittedMemory,
    hasAnySubmittedPhoto,
    totalMemoriesCount,
    totalPhotosCount,
    reactionsCount,
    knownCount,
    heardCount,
    panelMode,
    moderatorComment,
    onOpenMemories,
    onOpenPhotos,
    onOpenTouched,
    onOpenMemoryEditor,
    onOpenPhotoEditor,
    onToggleTouched,
    onToggleKnown,
    onToggleHeard,
    onSetAsMe,
    onCancelIdentityClaim,
    onOpenVisibilityRequestForm,
    onCancelVisibilityRequest
}: PersonInteractionsSectionProps) {
    const shouldShowReactSection = canDisplay;
    const shouldShowReactionButtons =
  canDisplay && !isApprovedClaimForCurrentPerson;

const shouldShowProtectedCard =
  !canDisplay && !isApprovedClaimForCurrentPerson;

const shouldShowIdentityCard =
  (isApprovedClaimForCurrentPerson || !sourcePersonId) &&
  (!canDisplay || isPossiblyAlive);

const shouldShowIdentifySection =
  shouldShowIdentityCard || shouldShowProtectedCard;

    const knowLabel = isPossiblyAlive
        ? "Je le connais personnellement"
        : "Je l’ai connu personnellement";

    const heardLabel =
        sex === "F"
            ? "J’ai entendu parler d’elle"
            : sex === "M"
                ? "J’ai entendu parler de lui"
                : "J’ai entendu parler de cette personne";

    const memoryActionLabel = isApprovedClaimForCurrentPerson
        ? "Ajouter un souvenir"
        : hasAnySubmittedMemory
            ? "Je veux raconter un autre souvenir"
            : "Je veux raconter un souvenir";

    const photoActionLabel = isApprovedClaimForCurrentPerson
        ? "Ajouter une photo"
        : hasAnySubmittedPhoto
            ? sex === "F"
                ? "J’ai une autre photo d’elle"
                : sex === "M"
                    ? "J’ai une autre photo de lui"
                    : "J’ai une autre photo"
            : sex === "F"
                ? "J’ai une photo d’elle"
                : sex === "M"
                    ? "J’ai une photo de lui"
                    : "J’ai une photo";

    const identityPrimaryLabel = hasRejectedClaimForCurrentPerson
        ? "Je veux redemander la vérification"
        : "Je pense que cette fiche me correspond";

    const identityTitle = isApprovedClaimForCurrentPerson
        ? "Cette fiche te correspond !"
        : "Cette fiche te correspond ?";

    const hiddenIdentityDescription = isApprovedClaimForCurrentPerson
        ? "Tu peux demander désormais gérer ton profil."
        : "Tu peux demander une vérification si tu penses que cette personne, c’est toi.";

    const visibleIdentityDescription = isApprovedClaimForCurrentPerson
        ? null
        : "Si cette personne, c’est toi, tu peux demander une vérification pour rattacher cette fiche à ton profil.";

    const identityStatusToneClass = isApprovedClaimForCurrentPerson
        ? "bg-slate-100 text-slate-700"
        : hasRejectedClaimForCurrentPerson
            ? "bg-rose-50 text-rose-900"
            : "bg-amber-50 text-amber-900";

    const identityStatusLabel = hasRejectedClaimForCurrentPerson
        ? "Demande non validée"
        : null;

    const isIdentityVerificationSubmitting = isSavingIdentityClaim;
    const isIdentityVerificationPending = hasPendingClaimForCurrentPerson;

    return (
        <>
            {shouldShowReactSection ? (
                <section className="mb-4 mt-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Réagir
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                            <button
                                type="button"
                                onClick={onOpenMemories}
                                className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 transition ${panelMode === "memories"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500"
                                    }`}
                            >
                                <MessageCircle size={20} />
                                {totalMemoriesCount}
                            </button>

                            <button
                                type="button"
                                onClick={onOpenPhotos}
                                className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 transition ${panelMode === "photos"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500"
                                    }`}
                            >
                                <Camera size={20} />
                                {totalPhotosCount}
                            </button>

                            <button
                                type="button"
                                onClick={onOpenTouched ?? onToggleTouched}
                                className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 transition ${panelMode === "touched"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-500"
                                    }`}
                            >
                                <Heart
                                    size={20}
                                    className={`transition ${hasTouchedPerson
                                        ? "text-red-500 scale-110"
                                        : "text-slate-400"
                                        }`}
                                    fill={hasTouchedPerson ? "currentColor" : "none"}
                                />
                                {reactionsCount}
                            </button>
                        </div>
                    </div>

                    {shouldShowReactionButtons ? (
                        <div className="mt-3 space-y-2">
                            <div>
                                <button
                                    type="button"
                                    onClick={onToggleTouched}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${hasTouchedPerson
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-700"
                                        }`}
                                >
                                    <Heart
                                        size={14}
                                        className={`transition ${hasTouchedPerson ? "text-red-300 scale-110" : ""
                                            }`}
                                        fill={hasTouchedPerson ? "currentColor" : "none"}
                                    />
                                    Cette personne me touche
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onToggleKnown}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${hasKnownPerson
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-700"
                                        }`}
                                >
                                    <UserCheck size={14} />
                                    {knowLabel}
                                    {knownCount > 0 ? (
                                        <ReactionCountBadge
                                            count={knownCount}
                                            active={hasKnownPerson}
                                        />
                                    ) : null}
                                </button>

                                <button
                                    type="button"
                                    onClick={onToggleHeard}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${hasHeardOfPerson
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-700"
                                        }`}
                                >
                                    <Megaphone size={14} />
                                    {heardLabel}
                                    {heardCount > 0 ? (
                                        <ReactionCountBadge
                                            count={heardCount}
                                            active={hasHeardOfPerson}
                                        />
                                    ) : null}
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {shouldShowIdentifySection ? (
                <section className="mb-4 mt-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Identifier
                    </div>

                    <div className="mt-3 space-y-3">
                        {shouldShowIdentityCard ? (
                            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">

                                <div className="text-[13px] font-bold text-slate-900">
                                    {identityTitle}
                                </div>


                                <div className="mt-1 text-[12px] leading-5 text-slate-600">
                                    {!canDisplay
                                        ? hiddenIdentityDescription
                                        : visibleIdentityDescription}
                                </div>
                                {isApprovedClaimForCurrentPerson && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        <button
                                            type="button"
                                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition bg-emerald-900 text-white`}

                                        >
                                            <div className="flex items-start gap-3">
                                                <Check className="mt-0.5 h-4 w-4" />

                                                Profil vérifié

                                            </div>

                                        </button>
                                    </div>
                                )}
                                <div className="mt-3 flex flex-col gap-2">
                                    {!isApprovedClaimForCurrentPerson && !sourcePersonId ? (
                                        <button
                                            type="button"
                                            onClick={onSetAsMe}
                                            disabled={isIdentityVerificationSubmitting || isIdentityVerificationPending}
                                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${isIdentityVerificationSubmitting
                                                ? "bg-slate-200 text-slate-600 opacity-70"
                                                : hasRejectedClaimForCurrentPerson
                                                    ? "bg-rose-100 text-rose-900"
                                                    : isIdentityVerificationPending
                                                        ? "bg-amber-100 text-amber-900"
                                                        : "bg-slate-900 text-white"
                                                } ${isIdentityVerificationSubmitting ? "" : "active:scale-[0.99]"
                                                }`}
                                        >
                                            {isIdentityVerificationSubmitting ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Vérification en cours
                                                </>
                                            ) : isIdentityVerificationPending ? (
                                                <>
                                                    <Check size={14} />
                                                    Demande envoyée
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck size={14} />
                                                    {identityPrimaryLabel}
                                                </>
                                            )}
                                        </button>
                                    ) : null}

                                    {isIdentityVerificationPending && !sourcePersonId ? (
                                        <div className="rounded-[12px] px-3 py-2 text-[12px] leading-5 text-amber-900">
                                            Ta demande a bien été envoyée à l’organisation. Tu recevras un mail quand ton profil sera vérifié.
                                        </div>
                                    ) : null}

                                    {identityStatusLabel ? (
                                        <div
                                            className={`rounded-[12px] px-3 py-2 text-[12px] leading-5 ${identityStatusToneClass}`}
                                        >
                                            {identityStatusLabel}
                                        </div>
                                    ) : null}

                                    {hasPendingClaimForCurrentPerson && !sourcePersonId ? (
                                        <button
                                            type="button"
                                            onClick={onCancelIdentityClaim}
                                            disabled={isSavingIdentityClaim}
                                            className="w-fit text-[12px] font-semibold text-slate-500 underline underline-offset-2"
                                        >
                                            Annuler ma demande
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {shouldShowProtectedCard ? (
                            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                                <div className="text-[13px] font-bold text-slate-900">
                                    Cette fiche est protégée
                                </div>
                                <div className="mt-1 text-[12px] leading-5 text-slate-600">
                                    Tu peux demander son affichage si tu as un lien légitime avec
                                    cette personne.
                                </div>

                                <div className="mt-3 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={
                                            hasPendingVisibilityRequestForCurrentPerson
                                                ? onCancelVisibilityRequest
                                                : onOpenVisibilityRequestForm
                                        }
                                        disabled={isSavingVisibilityRequest}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${hasPendingVisibilityRequestForCurrentPerson
                                            ? "bg-amber-100 text-amber-900"
                                            : hasRejectedVisibilityRequestForCurrentPerson
                                                ? "bg-rose-100 text-rose-900"
                                                : "bg-slate-100 text-slate-700"
                                            } ${isSavingVisibilityRequest ? "opacity-70" : "active:scale-[0.99]"}`}
                                    >
                                        <Eye size={14} />
                                        {hasPendingVisibilityRequestForCurrentPerson
                                            ? "Annuler ma demande d’affichage"
                                            : hasRejectedVisibilityRequestForCurrentPerson
                                                ? "Redemander l’affichage"
                                                : "Demander l’affichage de cette fiche"}
                                    </button>

                                    {hasPendingVisibilityRequestForCurrentPerson ? (
                                        <div className="rounded-[12px] bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
                                            Demande d’affichage en attente de modération.
                                        </div>
                                    ) : null}

                                    {hasRejectedVisibilityRequestForCurrentPerson &&
                                        moderatorComment ? (
                                        <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-900">
                                            {moderatorComment}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {canDisplay ? (
                <section className="mb-4 mt-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Contribuer
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onOpenMemoryEditor}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${panelMode === "memory_editor"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                                }`}
                        >
                            <MessageCircle size={14} />
                            {memoryActionLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onOpenPhotoEditor}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition ${panelMode === "photo_upload"
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700"
                                }`}
                        >
                            <Camera size={14} />
                            {photoActionLabel}
                        </button>
                    </div>
                </section>
            ) : null}
        </>
    );
}