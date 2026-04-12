import { PersonInteractionsSection } from "../interactions/PersonInteractionsSection";
import { PersonMemoriesPanel } from "../interactions/PersonMemoriesPanel";
import { PersonMemoryEditorPanel } from "../interactions/PersonMemoryEditorPanel";
import { PersonPhotoEditorPanel } from "../interactions/PersonPhotoEditorPanel";
import { PersonPhotosPanel } from "../interactions/PersonPhotosPanel";
import { PersonTouchedPanel } from "../interactions/PersonTouchedPanel";
import { PersonVisibilityRequestFormPanel } from "../interactions/PersonVisibilityRequestFormPanel";
import { FamilyRelationsSection } from "../relations/FamilyRelationsSection";
import {
    PersonInPersonAssistFormPanel,
    type PersonInPersonAssistValues,
} from "../in-person/PersonInPersonAssistFormPanel";
import type { BrowsePanelMode } from "../../types/browse";
import type { FamilyTreeViaAction } from "../../../../lib/analytics/familyTreeViewTracker";
import type { PersonSummary } from "../../types/person";
import type { PersonMemoryItem } from "../../data/memories/getVisiblePersonMemories";
import type { PersonPhotoItem } from "../../data/photos/getVisiblePersonPhotos";
import type { TouchedParticipantItem } from "../../data/reactions/getTouchedParticipants";
import type { MyPersonMemoryModerationCounts } from "../../data/memories/getMyPersonMemoryModerationCounts";
import type { MyPersonPhotoModerationCounts } from "../../data/photos/getMyPersonPhotoModerationCounts";

type Props = {
  heroHeaderClassName: string;
  panelMode: BrowsePanelMode;
  personDisplayName: string;
  isOwnProfile: boolean;
  canDisplay: boolean;
  canAssistInPerson: boolean;
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
  moderatorComment: string | null;

  openSections: Record<string, boolean>;
  onToggleSection: (key: string) => void;
  onSelectRelation: (personId: string, viaAction: FamilyTreeViaAction) => void;
  labelSpouses: string;
  labelChildren: string;
  labelSiblings: string;
  parents: PersonSummary[];
  spouses: PersonSummary[];
  children: PersonSummary[];
  siblings: PersonSummary[];
  grandparents: PersonSummary[];

  memories: PersonMemoryItem[];
  currentParticipantId?: string | null;
  isDeletingMemoryId?: string | null;
  onEditMemory: (memoryId: string) => void;
  onDeleteMemory: (memoryId: string) => void;

  memoryDraft: string;
  memoryEditorMode: "create" | "edit";
  memoryModerationStatus: "pending" | "approved" | "rejected" | null;
  memoryModeratorComment?: string | null;
  memoryCounts: MyPersonMemoryModerationCounts;
  memoryPublishSuccessMessage?: string | null;
  isSavingMemory: boolean;
  onChangeMemoryDraft: (value: string) => void;
  onSaveMemory: () => void;

  photos: PersonPhotoItem[];
  isDeletingPhotoId?: string | null;
  onEditPhoto: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;

  photoEditorMode: "create" | "edit";
  photoFile: File | null;
  editingPhotoPublicUrl?: string | null;
  photoCaption: string;
  photoConsentObtained: boolean;
  setAsProfilePhoto: boolean;
  photoCounts: MyPersonPhotoModerationCounts;
  photoPublishSuccessMessage?: string | null;
  isSavingPhoto: boolean;
  onSelectPhotoFile: (file: File) => void;
  onChangePhotoCaption: (value: string) => void;
  onChangePhotoConsent: (value: boolean) => void;
  onChangeSetAsProfilePhoto: (value: boolean) => void;
  onSavePhoto: () => void;

  touchedParticipants: TouchedParticipantItem[];

  visibilityRequestHasLegitimateFamilyLink: boolean;
  visibilityRequestPersonCannotRequestByThemself: boolean;
  visibilityRequestHasConsent: boolean;
  visibilityRequestJustification: string;
  onChangeVisibilityRequestHasLegitimateFamilyLink: (value: boolean) => void;
  onChangeVisibilityRequestPersonCannotRequestByThemself: (value: boolean) => void;
  onChangeVisibilityRequestHasConsent: (value: boolean) => void;
  onChangeVisibilityRequestJustification: (value: string) => void;
  onSubmitVisibilityRequest: () => void;

  inPersonAssistValues: PersonInPersonAssistValues;
  isSubmittingInPersonAssist: boolean;
  inPersonAssistSuccessMessage?: string | null;
  inPersonAssistErrorMessage?: string | null;
  participantExists: boolean;
  onChangeInPersonAssistValues: (values: PersonInPersonAssistValues) => void;
  onSubmitInPersonAssist: () => void;

  onBackToRelations: () => void;
  onOpenVisibilityRequestForm: () => void;
  onCancelVisibilityRequest: () => void;
  onOpenMemories: () => void;
  onOpenPhotos: () => void;
  onOpenTouched: () => void;
  onOpenMemoryEditor: () => void;
  onOpenPhotoEditor: () => void;
  onToggleTouched: () => void;
  onToggleKnown: () => void;
  onToggleHeard: () => void;
  onSetAsMe: () => void;
  onCancelIdentityClaim: () => void;
  onOpenInPersonAssist: () => void;
};

export function FamilyTreeBrowsePanelContent(props: Props) {
    return (
        <>
            <PersonInteractionsSection
                canDisplay={props.canDisplay}
                isPossiblyAlive={props.isPossiblyAlive}
                sex={props.sex}
                isApprovedClaimForCurrentPerson={props.isApprovedClaimForCurrentPerson}
                hasPendingClaimForCurrentPerson={props.hasPendingClaimForCurrentPerson}
                hasRejectedClaimForCurrentPerson={props.hasRejectedClaimForCurrentPerson}
                hasPendingVisibilityRequestForCurrentPerson={
                    props.hasPendingVisibilityRequestForCurrentPerson
                }
                hasRejectedVisibilityRequestForCurrentPerson={
                    props.hasRejectedVisibilityRequestForCurrentPerson
                }
                isSavingIdentityClaim={props.isSavingIdentityClaim}
                isSavingVisibilityRequest={props.isSavingVisibilityRequest}
                sourcePersonId={props.sourcePersonId}
                hasTouchedPerson={props.hasTouchedPerson}
                hasKnownPerson={props.hasKnownPerson}
                hasHeardOfPerson={props.hasHeardOfPerson}
                hasAnySubmittedMemory={props.hasAnySubmittedMemory}
                hasAnySubmittedPhoto={props.hasAnySubmittedPhoto}
                totalMemoriesCount={props.totalMemoriesCount}
                totalPhotosCount={props.totalPhotosCount}
                reactionsCount={props.reactionsCount}
                knownCount={props.knownCount}
                heardCount={props.heardCount}
                onOpenVisibilityRequestForm={props.onOpenVisibilityRequestForm}
                onCancelVisibilityRequest={props.onCancelVisibilityRequest}
                panelMode={props.panelMode}
                moderatorComment={props.moderatorComment}
                onOpenMemories={props.onOpenMemories}
                onOpenPhotos={props.onOpenPhotos}
                onOpenTouched={props.onOpenTouched}
                onOpenMemoryEditor={props.onOpenMemoryEditor}
                onOpenPhotoEditor={props.onOpenPhotoEditor}
                onToggleTouched={props.onToggleTouched}
                onToggleKnown={props.onToggleKnown}
                onToggleHeard={props.onToggleHeard}
                onSetAsMe={props.onSetAsMe}
                onCancelIdentityClaim={props.onCancelIdentityClaim}
                canAssistInPerson={props.canAssistInPerson}
                onOpenInPersonAssist={props.onOpenInPersonAssist}
            />

            {props.panelMode === "relations" ? (
                <FamilyRelationsSection
                    headerClassName={props.heroHeaderClassName}
                    openSections={props.openSections}
                    onToggle={props.onToggleSection}
                    onSelect={props.onSelectRelation}
                    labelSpouses={props.labelSpouses}
                    labelChildren={props.labelChildren}
                    labelSiblings={props.labelSiblings}
                    parents={props.parents}
                    spouses={props.spouses}
                    children={props.children}
                    siblings={props.siblings}
                    grandparents={props.grandparents}
                />
            ) : props.panelMode === "memories" ? (
                <PersonMemoriesPanel
                    memories={props.memories}
                    currentParticipantId={props.currentParticipantId}
                    isDeletingMemoryId={props.isDeletingMemoryId}
                    onEditMemory={props.onEditMemory}
                    onDeleteMemory={props.onDeleteMemory}
                    onBack={props.onBackToRelations}
                />
            ) : props.panelMode === "visibility_request" ? (
                <PersonVisibilityRequestFormPanel
                    hasLegitimateFamilyLink={
                        props.visibilityRequestHasLegitimateFamilyLink
                    }
                    personCannotRequestByThemself={
                        props.visibilityRequestPersonCannotRequestByThemself
                    }
                    hasConsent={props.visibilityRequestHasConsent}
                    justification={props.visibilityRequestJustification}
                    isSubmitting={props.isSavingVisibilityRequest}
                    onBack={props.onBackToRelations}
                    onChangeHasLegitimateFamilyLink={
                        props.onChangeVisibilityRequestHasLegitimateFamilyLink
                    }
                    onChangePersonCannotRequestByThemself={
                        props.onChangeVisibilityRequestPersonCannotRequestByThemself
                    }
                    onChangeHasConsent={props.onChangeVisibilityRequestHasConsent}
                    onChangeJustification={props.onChangeVisibilityRequestJustification}
                    onSubmit={props.onSubmitVisibilityRequest}
                />
            ) : props.panelMode === "touched" ? (
                <PersonTouchedPanel
                    participants={props.touchedParticipants}
                    onBack={props.onBackToRelations}
                />
            ) : props.panelMode === "memory_editor" ? (
                <PersonMemoryEditorPanel
                    personDisplayName={props.personDisplayName}
                    isOwnProfile={props.isOwnProfile}
                    initialValue={props.memoryDraft}
                    mode={props.memoryEditorMode}
                    moderationStatus={props.memoryModerationStatus}
                    moderatorComment={props.memoryModeratorComment}
                    counts={props.memoryCounts}
                    publishSuccessMessage={props.memoryPublishSuccessMessage}
                    isSaving={props.isSavingMemory}
                    onChange={props.onChangeMemoryDraft}
                    onSave={props.onSaveMemory}
                    onBack={props.onBackToRelations}
                />
            ) : props.panelMode === "photo_upload" ? (
                <PersonPhotoEditorPanel
                    personDisplayName={props.personDisplayName}
                    isPossiblyAlive={props.isPossiblyAlive}
                    isOwnProfile={props.isOwnProfile}
                    mode={props.photoEditorMode}
                    selectedFile={props.photoFile}
                    existingPhotoUrl={props.editingPhotoPublicUrl ?? null}
                    caption={props.photoCaption}
                    consentObtained={props.photoConsentObtained}
                    setAsProfilePhoto={props.setAsProfilePhoto}
                    counts={props.photoCounts}
                    publishSuccessMessage={props.photoPublishSuccessMessage}
                    isSubmitting={props.isSavingPhoto}
                    onBack={props.onBackToRelations}
                    onSelectFile={props.onSelectPhotoFile}
                    onChangeCaption={props.onChangePhotoCaption}
                    onChangeConsent={props.onChangePhotoConsent}
                    onChangeSetAsProfilePhoto={props.onChangeSetAsProfilePhoto}
                    onSubmit={props.onSavePhoto}
                />
            ) : props.panelMode === "in_person_assist" ? (
                <PersonInPersonAssistFormPanel
                    personDisplayName={props.personDisplayName}
                    participantExists={props.participantExists}
                    values={props.inPersonAssistValues}
                    isSubmitting={props.isSubmittingInPersonAssist}
                    successMessage={props.inPersonAssistSuccessMessage}
                    errorMessage={props.inPersonAssistErrorMessage}
                    onBack={props.onBackToRelations}
                    onChange={props.onChangeInPersonAssistValues}
                    onSubmit={props.onSubmitInPersonAssist}
                />
            ) : (
                <PersonPhotosPanel
                    photos={props.photos}
                    currentParticipantId={props.currentParticipantId}
                    isDeletingPhotoId={props.isDeletingPhotoId}
                    onEditPhoto={props.onEditPhoto}
                    onDeletePhoto={props.onDeletePhoto}
                    onBack={props.onBackToRelations}
                />
            )}
        </>
    );
}