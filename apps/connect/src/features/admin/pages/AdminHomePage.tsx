import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PUBLIC_EVENT_SLUG } from "../../../config/publicEvent";

type AdminSectionLink = {
  title: string;
  description: string;
  to: string;
};

function EventQuickLinks({ eventSlug }: { eventSlug: string }) {
  const links = useMemo<AdminSectionLink[]>(
  () => [
    {
      title: "Dashboard événement",
      description: "Vue d’ensemble de l’événement.",
      to: `/admin/events/${eventSlug}`,
    },
    {
      title: "Présences (live)",
      description: "Suivi en temps réel via l’app participant.",
      to: `/e/${eventSlug}/admin/attendance`,
    },
    {
      title: "Modération",
      description: "Valider les souvenirs et contenus.",
      to: `/e/${eventSlug}/moderation`,
    },
    {
      title: "Annonces",
      description: "Envoyer un message aux participants.",
      to: `/e/${eventSlug}/announcements/new`,
    },
    {
      title: "Participants",
      description: "Gérer les participants.",
      to: `/admin/events/${eventSlug}/participants`,
    },
    {
      title: "Documents",
      description: "Analytics des archives familiales.",
      to: `/admin/events/${eventSlug}/documents`,
    },
  ],
  [eventSlug]
);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950 group-hover:underline">
                {link.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{link.description}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              {eventSlug}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function AdminHomePage() {
  const navigate = useNavigate();
  const [eventSlugInput, setEventSlugInput] = useState(PUBLIC_EVENT_SLUG);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = eventSlugInput.trim();
    if (!normalized) return;
    navigate(`/admin/events/${normalized}`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Tableau de bord admin
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Depuis cette page, tu peux accéder rapidement aux sections
          d’administration les plus utiles pour la cousinade : suivi des
          participants, présences, témoignages et analytics des documents.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            value={eventSlugInput}
            onChange={(e) => setEventSlugInput(e.target.value)}
            placeholder="event slug"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 sm:max-w-sm"
          />
          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Ouvrir l’événement
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Accès rapide</h2>
          <Link
            to={`/admin/events/${PUBLIC_EVENT_SLUG}`}
            className="text-sm text-slate-600 underline hover:text-slate-950"
          >
            Ouvrir l’événement principal
          </Link>
        </div>

        <EventQuickLinks eventSlug={PUBLIC_EVENT_SLUG} />
      </section>
    </div>
  );
}