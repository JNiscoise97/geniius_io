import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleTestEvents() {
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase
      .from("events")
      .select("id, slug, title, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    setLoading(false);

    if (error) {
      setResult({ ok: false, error: { message: error.message, details: error.details, hint: error.hint } });
      return;
    }
    setResult({ ok: true, data });
  }

  return (
    <div className="screen">
      <h1 className="h1">Bienvenue 👋</h1>
      <p className="muted">Test Supabase: lecture de la table events.</p>

      <div className="stack">
        <button className="btn btn--primary" type="button" onClick={handleTestEvents} disabled={loading}>
          {loading ? "Test en cours..." : "Tester SELECT events"}
        </button>
      </div>

      {result && (
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
