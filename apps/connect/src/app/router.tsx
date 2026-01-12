import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MobileScaffold } from "../ui/layout/MobileScaffold";
import { AdminScaffold } from "../ui/layout/AdminScaffold";

import { EventLandingPage } from "../features/player/pages/EventLandingPage";
import { CreateTeamPage } from "../features/player/pages/CreateTeamPage";
import { StandbyPage } from "../features/player/pages/StandbyPage";
import { AdminHomePage } from "../features/admin/pages/AdminHomePage";
import { ResumeTeamPage } from "../features/player/pages/ResumeTeamPage";
import { TeamSelfiePage } from "../features/player/pages/TeamSelfiePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MobileScaffold />,
    children: [
      { index: true, element: <Navigate to="/e/demo" replace /> },
      { path: "e/:eventSlug", element: <EventLandingPage /> },
      { path: "e/:eventSlug/team/create", element: <CreateTeamPage /> },
      { path: "e/:eventSlug/standby", element: <StandbyPage /> },
      { path: "e/:eventSlug/team/resume", element: <ResumeTeamPage /> },
      { path: "e/:eventSlug/team/selfie", element: <TeamSelfiePage /> },

    ],
  },
  {
    path: "/admin",
    element: <AdminScaffold />,
    children: [{ index: true, element: <AdminHomePage /> }],
  },
  { path: "*", element: <Navigate to="/e/demo" replace /> },
]);
