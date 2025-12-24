// apps/web/src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { App } from "@echo/ui";
import { createSupabaseStorage, createMemoryStorage } from "@echo/platform";

import "./index.css";
import "./styles.css";
import Layout from "./components/Layout";
import ContactsPage from "apps/web/src/pages/contacts/ContactsPage";

import { supabase } from "./lib/supabaseClient";
import { signOut } from "./lib/auth";
import AuthGate from "./components/authentication/AuthGate";

// --- Petites pages de démo ---
function HomeRoute() {
  return (
    <div className="grid" style={{ alignContent: "start" }}>
      <div className="card">
        <div className="card-header">Bienvenue sur Echo</div>
        <div className="card-body">
          <p className="small muted">Ceci est la landing page temporaire.</p>
          <button className="btn small" onClick={signOut}>Se déconnecter</button>
        </div>
      </div>
    </div>
  );
}

function NotesRoute() {
  return (
    <div className="grid" style={{ alignContent: "start" }}>
      <div className="card">
        <div className="card-header">Notes</div>
        <div className="card-body">
          <p className="small muted">Éditeur de notes à brancher ici.</p>
        </div>
      </div>
    </div>
  );
}

// --- Root qui choisit le storage en fonction de l’auth ---
function Root() {
  const [ready, setReady] = React.useState(false);
  const [storage, setStorage] = React.useState(() => createMemoryStorage());

  React.useEffect(() => {
    let mounted = true;

    // Init: choisir en fonction de la session courante
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setStorage(user ? createSupabaseStorage(supabase) : createMemoryStorage());
      setReady(true);
    })();

    // Réagir aux changements d’auth (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setStorage(session?.user ? createSupabaseStorage(supabase) : createMemoryStorage());
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid" style={{ placeItems: "center", height: "100dvh" }}>
        <div className="small muted">Initialisation…</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster richColors />
      <Layout>
        <AuthGate>
          <Routes>
            <Route path="/" element={<App storage={storage} />}>
              <Route index element={<HomeRoute />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/:id" element={<ContactsPage />} />
              <Route path="notes" element={<NotesRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGate>
      </Layout>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
