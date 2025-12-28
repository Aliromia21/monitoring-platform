import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { MonitorsPage } from "./pages/MonitorsPage";
import { MonitorDetailsPage } from "./pages/MonitorDetailsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <MonitorsPage /> },
      { path: "monitors/:id", element: <MonitorDetailsPage /> },
      { path: "alerts", element: <AlertsPage /> }
    ]
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> }
]);
