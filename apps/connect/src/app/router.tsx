import { createBrowserRouter, Navigate } from "react-router-dom";
import { MobileScaffold } from "../ui/layout/MobileScaffold";
import { AdminScaffold } from "../ui/layout/AdminScaffold";

import { EventLandingPage } from "../features/player/pages/EventLandingPage";
import { CreateTeamPage } from "../features/player/pages/CreateTeamPage";
import { StandbyPage } from "../features/player/pages/StandbyPage";
import { ResumeTeamPage } from "../features/player/pages/ResumeTeamPage";
import { TeamSelfiePage } from "../features/player/pages/TeamSelfiePage";
import { ZonePlayPage } from "../features/player/game/pages/ZonePlayPage";

import { AdminHomePage } from "../features/admin/pages/AdminHomePage";
import { AdminLoginPage } from "../features/admin/pages/AdminLoginPage";
import { AdminGuard } from "../features/admin/AdminGuard";
import { AdminEventDashboardPage } from "../features/admin/pages/AdminEventDashboardPage";
import { QuestionScreenMock } from "../features/player/game/QuestionScreenMock";

export const router = createBrowserRouter([
  // PLAYER (mobile)
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      { index: true, element: <Navigate to="/e/demo" replace /> },

      { path: "e/:eventSlug", element: <EventLandingPage /> },
      { path: "e/:eventSlug/team/create", element: <CreateTeamPage /> },
      { path: "e/:eventSlug/team/resume", element: <ResumeTeamPage /> },
      { path: "e/:eventSlug/team/selfie", element: <TeamSelfiePage /> },

      { path: "e/:eventSlug/standby", element: <StandbyPage /> },
      { path: "e/:eventSlug/z/:zoneId/play", element: <ZonePlayPage /> },
      { path: "mock", element: <QuestionScreenMock /> },
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
