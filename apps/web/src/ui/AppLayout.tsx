import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

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

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            <NavItem to="/alerts" label="Alerts" />
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
