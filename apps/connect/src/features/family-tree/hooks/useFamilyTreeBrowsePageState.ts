import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROOT_HONORED_PERSON_ID } from "../../../config/eventInfos";
import {
    createFamilyTreeViewTracker,
    type FamilyTreeViaAction,
} from "../../../lib/analytics/familyTreeViewTracker";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";

import { FAMILY_GRAPH } from "../api/loadGraph";
import {
    getPersonContext,
    getPersonHeroConfig,
} from "../config/configGenealogy";
import { loadFamilyTreePermissions } from "../application/permissions/loadFamilyTreePermissions";
import { submitInPersonAssist } from "../application/in-person/submitInPersonAssist";

import { createMyPersonMemory } from "../data/memories/createMyPersonMemory";
import { updateMyPersonMemory } from "../data/memories/updateMyPersonMemory";
import { deleteMyPersonMemory } from "../data/memories/deleteMyPersonMemory";
import {
    getVisiblePersonMemories,
    type PersonMemoryItem,
} from "../data/memories/getVisiblePersonMemories";
import {
    getMyPersonMemoryModerationCounts,
    type MyPersonMemoryModerationCounts,
} from "../data/memories/getMyPersonMemoryModerationCounts";

import { createMyPersonPhoto } from "../data/photos/createMyPersonPhoto";
import { updateMyPersonPhoto } from "../data/photos/updateMyPersonPhoto";
import { deleteMyPersonPhoto } from "../data/photos/deleteMyPersonPhoto";
import {
    getVisiblePersonPhotos,
    type PersonPhotoItem,
} from "../data/photos/getVisiblePersonPhotos";
import {
    getMyPersonPhotoModerationCounts,
    type MyPersonPhotoModerationCounts,
} from "../data/photos/getMyPersonPhotoModerationCounts";

import { getPersonContributionStats } from "../data/reactions/getPersonContributionStats";
import { getPersonReactionState } from "../data/reactions/getPersonReactionState";
import {
    getTouchedParticipants,
    type TouchedParticipantItem,
} from "../data/reactions/getTouchedParticipants";
import { togglePersonReaction } from "../data/reactions/togglePersonReaction";

import { getMyPersonIdentityClaim } from "../data/identity/getMyPersonIdentityClaim";
import { saveMyPersonIdentityClaim } from "../data/identity/saveMyPersonIdentityClaim";
import { deleteMyPersonIdentityClaim } from "../data/identity/deleteMyPersonIdentityClaim";

import { getMyPersonVisibilityRequest } from "../data/visibility/getMyPersonVisibilityRequest";
import { saveMyPersonVisibilityRequest } from "../data/visibility/saveMyPersonVisibilityRequest";
import { deleteMyPersonVisibilityRequest } from "../data/visibility/deleteMyPersonVisibilityRequest";
import { getFamilyTreeEffectiveVisibilityMap } from "../data/visibility/getFamilyTreeEffectiveVisibilityMap";

import { getParticipantDefaultGedcomPersonId } from "../data/profiles/getParticipantDefaultGedcomPersonId";
import { getMergedPersonOverridesMap } from "../data/profiles/getMergedPersonOverridesMap";
import type { PersonUiOverride } from "../data/profiles/uiOverrides";
import type { PersonVisibilityPreferenceMap } from "../types/visibility";
import type { FamilyTreePermissionSet } from "../types/permissions";
import type { BrowsePanelMode } from "../types/browse";
import {
    type PersonInPersonAssistValues,
} from "../components/in-person/PersonInPersonAssistFormPanel";
import { findRelationshipPath } from "../domain/graph/findRelationshipPath";
import {
    formatBrowseLifePath,
    formatBrowseYears,
    getBrowseDisplayPerson,
    getPluralLabel,
    removeUniformLinkedSpouseLabel,
    sortPersonsByBirthYear,
    summarizeRelationshipToRoot,
} from "../domain/browse/browsePersonUtils";
import { getInPersonAssistPrefill } from "../data/in-person/getInPersonAssistPrefill";
import { getPersonAttendanceFlags, type PersonAttendanceFlags } from "../data/in-person/getPersonAttendanceFlags";

type MemoryDraftState = {
    value: string;
    loaded: boolean;
    dirty: boolean;
};

const EMPTY_MEMORY_DRAFT: MemoryDraftState = {
    value: "",
    loaded: false,
    dirty: false,
};

const EMPTY_IN_PERSON_ASSIST_VALUES: PersonInPersonAssistValues = {
    declaredPresent: true,
    attended2023: null,
    attended2024: null,
    allowNameInFamilyTree: null,
    allowPhotoInFamilyTree: null,
    allowInfoInFamilyTree: null,
    email: "",
    birthYear: "",
    targetIsMinor: false,
    consentCollectedFrom: "",
    notes: "",
    testimonyInterest: "",
    testimonyTopics: "",
};

function normalizePersonId(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

type Input = {
    slug: string;
    participantId: string | null;
    participantFirstName?: string;
    participantLastName?: string;
    participantDisplayName?: string;
    requestedPersonId: string | null;
};

export function useFamilyTreeBrowsePageState({
    slug,
    participantId,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    requestedPersonId,
}: Input) {
    const navigate = useNavigate();

    const rootHonoredPersonId = ROOT_HONORED_PERSON_ID;

    const initialCenterId =
        requestedPersonId && FAMILY_GRAPH.people[requestedPersonId]
            ? requestedPersonId
            : rootHonoredPersonId;

    const [centerId, setCenterId] = useState<string>(initialCenterId);
    const [panelMode, setPanelMode] = useState<BrowsePanelMode>("relations");

    const [permissions, setPermissions] = useState<FamilyTreePermissionSet | null>(null);
    const [inPersonAssistErrorMessage, setInPersonAssistErrorMessage] =
        useState<string | null>(null);

    const [defaultGedcomPersonId, setDefaultGedcomPersonId] = useState<string | null>(null);
    const [defaultGedcomPersonLoading, setDefaultGedcomPersonLoading] = useState(false);

    const [visibilityPreferencesByPersonId, setVisibilityPreferencesByPersonId] =
        useState<PersonVisibilityPreferenceMap>({});
    const [effectiveVisibilityLoading, setEffectiveVisibilityLoading] = useState(true);

    const [overridesByPersonId, setOverridesByPersonId] = useState<
        Record<string, PersonUiOverride>
    >({});
    const [overridesLoading, setOverridesLoading] = useState(true);

    const [hasKnownPerson, setHasKnownPerson] = useState(false);
    const [hasHeardOfPerson, setHasHeardOfPerson] = useState(false);
    const [hasTouchedPerson, setHasTouchedPerson] = useState(false);

    const [memoriesCount, setMemoriesCount] = useState(0);
    const [knownCount, setKnownCount] = useState(0);
    const [heardCount, setHeardCount] = useState(0);
    const [photosCount, setPhotosCount] = useState(0);
    const [reactionsCount, setReactionsCount] = useState(0);

    const [visibleMemories, setVisibleMemories] = useState<PersonMemoryItem[]>([]);
    const [visiblePhotos, setVisiblePhotos] = useState<PersonPhotoItem[]>([]);
    const [touchedParticipants, setTouchedParticipants] = useState<
        TouchedParticipantItem[]
    >([]);

    const [inPersonAssistTargetParticipantId, setInPersonAssistTargetParticipantId] =
        useState<string | null>(null);

    const [memoryCounts, setMemoryCounts] = useState<MyPersonMemoryModerationCounts>({
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    const [photoCounts, setPhotoCounts] = useState<MyPersonPhotoModerationCounts>({
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    const [memoryEditorMode, setMemoryEditorMode] = useState<"create" | "edit">("create");
    const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
    const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);
    const [memoryPublishSuccessMessage, setMemoryPublishSuccessMessage] =
        useState<string | null>(null);
    const [isSavingMemory, setIsSavingMemory] = useState(false);

    const [photoEditorMode, setPhotoEditorMode] = useState<"create" | "edit">("create");
    const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
    const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
    const [photoPublishSuccessMessage, setPhotoPublishSuccessMessage] =
        useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoCaption, setPhotoCaption] = useState("");
    const [photoConsentObtained, setPhotoConsentObtained] = useState(false);
    const [setAsProfilePhoto, setSetAsProfilePhoto] = useState(false);
    const [isSavingPhoto, setIsSavingPhoto] = useState(false);

    const [claimedPersonId, setClaimedPersonId] = useState<string | null>(null);
    const [myIdentityClaimStatus, setMyIdentityClaimStatus] = useState<
        "pending" | "approved" | "rejected" | null
    >(null);
    const [isSavingIdentityClaim, setIsSavingIdentityClaim] = useState(false);

    const [myVisibilityRequestStatus, setMyVisibilityRequestStatus] = useState<
        "pending" | "approved" | "rejected" | null
    >(null);
    const [myVisibilityRequestModeratorComment, setMyVisibilityRequestModeratorComment] =
        useState<string | null>(null);
    const [isSavingVisibilityRequest, setIsSavingVisibilityRequest] = useState(false);

    const [visibilityRequestHasLegitimateFamilyLink, setVisibilityRequestHasLegitimateFamilyLink] =
        useState(false);
    const [
        visibilityRequestPersonCannotRequestByThemself,
        setVisibilityRequestPersonCannotRequestByThemself,
    ] = useState(false);
    const [visibilityRequestHasConsent, setVisibilityRequestHasConsent] =
        useState(false);
    const [visibilityRequestJustification, setVisibilityRequestJustification] =
        useState("");

    const [memoryDraftsByPersonId, setMemoryDraftsByPersonId] = useState<
        Record<string, MemoryDraftState>
    >({});

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        parents: true,
        spouses: true,
        children: true,
        siblings: true,
        grandparents: true,
    });

    const [inPersonAssistValues, setInPersonAssistValues] =
        useState<PersonInPersonAssistValues>(EMPTY_IN_PERSON_ASSIST_VALUES);
    const [isSubmittingInPersonAssist, setIsSubmittingInPersonAssist] =
        useState(false);
    const [inPersonAssistSuccessMessage, setInPersonAssistSuccessMessage] =
        useState<string | null>(null);


    const [inPersonAssistParticipantExists, setInPersonAssistParticipantExists] =
        useState(false);

    const [attendanceFlags, setAttendanceFlags] = useState<PersonAttendanceFlags>({
        attended2023: null,
        attended2024: null,
        isPresentToday: false,
    });

    const sourcePersonId =
        myIdentityClaimStatus === "approved" && claimedPersonId ? claimedPersonId : null;

    const sosaReferencePersonId = sourcePersonId ?? defaultGedcomPersonId ?? null;
    const canViewMaskedPeople = permissions?.["family_tree.view_masked_people"] === true;
    const canAssistInPerson = permissions?.["family_tree.assist_in_person"] === true;
    const hasDefaultTreeEntry = Boolean(defaultGedcomPersonId);

    const context = useMemo(
        () =>
            getPersonContext(
                centerId,
                visibilityPreferencesByPersonId,
                sosaReferencePersonId,
                overridesByPersonId,
            ),
        [centerId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId],
    );

    const hasPendingClaimForCurrentPerson =
        myIdentityClaimStatus === "pending" &&
        Boolean(claimedPersonId) &&
        claimedPersonId === centerId;

    const hasRejectedClaimForCurrentPerson =
        myIdentityClaimStatus === "rejected" &&
        Boolean(claimedPersonId) &&
        claimedPersonId === centerId;

    const isApprovedClaimForCurrentPerson =
        myIdentityClaimStatus === "approved" &&
        Boolean(claimedPersonId) &&
        claimedPersonId === centerId;

    const forceDisplayedPersonIds = useMemo(() => {
        const ids = new Set<string>();
        if (claimedPersonId && myIdentityClaimStatus === "approved") {
            ids.add(claimedPersonId);
        }
        return ids;
    }, [claimedPersonId, myIdentityClaimStatus]);

    const displayPerson = useMemo(
        () => getBrowseDisplayPerson(context.person, forceDisplayedPersonIds, canViewMaskedPeople),
        [context.person, forceDisplayedPersonIds, canViewMaskedPeople],
    );

    const displayParents = useMemo(
        () =>
            context.parents.map((person) =>
                getBrowseDisplayPerson(person, forceDisplayedPersonIds, canViewMaskedPeople),
            ),
        [context.parents, forceDisplayedPersonIds, canViewMaskedPeople],
    );

    const displaySpouses = useMemo(
        () =>
            context.spouses.map((person) =>
                getBrowseDisplayPerson(person, forceDisplayedPersonIds, canViewMaskedPeople),
            ),
        [context.spouses, forceDisplayedPersonIds, canViewMaskedPeople],
    );

    const displayChildren = useMemo(
        () =>
            removeUniformLinkedSpouseLabel(
                sortPersonsByBirthYear(context.children).map((person) =>
                    getBrowseDisplayPerson(person, forceDisplayedPersonIds, canViewMaskedPeople),
                ),
            ),
        [context.children, forceDisplayedPersonIds, canViewMaskedPeople],
    );

    const displaySiblings = useMemo(
        () =>
            sortPersonsByBirthYear(context.siblings).map((person) =>
                getBrowseDisplayPerson(person, forceDisplayedPersonIds, canViewMaskedPeople),
            ),
        [context.siblings, forceDisplayedPersonIds, canViewMaskedPeople],
    );

    const displayGrandparents = useMemo(
        () =>
            context.grandparents.map((person) =>
                getBrowseDisplayPerson(person, forceDisplayedPersonIds, canViewMaskedPeople),
            ),
        [context.grandparents, forceDisplayedPersonIds, canViewMaskedPeople],
    );

    const relationshipPath = useMemo(
        () => findRelationshipPath(FAMILY_GRAPH, rootHonoredPersonId, centerId),
        [centerId, rootHonoredPersonId],
    );

    const heroConfig = useMemo(
        () =>
            getPersonHeroConfig(
                centerId,
                visibilityPreferencesByPersonId,
                sosaReferencePersonId,
                overridesByPersonId,
            ),
        [centerId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId],
    );

    const visibleOtherBranches =
        displayPerson.canDisplay && displayPerson.canDisplayName
            ? heroConfig.otherBranches
            : [];

    const rootPerson = useMemo(
        () =>
            getBrowseDisplayPerson(
                getPersonContext(
                    rootHonoredPersonId,
                    visibilityPreferencesByPersonId,
                    sosaReferencePersonId,
                    overridesByPersonId,
                ).person,
                new Set<string>(),
                false,
            ),
        [rootHonoredPersonId, visibilityPreferencesByPersonId, sosaReferencePersonId, overridesByPersonId],
    );

    const isCenteredOnMe = Boolean(sourcePersonId && centerId === sourcePersonId);

    const relationshipSummary = summarizeRelationshipToRoot(
        relationshipPath,
        `Gromèr ${rootPerson.firstName}`,
        isCenteredOnMe,
        displayPerson.sex,
    );

    const centerYears =
        displayPerson.canDisplay && displayPerson.canDisplayInfo
            ? formatBrowseYears(displayPerson)
            : null;

    const centerPath =
        displayPerson.canDisplay && displayPerson.canDisplayInfo
            ? formatBrowseLifePath(displayPerson)
            : null;

    const labelSpouses = getPluralLabel(displaySpouses.length, "Conjoint", "Conjoints");
    const labelChildren = getPluralLabel(displayChildren.length, "Enfant", "Enfants");
    const labelSiblings = getPluralLabel(displaySiblings.length, "Frère / sœur", "Fratrie");

    const totalMemoriesCount = Math.max(
        memoriesCount,
        memoryCounts.approved + memoryCounts.pending,
    );

    const totalPhotosCount = Math.max(
        photosCount,
        photoCounts.approved + photoCounts.pending,
    );

    const hasAnySubmittedMemory =
        totalMemoriesCount > 0 || visibleMemories.length > 0 || memoryCounts.pending > 0;

    const hasAnySubmittedPhoto =
        totalPhotosCount > 0 || visiblePhotos.length > 0 || photoCounts.pending > 0;

    const shouldDisableKnownButton = hasHeardOfPerson && !hasKnownPerson;
    const shouldDisableHeardButton = hasKnownPerson && !hasHeardOfPerson;

    const currentMemoryDraft = memoryDraftsByPersonId[centerId] ?? EMPTY_MEMORY_DRAFT;
    const memoryDraft = currentMemoryDraft.value;

    const editingPhoto = useMemo(
        () => visiblePhotos.find((photo) => photo.id === editingPhotoId) ?? null,
        [editingPhotoId, visiblePhotos],
    );

    const hasPendingVisibilityRequestForCurrentPerson =
        myVisibilityRequestStatus === "pending";
    const hasRejectedVisibilityRequestForCurrentPerson =
        myVisibilityRequestStatus === "rejected";

    const isOwnProfile =
        Boolean(sourcePersonId) && isApprovedClaimForCurrentPerson;

    const familyTreeTrackerRef = useRef<ReturnType<
        typeof createFamilyTreeViewTracker
    > | null>(null);

    const loadCurrentPersonData = useCallback(async () => {
        if (!participantId) return;

        const [
            reactionState,
            stats,
            visibleMemoriesData,
            visiblePhotosData,
            identityClaim,
            visibilityRequest,
            memoryCountsData,
            photoCountsData,
            touchedParticipantsData,
            attendanceFlagsData,
        ] = await Promise.all([
            getPersonReactionState({
                eventSlug: slug,
                participantId,
                personId: centerId,
            }),
            getPersonContributionStats({
                eventSlug: slug,
                personId: centerId,
            }),
            getVisiblePersonMemories({
                eventSlug: slug,
                personId: centerId,
                currentParticipantId: participantId,
            }),
            getVisiblePersonPhotos({
                eventSlug: slug,
                personId: centerId,
                currentParticipantId: participantId,
            }),
            getMyPersonIdentityClaim({
                eventSlug: slug,
                participantId,
            }),
            getMyPersonVisibilityRequest({
                eventSlug: slug,
                participantId,
                personId: centerId,
            }),
            getMyPersonMemoryModerationCounts({
                eventSlug: slug,
                participantId,
                personId: centerId,
            }),
            getMyPersonPhotoModerationCounts({
                eventSlug: slug,
                participantId,
                personId: centerId,
            }),
            getTouchedParticipants({
                eventSlug: slug,
                personId: centerId,
            }),
            getPersonAttendanceFlags({
                eventSlug: slug,
                personId: centerId,
            }),
        ]);

        setHasKnownPerson(reactionState.knewPerson);
        setHasHeardOfPerson(reactionState.heardOfPerson);
        setHasTouchedPerson(reactionState.touchedByPerson);

        setMemoriesCount(stats.memoriesCount);
        setKnownCount(stats.knownCount);
        setHeardCount(stats.heardCount);
        setPhotosCount(stats.photosCount);
        setReactionsCount(stats.reactionsCount);

        setClaimedPersonId(normalizePersonId(identityClaim?.person_id ?? null));
        setMyIdentityClaimStatus(identityClaim?.claim_status ?? null);

        setVisibleMemories(visibleMemoriesData);
        setVisiblePhotos(visiblePhotosData);
        setMemoryCounts(memoryCountsData);
        setPhotoCounts(photoCountsData);
        setTouchedParticipants(touchedParticipantsData);

        setMemoryDraftsByPersonId((prev) => {
            const existing = prev[centerId];
            if (existing) return prev;

            return {
                ...prev,
                [centerId]: {
                    ...EMPTY_MEMORY_DRAFT,
                    loaded: true,
                },
            };
        });

        setMyVisibilityRequestStatus(visibilityRequest?.request_status ?? null);
        setMyVisibilityRequestModeratorComment(
            visibilityRequest?.moderator_comment ?? null,
        );
        setVisibilityRequestHasLegitimateFamilyLink(
            visibilityRequest?.has_legitimate_family_link ?? false,
        );
        setVisibilityRequestPersonCannotRequestByThemself(
            visibilityRequest?.person_cannot_request_by_themself ?? false,
        );
        setVisibilityRequestHasConsent(visibilityRequest?.has_consent ?? false);
        setVisibilityRequestJustification(visibilityRequest?.justification ?? "");
        setAttendanceFlags(attendanceFlagsData);
    }, [centerId, participantId, slug]);

    function setCurrentMemoryDraft(value: string) {
        setMemoryDraftsByPersonId((prev) => ({
            ...prev,
            [centerId]: {
                ...(prev[centerId] ?? {
                    ...EMPTY_MEMORY_DRAFT,
                    loaded: true,
                }),
                value,
                dirty: true,
            },
        }));
    }

    async function loadInPersonAssistPrefill() {
        try {
            const prefill = await getInPersonAssistPrefill({
                eventSlug: slug,
                personId: centerId,
            });

            setInPersonAssistParticipantExists(prefill.participantExists);
            setInPersonAssistTargetParticipantId(prefill.participantId);

            setInPersonAssistValues((prev) => ({
                ...prev,
                declaredPresent: prefill.isPresentToday,
                attended2023: prefill.attended2023,
                attended2024: prefill.attended2024,
                email: prefill.email,
                birthYear: prefill.birthYear,
                allowNameInFamilyTree: prefill.allowNameInFamilyTree,
                allowPhotoInFamilyTree: prefill.allowPhotoInFamilyTree,
                allowInfoInFamilyTree: prefill.allowInfoInFamilyTree,
                testimonyInterest: prefill.testimonyInterest,
                testimonyTopics: prefill.testimonyTopics,
            }));
        } catch (error) {
            console.error(error);
            setInPersonAssistParticipantExists(false);
            setInPersonAssistTargetParticipantId(null);
        }
    }

    async function openInPersonAssistPanel() {
        await loadInPersonAssistPrefill();
        setPanelMode("in_person_assist");
    }

    async function loadDefaultGedcomPersonId() {
        if (!participantId) {
            setDefaultGedcomPersonId(null);
            return;
        }

        try {
            setDefaultGedcomPersonLoading(true);

            const personId = await getParticipantDefaultGedcomPersonId({
                eventSlug: slug,
                participantId,
            });

            setDefaultGedcomPersonId(normalizePersonId(personId));
        } catch (error) {
            console.error(error);
            setDefaultGedcomPersonId(null);
        } finally {
            setDefaultGedcomPersonLoading(false);
        }
    }

    async function loadVisibilityPreferencesMap() {
        try {
            setEffectiveVisibilityLoading(true);

            const map = await getFamilyTreeEffectiveVisibilityMap({
                eventSlug: slug,
            });

            setVisibilityPreferencesByPersonId(map);
        } catch (error) {
            console.error(error);
            setVisibilityPreferencesByPersonId({});
        } finally {
            setEffectiveVisibilityLoading(false);
        }
    }

    async function loadOverridesMap() {
        try {
            setOverridesLoading(true);
            const map = await getMergedPersonOverridesMap(slug);
            setOverridesByPersonId(map);
        } catch (error) {
            console.error(error);
            setOverridesByPersonId({});
        } finally {
            setOverridesLoading(false);
        }
    }

    function goToPerson(personId: string, viaAction: FamilyTreeViaAction) {
        setCenterId(personId);

        const tracker = familyTreeTrackerRef.current;
        if (tracker) {
            void tracker.changePerson(personId, viaAction);
        }
    }

    function recenterOnSource() {
        if (!sourcePersonId) return;
        setCenterId(sourcePersonId);
        const tracker = familyTreeTrackerRef.current;
        if (tracker) {
            void tracker.changePerson(sourcePersonId, "recenter_source");
        }
    }

    function recenterOnRoot() {
        setCenterId(rootHonoredPersonId);
        const tracker = familyTreeTrackerRef.current;
        if (tracker) {
            void tracker.changePerson(rootHonoredPersonId, "recenter_root");
        }
    }

    function openCreateMemoryEditor() {
        setMemoryEditorMode("create");
        setEditingMemoryId(null);
        setCurrentMemoryDraft("");
        setMemoryPublishSuccessMessage(null);
        setPanelMode("memory_editor");
    }

    function handleEditMemory(memoryId: string) {
        const memory = visibleMemories.find((item) => item.id === memoryId);
        if (!memory) return;

        setMemoryEditorMode("edit");
        setEditingMemoryId(memory.id);
        setCurrentMemoryDraft(memory.content);
        setMemoryPublishSuccessMessage(null);
        setPanelMode("memory_editor");
    }

    function openCreatePhotoEditor() {
        setPhotoEditorMode("create");
        setEditingPhotoId(null);
        setPhotoFile(null);
        setPhotoCaption("");
        setPhotoConsentObtained(false);
        setSetAsProfilePhoto(false);
        setPhotoPublishSuccessMessage(null);
        setPanelMode("photo_upload");
    }

    function handleEditPhoto(photoId: string) {
        const photo = visiblePhotos.find((item) => item.id === photoId);
        if (!photo) return;

        setPhotoEditorMode("edit");
        setEditingPhotoId(photo.id);
        setPhotoFile(null);
        setPhotoCaption(photo.caption ?? "");
        setPhotoConsentObtained(photo.consent_obtained);
        setSetAsProfilePhoto(false);
        setPhotoPublishSuccessMessage(null);
        setPanelMode("photo_upload");
    }

    async function handleSubmitVisibilityRequest() {
        if (!participantId) return;

        setIsSavingVisibilityRequest(true);

        try {
            await saveMyPersonVisibilityRequest({
                eventSlug: slug,
                participantId,
                personId: centerId,
                hasLegitimateFamilyLink: visibilityRequestHasLegitimateFamilyLink,
                personCannotRequestByThemself:
                    visibilityRequestPersonCannotRequestByThemself,
                hasConsent: visibilityRequestHasConsent,
                justification: visibilityRequestJustification,
                participantFirstName,
                participantLastName,
                participantDisplayName,
                personFirstName: context.person.firstName,
                personLastName: context.person.lastName,
                personDisplayName:
                    `${context.person.firstName} ${context.person.lastName}`.trim(),
            });

            setPanelMode("relations");
            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingVisibilityRequest(false);
        }
    }

    async function handleCancelVisibilityRequest() {
        if (!participantId) return;

        setIsSavingVisibilityRequest(true);

        try {
            await deleteMyPersonVisibilityRequest({
                eventSlug: slug,
                participantId,
                personId: centerId,
            });

            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingVisibilityRequest(false);
        }
    }

    async function handleSetAsMe() {
        if (!participantId) return;

        setIsSavingIdentityClaim(true);

        try {
            await Promise.all([
                saveMyPersonIdentityClaim({
                    eventSlug: slug,
                    participantId,
                    personId: centerId,
                    participantFirstName,
                    participantLastName,
                    participantDisplayName,
                    personFirstName: context.person.firstName,
                    personLastName: context.person.lastName,
                    personDisplayName:
                        `${context.person.firstName} ${context.person.lastName}`.trim(),
                }),
                wait(3000),
            ]);

            const refreshedClaim = await getMyPersonIdentityClaim({
                eventSlug: slug,
                participantId,
            });

            const refreshedClaimedPersonId = normalizePersonId(
                refreshedClaim?.person_id ?? null,
            );

            const isNowVerified =
                refreshedClaimedPersonId === centerId &&
                refreshedClaim?.claim_status === "approved";

            if (isNowVerified) {
                window.location.replace(`/e/${slug}/family-tree/browse?personId=${centerId}`);
                return;
            }

            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingIdentityClaim(false);
        }
    }

    async function handleCancelIdentityClaim() {
        if (!participantId) return;

        setIsSavingIdentityClaim(true);

        try {
            await deleteMyPersonIdentityClaim({
                eventSlug: slug,
                participantId,
            });

            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingIdentityClaim(false);
        }
    }

    async function handleToggleKnown() {
        if (!participantId || shouldDisableKnownButton) return;

        const next = !hasKnownPerson;
        setHasKnownPerson(next);
        setKnownCount((prev) => Math.max(0, prev + (next ? 1 : -1)));

        try {
            await togglePersonReaction({
                eventSlug: slug,
                participantId,
                personId: centerId,
                reactionType: "knew_person",
                isActive: next,
            });
        } catch {
            setHasKnownPerson(!next);
            setKnownCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
        }
    }

    async function handleToggleHeard() {
        if (!participantId || shouldDisableHeardButton) return;

        const next = !hasHeardOfPerson;
        setHasHeardOfPerson(next);
        setHeardCount((prev) => Math.max(0, prev + (next ? 1 : -1)));

        try {
            await togglePersonReaction({
                eventSlug: slug,
                participantId,
                personId: centerId,
                reactionType: "heard_of_person",
                isActive: next,
            });
        } catch {
            setHasHeardOfPerson(!next);
            setHeardCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
        }
    }

    async function handleToggleTouched() {
        if (!participantId) return;

        const next = !hasTouchedPerson;
        setHasTouchedPerson(next);
        setReactionsCount((prev) => Math.max(0, prev + (next ? 1 : -1)));

        try {
            await togglePersonReaction({
                eventSlug: slug,
                participantId,
                personId: centerId,
                reactionType: "touched_by_person",
                isActive: next,
            });
        } catch {
            setHasTouchedPerson(!next);
            setReactionsCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
        }
    }

    async function handleSaveMemory() {
        if (!participantId) return;

        const content = memoryDraft.trim();
        if (!content) return;

        setIsSavingMemory(true);

        try {
            if (memoryEditorMode === "edit" && editingMemoryId) {
                await updateMyPersonMemory({
                    memoryId: editingMemoryId,
                    eventSlug: slug,
                    participantId,
                    personId: centerId,
                    content,
                    participantFirstName,
                    participantLastName,
                    participantDisplayName,
                    personFirstName: context.person.firstName,
                    personLastName: context.person.lastName,
                    personDisplayName:
                        `${context.person.firstName} ${context.person.lastName}`.trim(),
                });

                setMemoryPublishSuccessMessage(
                    "Ton souvenir a été mis à jour et renvoyé en modération.",
                );
            } else {
                await createMyPersonMemory({
                    eventSlug: slug,
                    participantId,
                    personId: centerId,
                    content,
                    participantFirstName,
                    participantLastName,
                    participantDisplayName,
                    personFirstName: context.person.firstName,
                    personLastName: context.person.lastName,
                    personDisplayName:
                        `${context.person.firstName} ${context.person.lastName}`.trim(),
                });

                setMemoryPublishSuccessMessage(
                    "Ton souvenir a bien été envoyé à la modération.",
                );
            }

            setMemoryEditorMode("create");
            setEditingMemoryId(null);
            setCurrentMemoryDraft("");
            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingMemory(false);
        }
    }

    async function handleDeleteMemory(memoryId: string) {
        if (!participantId) return;

        setDeletingMemoryId(memoryId);

        try {
            await deleteMyPersonMemory({
                memoryId,
                participantId,
            });

            if (editingMemoryId === memoryId) {
                setEditingMemoryId(null);
                setMemoryEditorMode("create");
                setCurrentMemoryDraft("");
                setPanelMode("memories");
            }

            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingMemoryId(null);
        }
    }

    async function handleSavePhoto() {
        if (!participantId) return;

        const consentIsRequired =
            displayPerson.isPossiblyAlive === true && !isOwnProfile;

        if (consentIsRequired && !photoConsentObtained) {
            return;
        }

        setIsSavingPhoto(true);

        try {
            if (photoEditorMode === "edit" && editingPhotoId) {
                await updateMyPersonPhoto({
                    photoId: editingPhotoId,
                    participantId,
                    caption: photoCaption,
                    consentObtained: photoConsentObtained,
                    file: photoFile ?? undefined,
                    setAsProfilePhoto,
                    participantFirstName,
                    participantLastName,
                    participantDisplayName,
                    personFirstName: context.person.firstName,
                    personLastName: context.person.lastName,
                    personDisplayName:
                        `${context.person.firstName} ${context.person.lastName}`.trim(),
                });

                setPhotoPublishSuccessMessage(
                    "Ta photo a été mise à jour et renvoyée en modération.",
                );
            } else {
                if (!photoFile) return;

                await createMyPersonPhoto({
                    eventSlug: slug,
                    participantId,
                    personId: centerId,
                    file: photoFile,
                    caption: photoCaption,
                    consentObtained: photoConsentObtained,
                    setAsProfilePhoto,
                    participantFirstName,
                    participantLastName,
                    participantDisplayName,
                    personFirstName: context.person.firstName,
                    personLastName: context.person.lastName,
                    personDisplayName:
                        `${context.person.firstName} ${context.person.lastName}`.trim(),
                });

                setPhotoPublishSuccessMessage("Ta photo sera publiée après validation.");
            }

            setPhotoEditorMode("create");
            setEditingPhotoId(null);
            setPhotoFile(null);
            setPhotoCaption("");
            setPhotoConsentObtained(false);
            setSetAsProfilePhoto(false);

            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSavingPhoto(false);
        }
    }

    async function handleDeletePhoto(photoId: string) {
        if (!participantId) return;

        setDeletingPhotoId(photoId);

        try {
            await deleteMyPersonPhoto({
                photoId,
                participantId,
            });

            if (editingPhotoId === photoId) {
                setEditingPhotoId(null);
                setPhotoEditorMode("create");
                setPhotoFile(null);
                setPhotoCaption("");
                setPhotoConsentObtained(false);
                setPanelMode("photos");
            }

            await loadCurrentPersonData();
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingPhotoId(null);
        }
    }

    async function handleSubmitInPersonAssist() {
        if (!participantId) return;

        setIsSubmittingInPersonAssist(true);
        setInPersonAssistErrorMessage(null);
        setInPersonAssistSuccessMessage(null);

        try {
            const result = await submitInPersonAssist({
                eventSlug: slug,
                helperParticipantId: participantId,
                targetPersonId: centerId,
                targetFirstName: context.person.firstName,
                targetLastName: context.person.lastName,
                targetParticipantId: inPersonAssistTargetParticipantId,
                email: inPersonAssistValues.email || null,
                birthYear: inPersonAssistValues.birthYear
                    ? Number.parseInt(inPersonAssistValues.birthYear, 10)
                    : null,
                declaredPresent: inPersonAssistValues.declaredPresent,
                attended2023: inPersonAssistValues.attended2023,
                attended2024: inPersonAssistValues.attended2024,
                allowName: inPersonAssistValues.allowNameInFamilyTree,
                allowPhoto: inPersonAssistValues.allowPhotoInFamilyTree,
                allowInfo: inPersonAssistValues.allowInfoInFamilyTree,
                targetIsMinor: inPersonAssistValues.targetIsMinor,
                consentCollectedFrom: inPersonAssistValues.consentCollectedFrom,
                notes: inPersonAssistValues.notes,
                testimonyInterest:
                    inPersonAssistValues.testimonyInterest || null,
                testimonyTopics:
                    inPersonAssistValues.testimonyTopics || null,
            });

            setInPersonAssistSuccessMessage(
                result.invitationSent
                    ? "✔️ Invitation envoyée"
                    : "✔️ Informations enregistrées",
            );

            setInPersonAssistValues(EMPTY_IN_PERSON_ASSIST_VALUES);
            await loadCurrentPersonData();
            setPanelMode("relations");
        } catch (error) {
            console.error(error);
            setInPersonAssistErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Impossible d’enregistrer les informations pour le moment.",
            );
        } finally {
            setIsSubmittingInPersonAssist(false);
        }
    }

    function toggleSection(key: string) {
        setOpenSections((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    useEffect(() => {
        void loadVisibilityPreferencesMap();
    }, [slug]);

    useEffect(() => {
        void loadOverridesMap();
    }, [slug]);

    useEffect(() => {
        void loadDefaultGedcomPersonId();
    }, [participantId, slug]);

    useEffect(() => {
        if (!participantId) return;

        let cancelled = false;

        async function run() {
            try {
                const result = await loadFamilyTreePermissions({
                    eventSlug: slug,
                    participantId,
                });

                if (!cancelled) {
                    setPermissions(result.permissions);
                }
            } catch (error) {
                console.error(error);
                if (!cancelled) {
                    setPermissions(null);
                }
            }
        }

        void run();

        return () => {
            cancelled = true;
        };
    }, [slug, participantId]);

    useEffect(() => {
        if (!participantId) return;

        const tracker = createFamilyTreeViewTracker({
            participantId,
            eventSlug: slug,
            sourcePageKey: `/e/${slug}/family-tree/browse`,
            initialPersonId: centerId,
        });

        familyTreeTrackerRef.current = tracker;
        tracker.start();

        return () => {
            familyTreeTrackerRef.current = null;
            void tracker.stop();
        };
    }, [participantId, slug, centerId]);

    useEffect(() => {
        if (!participantId) return;

        const tracker = createPageTimeTracker({
            participantId,
            eventSlug: slug,
            pageKey: `/e/${slug}/family-tree/browse`,
        });

        tracker.start();

        return () => {
            void tracker.stop();
        };
    }, [participantId, slug]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [centerId]);

    useEffect(() => {
        setPanelMode("relations");
    }, [centerId]);

    useEffect(() => {
        if (!displayPerson.canDisplay) {
            setPanelMode("relations");
        }
    }, [displayPerson.canDisplay]);

    useEffect(() => {
        if (displayPerson.canDisplay) {
            setMyVisibilityRequestStatus(null);
            setMyVisibilityRequestModeratorComment(null);
        }
    }, [displayPerson.canDisplay]);

    useEffect(() => {
        if (!participantId) return;

        let isCancelled = false;

        async function run() {
            try {
                await loadCurrentPersonData();
            } catch (e) {
                if (!isCancelled) {
                    console.error("Erreur loadCurrentPersonData", e);
                }
            }
        }

        void run();

        return () => {
            isCancelled = true;
        };
    }, [participantId, loadCurrentPersonData]);

    useEffect(() => {
        if (panelMode !== "in_person_assist") {
            setInPersonAssistErrorMessage(null);
        }
    }, [panelMode]);

    return {
        navigate,
        rootHonoredPersonId,
        centerId,
        setCenterId,
        panelMode,
        setPanelMode,
        permissions,
        canViewMaskedPeople,
        canAssistInPerson,

        defaultGedcomPersonId,
        defaultGedcomPersonLoading,
        hasDefaultTreeEntry,

        effectiveVisibilityLoading,
        overridesLoading,

        displayPerson,
        displayParents,
        displaySpouses,
        displayChildren,
        displaySiblings,
        displayGrandparents,
        visibleOtherBranches,
        heroConfig,
        centerYears,
        centerPath,
        relationshipSummary,
        rootPerson,

        sourcePersonId,
        isOwnProfile,
        isApprovedClaimForCurrentPerson,
        hasPendingClaimForCurrentPerson,
        hasRejectedClaimForCurrentPerson,

        myVisibilityRequestStatus,
        myVisibilityRequestModeratorComment,
        hasPendingVisibilityRequestForCurrentPerson,
        hasRejectedVisibilityRequestForCurrentPerson,

        isSavingIdentityClaim,
        isSavingVisibilityRequest,

        hasTouchedPerson,
        hasKnownPerson,
        hasHeardOfPerson,
        reactionsCount,
        knownCount,
        heardCount,
        shouldDisableKnownButton,
        shouldDisableHeardButton,

        memoriesCount,
        photosCount,
        totalMemoriesCount,
        totalPhotosCount,
        hasAnySubmittedMemory,
        hasAnySubmittedPhoto,

        visibleMemories,
        memoryCounts,
        memoryEditorMode,
        editingMemoryId,
        deletingMemoryId,
        memoryPublishSuccessMessage,
        memoryDraft,
        isSavingMemory,

        visiblePhotos,
        photoCounts,
        photoEditorMode,
        editingPhoto,
        deletingPhotoId,
        photoPublishSuccessMessage,
        photoFile,
        photoCaption,
        photoConsentObtained,
        setAsProfilePhoto,
        isSavingPhoto,

        touchedParticipants,

        openSections,
        toggleSection,
        labelSpouses,
        labelChildren,
        labelSiblings,

        visibilityRequestHasLegitimateFamilyLink,
        setVisibilityRequestHasLegitimateFamilyLink,
        visibilityRequestPersonCannotRequestByThemself,
        setVisibilityRequestPersonCannotRequestByThemself,
        visibilityRequestHasConsent,
        setVisibilityRequestHasConsent,
        visibilityRequestJustification,
        setVisibilityRequestJustification,

        inPersonAssistValues,
        setInPersonAssistValues,
        isSubmittingInPersonAssist,
        inPersonAssistSuccessMessage,
        inPersonAssistErrorMessage,

        personDisplayName: `${displayPerson.firstName} ${displayPerson.lastName}`.trim(),

        goToPerson,
        recenterOnSource,
        recenterOnRoot,

        openCreateMemoryEditor,
        handleEditMemory,
        openCreatePhotoEditor,
        handleEditPhoto,

        setCurrentMemoryDraft,
        handleSaveMemory,
        handleDeleteMemory,

        setPhotoFile,
        setPhotoCaption,
        setPhotoConsentObtained,
        setSetAsProfilePhoto,
        handleSavePhoto,
        handleDeletePhoto,

        handleSubmitVisibilityRequest,
        handleCancelVisibilityRequest,
        handleSetAsMe,
        handleCancelIdentityClaim,

        handleToggleKnown,
        handleToggleHeard,
        handleToggleTouched,

        openInPersonAssistPanel,
        handleSubmitInPersonAssist,
        inPersonAssistParticipantExists,

        attended2023: attendanceFlags.attended2023,
        attended2024: attendanceFlags.attended2024,
        isPresentToday: attendanceFlags.isPresentToday,
    };
}