import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase/client";

type LocationState = {
  from?: string;
};

export function AdminLoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e?: React.FormEvent) {
    e?.preventDefault();

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    nav(state?.from || "/admin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Espace admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Connexion</h1>
          <p className="mt-2 text-sm text-slate-300">
            Connecte-toi avec ton compte Supabase pour accéder au tableau de bord.
          </p>
        </div>

        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email</label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-white/20"
              placeholder="ton@email.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Mot de passe
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-white/20"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <strong>Erreur :</strong> {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}