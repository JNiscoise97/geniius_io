import { createBrowserRouter, Navigate } from "react-router-dom";
import { MobileScaffold } from "../ui/layout/MobileScaffold";
import { AdminScaffold } from "../ui/layout/AdminScaffold";

import { EventLandingPage } from "../features/player/pages/EventLandingPage";
import { ResumeTeamPage } from "../features/player/pages/ResumeTeamPage";
import { TeamSelfiePage } from "../features/player/pages/TeamSelfiePage";
import { ZonePlayPage } from "../features/player/game/pages/ZonePlayPage";

import { AdminHomePage } from "../features/admin/pages/AdminHomePage";
import { AdminLoginPage } from "../features/admin/pages/AdminLoginPage";
import { AdminGuard } from "../features/admin/AdminGuard";
import { AdminEventDashboardPage } from "../features/admin/pages/AdminEventDashboardPage";
import { QuestionScreenMock } from "../features/player/game/QuestionScreenMock";
import { CreateOrJoinTeamPage } from "../features/player/pages/CreateOrJoinTeamPage";
import { TeamDashboardPage } from "../features/player/pages/TeamDashboardPage";
import { TeamZonesPage } from "../features/player/pages/TeamZonesPage";

import { LandingPage } from "../features/public/pages/LandingPage";
import { PreEventFormPage } from "../features/public/pages/PreEventFormPage";
import { PUBLIC_EVENT_SLUG } from "../config/publicEvent";

import { OnboardingHubPage } from "../features/onboarding/pages/OnboardingHubPage";
import { ParticipantIdentityPage } from "../features/participant-identity/pages/ParticipantIdentityPage";
import { ParticipantProfilePage } from "../features/participant-profile/pages/ParticipantProfilePage";
import { ParticipantConsentsPage } from "../features/participant-preferences/pages/ParticipantConsentsPage";
import { OnboardingConfirmationPage } from "../features/onboarding/pages/OnboardingConfirmationPage";

import { ParticipantAttendancePage } from "../features/participant-attendance/pages/ParticipantAttendancePage";
import { ParticipantContactOrganizerPage } from "../features/participant-organizer-messages/pages/ParticipantContactOrganizerPage";

import { FamilyKnowledgeCloseFamilyPage } from "../features/family-knowledge/pages/FamilyKnowledgeCloseFamilyPage";
import { FamilyKnowledgeGrandparentsPage } from "../features/family-knowledge/pages/FamilyKnowledgeGrandparentsPage";
import { FamilyKnowledgeGodparentsPage } from "../features/family-knowledge/pages/FamilyKnowledgeGodparentsPage";
import { FamilyKnowledgeCurrentLinksPage } from "../features/family-knowledge/pages/FamilyKnowledgeCurrentLinksPage";
import { FamilyKnowledgeMemoryPage } from "../features/family-knowledge/pages/FamilyKnowledgeMemoryPage";

import { ParticipantRecoverConfirmPage } from "../features/participant-access/pages/ParticipantRecoverConfirmPage";
import { ParticipantRecoverPage } from "../features/participant-access/pages/ParticipantRecoverPage";
import { ParticipantAccessPage } from "../features/participant-access/pages/ParticipantAccessPage";
import { ParticipantAccessIntroPage } from "../features/participant-access/pages/ParticipantAccessIntroPage";
import { ParticipantAccessCreatePage } from "../features/participant-access/pages/ParticipantAccessCreatePage";

import { DeviceProfilesPage } from "../features/device-profiles/pages/DeviceProfilesPage";
import { ManagedProfilesPage } from "../features/participant-delegations/pages/ManagedProfilesPage";
import { ParticipantGuard } from "../features/guard/ParticipantGuard";
import { FamilyKnowledgeEntryPage } from "../features/family-knowledge/pages/FamilyKnowledgeEntryPage";
import { FamilyTreeHubPage } from "../features/family-tree/pages/FamilyTreeHubPage";
import { PersonSheetPage } from "../features/person-sheet/pages/PersonSheetPage";
import { ParticipantOriginsPage } from "../features/participant-origins/pages/ParticipantOriginsPage";
import { FamilyKnowledgePhotosPage } from "../features/family-knowledge/pages/FamilyKnowledgePhotosPage";
import { ParticipantAccessContinuePage } from "../features/participant-access/pages/ParticipantAccessContinuePage";
import { ParticipantConfirmTokenPage } from "../features/participant-access/pages/ParticipantConfirmTokenPage";
import { ParticipantConfirmDevicePage } from "../features/participant-access/pages/ParticipantConfirmDevicePage";
import { FamilyTreeBrowsePage } from "../features/family-tree/pages/FamilyTreeBrowsePage";
import { FamilyTreeEntryPage } from "../features/family-tree/pages/FamilyTreeEntryPage";
import { FamilyRelationshipStoryPage } from "../features/family-tree/pages/FamilyRelationshipStoryPage";
import { FamilyTreeFindMePage } from "../features/family-tree/pages/FamilyTreeFindMePage";
import { FamilyTreeFindPersonPage } from "../features/family-tree/pages/FamilyTreeFindPersonPage";
import { FamilyTreeHandleProfilePage } from "../features/family-tree/pages/FamilyTreeHandleProfilePage";
import { ModerationQueuePage } from "../features/moderation/pages/ModerationQueuePage";
import { ModerationReviewPage } from "../features/moderation/pages/ModerationReviewPage";
import { TodoPage } from "../features/todo/pages/TodoPage";
import { FamilyTreePersonPage } from "../features/family-tree/pages/FamilyTreePersonPage";
import AnnouncementComposerPage from "../features/announcements/pages/AnnouncementComposerPage";
import { FamilyTreeImproveBranchPage } from "../features/genealogy/pages/FamilyTreeImproveBranchPage";
import { LearnActivityDebugPage } from "../features/player/experiences/learn/pages/LearnActivityDebugPage";
import { LearnRunPage } from "../features/player/experiences/learn/pages/LearnRunPage";
import { ActivityHubPage } from "../features/player/pages/ActivityHubPage";
import { CollectRunPage } from "../features/player/experiences/collect/pages/CollectRunPage";
import { FamilyReactionFeedPage } from "../features/family-reactions/pages/FamilyReactionFeedPage";

import { FamilyDocumentReaderPage } from "../features/family-documents/pages/FamilyDocumentReaderPage";
import { FamilyDocumentsPage } from "../features/family-documents/pages/FamilyDocumentsPage";
import { ActivityLeaderboardPage } from "../features/player/pages/ActivityLeaderboardPage";
import { ParticipantFeedbackPage } from "../features/participant-feedback/pages/ParticipantFeedbackPage";
import { ParticipantEventMemoryPage } from "../features/participant-event-memories/pages/ParticipantEventMemoryPage";
import { AdminEventMemoriesPage } from "../features/participant-event-memories/pages/AdminEventMemoriesPage";
import { AdminEventAttendancePage } from "../features/participant-attendance/pages/AdminEventAttendancePage";
import { AdminFamilyDocumentAnalyticsPage } from "../features/family-documents/pages/AdminFamilyDocumentAnalyticsPage";
import { AdminParticipantDetailsPage } from "../features/admin-participants/pages/AdminParticipantDetailsPage";
import { AdminParticipantsPage } from "../features/admin-participants/pages/AdminParticipantsPage";
import { FamilyTreeBrowseTvPage } from "../features/family-tree/pages/FamilyTreeBrowseTvPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      {
        index: true,
        element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}`} replace />,
      },

      {
        path: "e/:eventSlug",
        children: [
          // Entrée unique
          { index: true, element: <ParticipantAccessIntroPage /> },

          { path: "dev/todo", element: <TodoPage /> },

          // Access flow
          { path: "access/intro", element: <ParticipantAccessIntroPage /> },
          {
            path: "access/continue",
            element: <ParticipantAccessContinuePage />,
          },
          { path: "access/options", element: <ParticipantAccessPage /> },
          {
            path: "access/confirm-token",
            element: <ParticipantConfirmTokenPage />,
          },
          {
            path: "access/confirm-device",
            element: <ParticipantConfirmDevicePage />,
          },
          { path: "access/recover", element: <ParticipantRecoverPage /> },
          {
            path: "access/recover-confirm",
            element: <ParticipantRecoverConfirmPage />,
          },
          { path: "access/create", element: <ParticipantAccessCreatePage /> },
          { path: "device-profiles", element: <DeviceProfilesPage /> },

          // Legacy pre-event / public leftovers
          { path: "welcome/form", element: <PreEventFormPage /> },
          { path: "welcome/identity", element: <ParticipantIdentityPage /> },
          { path: "welcome/origins", element: <ParticipantOriginsPage /> },
          {
            path: "welcome/confirmation",
            element: <OnboardingConfirmationPage />,
          },

          // Protected participant area
          {
            element: <ParticipantGuard />,
            children: [
              { path: "home", element: <LandingPage /> },

              // Onboarding participant
              { path: "welcome", element: <OnboardingHubPage /> },
              { path: "welcome/profile", element: <ParticipantProfilePage /> },
              {
                path: "welcome/preferences",
                element: <ParticipantConsentsPage />,
              },

              // Attendance
              { path: "attendance", element: <ParticipantAttendancePage /> },
              { path: "admin/attendance", element: <AdminEventAttendancePage /> },

              // Contact organizer
              { path: "contact", element: <ParticipantContactOrganizerPage /> },

              // Family knowledge
              {
                path: "family-knowledge",
                element: <FamilyKnowledgeEntryPage />,
              },
              {
                path: "family-knowledge/close-family",
                element: <FamilyKnowledgeCloseFamilyPage />,
              },
              {
                path: "family-knowledge/grandparents",
                element: <FamilyKnowledgeGrandparentsPage />,
              },
              {
                path: "family-knowledge/godparents",
                element: <FamilyKnowledgeGodparentsPage />,
              },
              {
                path: "family-knowledge/current-links",
                element: <FamilyKnowledgeCurrentLinksPage />,
              },
              {
                path: "family-knowledge/memory",
                element: <FamilyKnowledgeMemoryPage />,
              },

              {
                path: "family-knowledge/photos",
                element: <FamilyKnowledgePhotosPage />,
              },

              // Family tree
              { path: "family-tree", element: <FamilyTreeEntryPage /> },
              { path: "arbre", element: <FamilyTreeHubPage /> },

              { path: "family-tree/browse", element: <FamilyTreeBrowsePage /> },
              { path: "/e/:eventSlug/family-tree/browse-tv", element: <FamilyTreeBrowseTvPage /> },
              {
                path: "family-tree/story",
                element: <FamilyRelationshipStoryPage />,
              },
              {
                path: "family-tree/find-me",
                element: <FamilyTreeFindMePage />,
              },
              {
                path: "family-tree/handle-profile",
                element: <FamilyTreeHandleProfilePage />,
              },
              {
                path: "family-tree/find-person",
                element: <FamilyTreeFindPersonPage />,
              },
              { path: "family-tree/person", element: <FamilyTreePersonPage /> },

              {
                path: "family-tree/improve",
                element: <FamilyTreeImproveBranchPage />,
              },

              { path: "fiche", element: <PersonSheetPage /> },

              // Managed profilesa
              { path: "managed-profiles", element: <ManagedProfilesPage /> },

              // Existing / game routes
              { path: "deprec-landing", element: <EventLandingPage /> },
              { path: "team/create", element: <CreateOrJoinTeamPage /> },
              { path: "team/resume", element: <ResumeTeamPage /> },
              { path: "team/selfie", element: <TeamSelfiePage /> },
              { path: "team-dashboard", element: <TeamDashboardPage /> },
              { path: "zones", element: <TeamZonesPage /> },
              { path: "z/:zoneId/play", element: <ZonePlayPage /> },

              { path: "moderation", element: <ModerationQueuePage /> },
              {
                path: "moderation/:entityType/:entityId",
                element: <ModerationReviewPage />,
              },

              {
                path: "/e/:eventSlug/activities",
                element: <ActivityHubPage />,
              },
              {
                path: "/e/:eventSlug/activities/learn/:activitySlug",
                element: <LearnRunPage />,
              },
              {
                path: "/e/:eventSlug/activities/learn/:activitySlug/debug",
                element: <LearnActivityDebugPage />,
              },
              {
                path: "/e/:eventSlug/activities/collect/:activitySlug",
                element: <CollectRunPage />,
              },
              {
                path: "/e/:eventSlug/activities/classement",
                element: <ActivityLeaderboardPage />,
              },

              {
                path: "announcements/new",
                element: <AnnouncementComposerPage />,
              },

              {
                path: "/e/:eventSlug/reactions",
                element: <FamilyReactionFeedPage />,
              },

              {
                path: "/e/:eventSlug/documents",
                element: <FamilyDocumentsPage />,
              },

              {
                path: "/e/:eventSlug/documents/:documentSlug",
                element: <FamilyDocumentReaderPage />,
              },


              {
                path: "avis",
                element: <ParticipantFeedbackPage />,
              },
              { path: "temoignage", element: <ParticipantEventMemoryPage /> },
            ],
          },
        ],
      },

      { path: "question-mock", element: <QuestionScreenMock /> },
    ],
  },

  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: <AdminGuard />,
    children: [
      {
        path: "",
        element: <AdminScaffold />,
        children: [
          { index: true, element: <AdminHomePage /> },
          { path: "events/:eventSlug", element: <AdminEventDashboardPage /> },
          { path: "events/:eventSlug/memories", element: <AdminEventMemoriesPage /> },
          { path: "events/:eventSlug/documents", element: <AdminFamilyDocumentAnalyticsPage /> },
          { path: "events/:eventSlug/participants", element: <AdminParticipantsPage /> },
          { path: "events/:eventSlug/participants/:participantId", element: <AdminParticipantDetailsPage /> },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}`} replace /> },
]);
