import { useState } from "react";
import { signInWithEmail, signInWithMagicLink } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "password") await signInWithEmail(email, pwd);
      else await signInWithMagicLink(email);
      // AuthGate s’occupera de re-render quand la session change
    } catch (e: any) {
      setErr(e.message ?? "Échec de connexion");
    }
  }

  return (
    <div className="grid" style={{ placeItems: "center", minHeight: "100vh" }}>
      <form className="card" style={{ width: 380 }} onSubmit={handleSubmit}>
        <div className="card-header">Connexion</div>
        <div className="card-body vstack" style={{ gap: 10 }}>
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {mode === "password" && (
            <input
              className="input"
              type="password"
              placeholder="Mot de passe"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
            />
          )}
          {err && <div className="small" style={{ color: "var(--danger)" }}>{err}</div>}
          <button className="btn btn-primary" type="submit">
            {mode === "password" ? "Se connecter" : "Recevoir un lien magique"}
          </button>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setMode(m => (m === "password" ? "magic" : "password"))}
          >
            {mode === "password" ? "Utiliser un magic link" : "Utiliser mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}
