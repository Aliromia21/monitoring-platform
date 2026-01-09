import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { getUnreadAlertsCount } from "../api/alerts";

function NavItem(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          "px-2 py-1 rounded-md",
          "hover:text-slate-900 hover:bg-slate-100",
          isActive ? "text-slate-900 bg-slate-100" : "text-slate-600"
        ].join(" ")
      }
    >
      {props.label}
    </NavLink>
  );
}

function AlertsNavItem(props: { to: string; label: string; unread?: number }) {
  const unread = props.unread ?? 0;

  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          "px-2 py-1 rounded-md",
          "hover:text-slate-900 hover:bg-slate-100",
          "flex items-center gap-2",
          isActive ? "text-slate-900 bg-slate-100" : "text-slate-600"
        ].join(" ")
      }
    >
      <span>{props.label}</span>

      {unread > 0 ? (
        <span
          className={[
            "min-w-[20px] h-5 px-1.5",
            "inline-flex items-center justify-center",
            "text-[11px] font-semibold",
            "rounded-full",
            "bg-rose-600 text-white"
          ].join(" ")}
          aria-label={`${unread} unread alerts`}
          title={`${unread} unread alerts`}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Unread alerts count (polling)
  const unreadQ = useQuery({
    queryKey: ["alerts-unread-count"],
    queryFn: () => getUnreadAlertsCount(),
    enabled: !!user, // only when logged in
    refetchInterval: 15000,
    refetchIntervalInBackground: true
  });

  const unread = unreadQ.data?.unread ?? 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-semibold">
              M
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Monitoring Platform</div>
              <div className="text-xs text-slate-500 hidden sm:block">
                {user?.email ?? ""}
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 text-sm">
            <NavItem to="/" label="Monitors" />
            <AlertsNavItem to="/alerts" label="Alerts" unread={unread} />
          </nav>

          <div className="flex items-center gap-3">
            {user?.name ? (
              <span className="hidden md:inline text-sm text-slate-600">
                {user.name}
              </span>
            ) : null}

            <button
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
