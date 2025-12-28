import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="bg-white shadow-soft rounded-xl p-8 w-full max-w-sm border border-slate-200">
        <h1 className="text-xl font-semibold mb-1">Create account</h1>
        <p className="text-slate-600 mb-6">Start monitoring your services.</p>

        {err && <div className="mb-4 text-sm text-rose-600">{err}</div>}

        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            setBusy(true);
            try {
              await register(name.trim(), email.trim(), password);
              nav("/");
            } catch (e: any) {
              setErr(e?.message ?? "Register failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            disabled={busy}
            className="w-full rounded-lg px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          Have an account? <Link className="text-indigo-600 hover:underline" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
