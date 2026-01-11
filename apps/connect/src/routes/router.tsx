import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { GameStart } from "../pages/Game/GameStart";
import { GameStepZone } from "../pages/Game/GameStepZone";
import { GameEnd } from "../pages/Game/GameEnd";
import { GameAuth } from "../pages/Game/GameAuth";
import { DashboardConfig } from "../pages/Admin/DashboardConfig";
import { SecureAccessConfig } from "../pages/Admin/SecureAccessConfig";
import { Home } from "../pages/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },

      // Game
      { path: "game/start", element: <GameStart /> },
      { path: "game/auth", element: <GameAuth /> },
      { path: "game/zone/:zoneId", element: <GameStepZone /> },
      { path: "game/end", element: <GameEnd /> },

      // Admin/config
      { path: "admin/dashboard-config", element: <DashboardConfig /> },
      { path: "admin/secure-access-config", element: <SecureAccessConfig /> },
    ],
  },
]);
