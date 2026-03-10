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

export const router = createBrowserRouter([
  // PLAYER (mobile)
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      { index: true, element: <Navigate to="/e/demo" replace /> },

      // LOT 1 - pré-événement
      { path: "e/:eventSlug/welcome", element: <LandingPage /> },
      { path: "e/:eventSlug/welcome/form", element: <PreEventFormPage /> },
      {
        path: "e/:eventSlug/welcome/confirmation",
        element: <PreEventConfirmationPage />,
      },
      
      { path: "e/:eventSlug", element: <EventLandingPage /> },
      { path: "e/:eventSlug/team/create", element: <CreateOrJoinTeamPage /> },
      { path: "e/:eventSlug/team/resume", element: <ResumeTeamPage /> },
      { path: "e/:eventSlug/team/selfie", element: <TeamSelfiePage /> },

      { path: "e/:eventSlug/team-dashboard", element: <TeamDashboardPage/> },
      { path: "e/:eventSlug/zones", element: <TeamZonesPage/> },
      { path: "e/:eventSlug/z/:zoneId/play", element: <ZonePlayPage /> },
      { path: "question-mock", element: <QuestionScreenMock /> },
    ],
  },

  // ADMIN (protected)
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: <AdminGuard />,
    children: [
      {
        path: "",
        element: <AdminScaffold />,
        children: [
          // /admin -> home (ou rediriger vers demo)
          { index: true, element: <AdminHomePage /> },

          // dashboard par event
          { path: "events/:eventSlug", element: <AdminEventDashboardPage /> },
        ],
      },
    ],
  },

  // FALLBACK
  { path: "*", element: <Navigate to="/e/demo" replace /> },
]);
