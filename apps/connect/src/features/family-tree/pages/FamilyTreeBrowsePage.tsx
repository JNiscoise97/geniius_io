import { ArrowLeft, Compass, Lock, Search } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";

import { FamilyTreeBrowseHeroSection } from "../components/browse/FamilyTreeBrowseHeroSection";
import { FamilyTreeBrowseNavigationSection } from "../components/browse/FamilyTreeBrowseNavigationSection";
import { FamilyTreeBrowsePanelContent } from "../components/browse/FamilyTreeBrowsePanelContent";
import { useFamilyTreeBrowsePageState } from "../hooks/useFamilyTreeBrowsePageState";

export function FamilyTreeBrowsePage() {
  const { eventSlug } = useParams();
  const slug = eventSlug ?? "demo";

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  const participantFirstName =
    participantSession?.firstName?.trim() || undefined;
  const participantLastName =
    participantSession?.lastName?.trim() || undefined;

  const participantDisplayName =
    participantSession?.label?.trim() ||
    [participantFirstName, participantLastName].filter(Boolean).join(" ").trim() ||
    undefined;

  const [searchParams] = useSearchParams();
  const requestedPersonId = searchParams.get("personId");

  const state = useFamilyTreeBrowsePageState({
    slug,
    participantId,
    participantFirstName,
    participantLastName,
    participantDisplayName,
    requestedPersonId,
  });

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-3">
        <section>
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => state.navigate(`/e/${slug}/family-tree/find-person`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <Search size={14} />
                Chercher une personne
              </span>
            </button>

            <button
              type="button"
              onClick={() => state.navigate(`/e/${slug}/family-tree`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>
        </section>

        {state.effectiveVisibilityLoading || state.overridesLoading ? (
          <section className="mt-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                Chargement de la fiche…
              </div>
            </div>
          </section>
        ) : !state.defaultGedcomPersonLoading && !state.hasDefaultTreeEntry ? (
          <section className="mt-3 space-y-3">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-amber-900">
                    L’exploration de l’arbre n’est pas encore disponible pour toi
                  </div>
                  <div className="mt-1 text-xs leading-5 text-amber-800">
                    L’organisation n’a pas encore suffisamment d’éléments pour
                    te rattacher à une branche de l’arbre.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => state.navigate(`/e/${slug}/family-knowledge`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--blue)] px-4 py-3 text-sm font-black text-white transition active:scale-[0.99]"
            >
              <Compass size={16} />
              Renseigner ma famille
            </button>
          </section>
        ) : (
          <>
            <FamilyTreeBrowseHeroSection
              personId={state.centerId}
              firstName={state.displayPerson.firstName}
              lastName={state.displayPerson.lastName}
              nickname={state.displayPerson.nickname}
              sex={state.displayPerson.sex}
              canDisplay={state.displayPerson.canDisplay}
              canDisplayName={state.displayPerson.canDisplayName}
              canDisplayPhoto={state.displayPerson.canDisplayPhoto}
              canDisplayInfo={state.displayPerson.canDisplayInfo}
              photoSrc={state.displayPerson.photoSrc}
              centerYears={state.centerYears}
              centerPath={state.centerPath}
              visibleOtherBranches={state.visibleOtherBranches}
              heroClassName={state.heroConfig.heroClassName}
              isApprovedClaimForCurrentPerson={state.isApprovedClaimForCurrentPerson}
              isOwnProfile={state.isOwnProfile}
              ownProfileBadgeClassName={state.heroConfig.ownProfileBadgeClassName}
              relationshipSummary={state.relationshipSummary}
              showRelationshipSummary={state.centerId !== state.rootHonoredPersonId}
              onOpenPerson={(personId) =>
                state.navigate(`/e/${slug}/family-tree/person?id=${personId}`)
              }
              attended2023={state.attended2023}
              attended2024={state.attended2024}
              isPresentToday={state.isPresentToday}
            />

            <FamilyTreeBrowsePanelContent
              heroHeaderClassName={state.heroConfig.headerClassName}
              panelMode={state.panelMode}
              personDisplayName={state.personDisplayName}
              isOwnProfile={state.isOwnProfile}
              canDisplay={state.displayPerson.canDisplay}
              canAssistInPerson={state.canAssistInPerson}
              isPossiblyAlive={state.displayPerson.isPossiblyAlive === true}
              sex={state.displayPerson.sex}
              isApprovedClaimForCurrentPerson={state.isApprovedClaimForCurrentPerson}
              hasPendingClaimForCurrentPerson={state.hasPendingClaimForCurrentPerson}
              hasRejectedClaimForCurrentPerson={state.hasRejectedClaimForCurrentPerson}
              hasPendingVisibilityRequestForCurrentPerson={
                state.hasPendingVisibilityRequestForCurrentPerson
              }
              hasRejectedVisibilityRequestForCurrentPerson={
                state.hasRejectedVisibilityRequestForCurrentPerson
              }
              isSavingIdentityClaim={state.isSavingIdentityClaim}
              isSavingVisibilityRequest={state.isSavingVisibilityRequest}
              sourcePersonId={state.sourcePersonId}
              hasTouchedPerson={state.hasTouchedPerson}
              hasKnownPerson={state.hasKnownPerson}
              hasHeardOfPerson={state.hasHeardOfPerson}
              hasAnySubmittedMemory={state.hasAnySubmittedMemory}
              hasAnySubmittedPhoto={state.hasAnySubmittedPhoto}
              totalMemoriesCount={state.totalMemoriesCount}
              totalPhotosCount={state.totalPhotosCount}
              reactionsCount={state.reactionsCount}
              knownCount={state.knownCount}
              heardCount={state.heardCount}
              moderatorComment={state.myVisibilityRequestModeratorComment}
              openSections={state.openSections}
              onToggleSection={state.toggleSection}
              onSelectRelation={state.goToPerson}
              labelSpouses={state.labelSpouses}
              labelChildren={state.labelChildren}
              labelSiblings={state.labelSiblings}
              parents={state.displayParents}
              spouses={state.displaySpouses}
              children={state.displayChildren}
              siblings={state.displaySiblings}
              grandparents={state.displayGrandparents}
              memories={state.visibleMemories}
              currentParticipantId={participantId}
              isDeletingMemoryId={state.deletingMemoryId}
              onEditMemory={state.handleEditMemory}
              onDeleteMemory={(id) => void state.handleDeleteMemory(id)}
              memoryDraft={state.memoryDraft}
              memoryEditorMode={state.memoryEditorMode}
              memoryModerationStatus={null}
              memoryModeratorComment={null}
              memoryCounts={state.memoryCounts}
              memoryPublishSuccessMessage={state.memoryPublishSuccessMessage}
              isSavingMemory={state.isSavingMemory}
              onChangeMemoryDraft={state.setCurrentMemoryDraft}
              onSaveMemory={() => void state.handleSaveMemory()}
              photos={state.visiblePhotos}
              isDeletingPhotoId={state.deletingPhotoId}
              onEditPhoto={state.handleEditPhoto}
              onDeletePhoto={(id) => void state.handleDeletePhoto(id)}
              photoEditorMode={state.photoEditorMode}
              photoFile={state.photoFile}
              editingPhotoPublicUrl={state.editingPhoto?.public_url ?? null}
              photoCaption={state.photoCaption}
              photoConsentObtained={state.photoConsentObtained}
              setAsProfilePhoto={state.setAsProfilePhoto}
              photoCounts={state.photoCounts}
              photoPublishSuccessMessage={state.photoPublishSuccessMessage}
              isSavingPhoto={state.isSavingPhoto}
              onSelectPhotoFile={state.setPhotoFile}
              onChangePhotoCaption={state.setPhotoCaption}
              onChangePhotoConsent={state.setPhotoConsentObtained}
              onChangeSetAsProfilePhoto={state.setSetAsProfilePhoto}
              onSavePhoto={() => void state.handleSavePhoto()}
              touchedParticipants={state.touchedParticipants}
              visibilityRequestHasLegitimateFamilyLink={
                state.visibilityRequestHasLegitimateFamilyLink
              }
              visibilityRequestPersonCannotRequestByThemself={
                state.visibilityRequestPersonCannotRequestByThemself
              }
              visibilityRequestHasConsent={state.visibilityRequestHasConsent}
              visibilityRequestJustification={state.visibilityRequestJustification}
              onChangeVisibilityRequestHasLegitimateFamilyLink={
                state.setVisibilityRequestHasLegitimateFamilyLink
              }
              onChangeVisibilityRequestPersonCannotRequestByThemself={
                state.setVisibilityRequestPersonCannotRequestByThemself
              }
              onChangeVisibilityRequestHasConsent={
                state.setVisibilityRequestHasConsent
              }
              onChangeVisibilityRequestJustification={
                state.setVisibilityRequestJustification
              }
              onSubmitVisibilityRequest={() => void state.handleSubmitVisibilityRequest()}
              inPersonAssistValues={state.inPersonAssistValues}
              isSubmittingInPersonAssist={state.isSubmittingInPersonAssist}
              onChangeInPersonAssistValues={state.setInPersonAssistValues}
              onSubmitInPersonAssist={() => void state.handleSubmitInPersonAssist()}
              onBackToRelations={() => state.setPanelMode("relations")}
              onOpenVisibilityRequestForm={() => state.setPanelMode("visibility_request")}
              onCancelVisibilityRequest={() => void state.handleCancelVisibilityRequest()}
              onOpenMemories={() => state.setPanelMode("memories")}
              onOpenPhotos={() => state.setPanelMode("photos")}
              onOpenTouched={() => state.setPanelMode("touched")}
              onOpenMemoryEditor={state.openCreateMemoryEditor}
              onOpenPhotoEditor={state.openCreatePhotoEditor}
              onToggleTouched={() => void state.handleToggleTouched()}
              onToggleKnown={() => void state.handleToggleKnown()}
              onToggleHeard={() => void state.handleToggleHeard()}
              onSetAsMe={() => void state.handleSetAsMe()}
              onCancelIdentityClaim={() => void state.handleCancelIdentityClaim()}
              onOpenInPersonAssist={() => void state.openInPersonAssistPanel()}
              inPersonAssistSuccessMessage={state.inPersonAssistSuccessMessage}
              inPersonAssistErrorMessage={state.inPersonAssistErrorMessage}
              participantExists={state.inPersonAssistParticipantExists}
            />

            {state.panelMode === "relations" ? (
              <FamilyTreeBrowseNavigationSection
                centerId={state.centerId}
                rootHonoredPersonId={state.rootHonoredPersonId}
                rootFirstName={state.rootPerson.firstName}
                sourcePersonId={state.sourcePersonId}
                onRecenterOnRoot={state.recenterOnRoot}
                onRecenterOnSource={state.recenterOnSource}
              />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}