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
import { ParticipantPreferencesPage } from "../features/participant-preferences/pages/ParticipantPreferencesPage";
import { OnboardingConfirmationPage } from "../features/onboarding/pages/OnboardingConfirmationPage";

import { ParticipantAttendancePage } from "../features/participant-attendance/pages/ParticipantAttendancePage";
import { ParticipantContactOrganizerPage } from "../features/participant-organizer-messages/pages/ParticipantContactOrganizerPage";

import { BranchesPage } from "../features/family-tree/pages/BranchesPage";
import { FamiliesPage } from "../features/family-tree/pages/FamiliesPage";
import { SiblingsPage } from "../features/family-tree/pages/SiblingsPage";
import { PersonPage } from "../features/family-tree/pages/PersonPage";
import { LineagePage } from "../features/family-tree/pages/LineagePage";

import { FamilyKnowledgeCloseFamilyPage } from "../features/family-knowledge/pages/FamilyKnowledgeCloseFamilyPage";
import { FamilyKnowledgeGrandparentsPage } from "../features/family-knowledge/pages/FamilyKnowledgeGrandparentsPage";
import { FamilyKnowledgeGodparentsPage } from "../features/family-knowledge/pages/FamilyKnowledgeGodparentsPage";
import { FamilyKnowledgeCurrentLinksPage } from "../features/family-knowledge/pages/FamilyKnowledgeCurrentLinksPage";
import { FamilyKnowledgeMemoryPage } from "../features/family-knowledge/pages/FamilyKnowledgeMemoryPage";

import { ParticipantRecoverConfirmPage } from "../features/participant-access/pages/ParticipantRecoverConfirmPage";
import { ParticipantRecoverPage } from "../features/participant-access/pages/ParticipantRecoverPage";
import { ParticipantAccessPage } from "../features/participant-access/pages/ParticipantAccessPage";
import { ParticipantAccessGatePage } from "../features/participant-access/pages/ParticipantAccessGatePage";
import { ParticipantAccessIntroPage } from "../features/participant-access/pages/ParticipantAccessIntroPage";
import { ParticipantAccessCreatePage } from "../features/participant-access/pages/ParticipantAccessCreatePage";

import { DeviceProfilesPage } from "../features/device-profiles/pages/DeviceProfilesPage";
import { ManagedProfilesPage } from "../features/participant-delegations/pages/ManagedProfilesPage";
import { ParticipantGuard } from "../features/guard/ParticipantGuard";
import { FamilyKnowledgeEntryPage } from "../features/family-knowledge/pages/FamilyKnowledgeEntryPage";
import { FamilyTreeHubPage } from "../features/family-tree/pages/FamilyTreeHubPage";
import { PersonSheetPage } from "../features/person-sheet/pages/PersonSheetPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      { index: true, element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}`} replace /> },

      {
        path: "e/:eventSlug",
        children: [
          // Entrée unique
          { index: true, element: <ParticipantAccessGatePage /> },

          // Access flow
          { path: "access/options", element: <ParticipantAccessPage /> },
          { path: "access/intro", element: <ParticipantAccessIntroPage /> },
          { path: "access/recover", element: <ParticipantRecoverPage /> },
          { path: "access/create", element: <ParticipantAccessCreatePage /> },
          {
            path: "access/recover/confirm",
            element: <ParticipantRecoverConfirmPage />,
          },
          { path: "device-profiles", element: <DeviceProfilesPage /> },

          // Legacy pre-event / public leftovers
          { path: "welcome/form", element: <PreEventFormPage /> },
          { path: "welcome/identity", element: <ParticipantIdentityPage /> },
          { path: "welcome/confirmation", element: <OnboardingConfirmationPage /> },

          // Protected participant area
          {
            element: <ParticipantGuard />,
            children: [
              { path: "home", element: <LandingPage /> },

              // Onboarding participant
              { path: "welcome", element: <OnboardingHubPage /> },
              { path: "welcome/profile", element: <ParticipantProfilePage /> },
              { path: "welcome/preferences", element: <ParticipantPreferencesPage /> },

              // Attendance
              { path: "attendance", element: <ParticipantAttendancePage /> },

              // Contact organizer
              { path: "contact", element: <ParticipantContactOrganizerPage /> },

              // Family knowledge
              { path: "family-knowledge", element: <FamilyKnowledgeEntryPage /> },
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
              { path: "family-knowledge/memory", element: <FamilyKnowledgeMemoryPage /> },

              // Family tree
              { path: "arbre", element: <FamilyTreeHubPage /> },
              { path: "arbre2", element: <BranchesPage /> },
              { path: "arbre/branches/:branchId/families", element: <FamiliesPage /> },
              { path: "arbre/families/:familyId/siblings", element: <SiblingsPage /> },
              { path: "arbre/persons/:personId", element: <PersonPage /> },
              { path: "arbre/persons/:personId/lineage", element: <LineagePage /> },

              { path: "fiche", element: <PersonSheetPage /> },

              // Managed profiles
              { path: "managed-profiles", element: <ManagedProfilesPage /> },

              // Existing / game routes
              { path: "deprec-landing", element: <EventLandingPage /> },
              { path: "team/create", element: <CreateOrJoinTeamPage /> },
              { path: "team/resume", element: <ResumeTeamPage /> },
              { path: "team/selfie", element: <TeamSelfiePage /> },
              { path: "team-dashboard", element: <TeamDashboardPage /> },
              { path: "zones", element: <TeamZonesPage /> },
              { path: "z/:zoneId/play", element: <ZonePlayPage /> },
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
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}`} replace /> },
]);