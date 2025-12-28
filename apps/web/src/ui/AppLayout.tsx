import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Monitoring Platform</div>
          <nav className="flex gap-4 text-sm text-slate-600">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "text-slate-900" : ""
              }
            >
              Monitors
            </NavLink>
            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                isActive ? "text-slate-900" : ""
              }
            >
              Alerts
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
