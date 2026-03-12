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
import { ParticipantContactPage } from "../features/participant-contact/pages/ParticipantContactPage";
import { ParticipantPreferencesPage } from "../features/participant-preferences/pages/ParticipantPreferencesPage";
import { OnboardingConfirmationPage } from "../features/onboarding/pages/OnboardingConfirmationPage";

import { ParticipantAttendancePage } from "../features/participant-attendance/pages/ParticipantAttendancePage";

import { BranchesPage } from "../features/family-tree/pages/BranchesPage";
import { FamiliesPage } from "../features/family-tree/pages/FamiliesPage";
import { SiblingsPage } from "../features/family-tree/pages/SiblingsPage";
import { PersonPage } from "../features/family-tree/pages/PersonPage";
import { LineagePage } from "../features/family-tree/pages/LineagePage";

import { FamilyKnowledgeHubPage } from "../features/family-knowledge/pages/FamilyKnowledgeHubPage";
import { FamilyKnowledgeIntroPage } from "../features/family-knowledge/pages/FamilyKnowledgeIntroPage";
import { FamilyKnowledgeCloseFamilyPage } from "../features/family-knowledge/pages/FamilyKnowledgeCloseFamilyPage";
import { FamilyKnowledgeGrandparentsPage } from "../features/family-knowledge/pages/FamilyKnowledgeGrandparentsPage";
import { FamilyKnowledgeGodparentsPage } from "../features/family-knowledge/pages/FamilyKnowledgeGodparentsPage";
import { FamilyKnowledgeCurrentLinksPage } from "../features/family-knowledge/pages/FamilyKnowledgeCurrentLinksPage";
import { FamilyKnowledgeMemoryPage } from "../features/family-knowledge/pages/FamilyKnowledgeMemoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      { index: true, element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}`} replace /> },

      // Landing publique
      { path: "e/:eventSlug", element: <LandingPage /> },

      // Ancien écran pré-événement
      { path: "e/:eventSlug/welcome/form", element: <PreEventFormPage /> },

      // Onboarding participant
      { path: "e/:eventSlug/welcome", element: <OnboardingHubPage /> },
      { path: "e/:eventSlug/welcome/identity", element: <ParticipantIdentityPage /> },
      { path: "e/:eventSlug/welcome/profile", element: <ParticipantProfilePage /> },
      { path: "e/:eventSlug/welcome/contact", element: <ParticipantContactPage /> },
      { path: "e/:eventSlug/welcome/preferences", element: <ParticipantPreferencesPage /> },
      { path: "e/:eventSlug/welcome/confirmation", element: <OnboardingConfirmationPage /> },

      // Attendance
      { path: "e/:eventSlug/attendance", element: <ParticipantAttendancePage /> },

      // Family knowledge
      { path: "e/:eventSlug/family-knowledge", element: <FamilyKnowledgeHubPage /> },
      { path: "e/:eventSlug/family-knowledge/intro", element: <FamilyKnowledgeIntroPage /> },
      { path: "e/:eventSlug/family-knowledge/close-family", element: <FamilyKnowledgeCloseFamilyPage /> },
      { path: "e/:eventSlug/family-knowledge/grandparents", element: <FamilyKnowledgeGrandparentsPage /> },
      { path: "e/:eventSlug/family-knowledge/godparents", element: <FamilyKnowledgeGodparentsPage /> },
      { path: "e/:eventSlug/family-knowledge/current-links", element: <FamilyKnowledgeCurrentLinksPage /> },
      { path: "e/:eventSlug/family-knowledge/memory", element: <FamilyKnowledgeMemoryPage /> },

      // Arbre familial
      { path: "e/:eventSlug/arbre", element: <BranchesPage /> },
      { path: "e/:eventSlug/arbre/branches/:branchId/families", element: <FamiliesPage /> },
      { path: "e/:eventSlug/arbre/families/:familyId/siblings", element: <SiblingsPage /> },
      { path: "e/:eventSlug/arbre/persons/:personId", element: <PersonPage /> },
      { path: "e/:eventSlug/arbre/persons/:personId/lineage", element: <LineagePage /> },

      // Routes jeu / existantes
      { path: "e/:eventSlug/deprec-landing", element: <EventLandingPage /> },
      { path: "e/:eventSlug/team/create", element: <CreateOrJoinTeamPage /> },
      { path: "e/:eventSlug/team/resume", element: <ResumeTeamPage /> },
      { path: "e/:eventSlug/team/selfie", element: <TeamSelfiePage /> },
      { path: "e/:eventSlug/team-dashboard", element: <TeamDashboardPage /> },
      { path: "e/:eventSlug/zones", element: <TeamZonesPage /> },
      { path: "e/:eventSlug/z/:zoneId/play", element: <ZonePlayPage /> },

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