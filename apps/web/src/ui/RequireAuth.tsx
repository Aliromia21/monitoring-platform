import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const loc = useLocation();

  if (isLoading) return <div className="p-6 text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <>{children}</>;
}
