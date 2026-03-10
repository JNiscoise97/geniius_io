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
import { PreEventConfirmationPage } from "../features/public/pages/PreEventConfirmationPage";
import { PUBLIC_EVENT_SLUG } from "../config/publicEvent";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      { index: true, element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}/welcome`} replace /> },

      // Pré-événement
      { path: "e/:eventSlug/welcome", element: <LandingPage /> },
      { path: "e/:eventSlug/welcome/form", element: <PreEventFormPage /> },
      {
        path: "e/:eventSlug/welcome/confirmation",
        element: <PreEventConfirmationPage />,
      },


      // Routes existantes multi-event
      { path: "e/:eventSlug", element: <EventLandingPage /> },
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

  { path: "*", element: <Navigate to={`/e/${PUBLIC_EVENT_SLUG}/welcome`} replace /> }
]);