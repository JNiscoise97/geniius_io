import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ContactOrganizerForm,
  type ContactOrganizerFormValues,
} from "../components/ContactOrganizerForm";
import { contactOrganizerFormConfig } from "../config/contactOrganizerFormConfig";
import { saveOrganizerMessage } from "../api/saveOrganizerMessage";
import { getParticipantSession } from "../../../lib/participant-session/getActiveParticipant";
import { getParticipantContactProfile } from "../api/getParticipantContactProfile";
import { createPageTimeTracker } from "../../../lib/analytics/pageTimeTracker";
import { getContactOrganizerPreset } from "../config/contactOrganizerPresets";
import {
  buildFindMeContactContext,
  buildFindMeIdentificationMessage,
} from "../lib/buildFindMeIdentificationMessage";
import type { FindMeAnswers } from "../../family-tree/lib/findMeMatching";
import { getFamilyKnowledgeCloseFamily } from "../../family-knowledge/api/getFamilyKnowledgeCloseFamily";
import { getFamilyKnowledgeGrandparents } from "../../family-knowledge/api/getFamilyKnowledgeGrandparents";

const INITIAL_VALUES: ContactOrganizerFormValues = {
  topic: "",
  message: "",
  wantsReply: false,
  phone: "",
  email: "",
  hasWhatsapp: false,
  messenger: "",
  preferredContactChannels: [],
};

type ContactOrganizerLocationState = {
  findMeDraft?: FindMeAnswers;
};

function hasAtLeastOneRequiredContact(
  values: ContactOrganizerFormValues,
): boolean {
  return Boolean(values.phone.trim() || values.email.trim());
}

function buildPersonIssueMessage(params: {
  personId: string;
  personLabel?: string | null;
}): string {
  const personLine = params.personLabel
    ? `${params.personLabel} (ID ${params.personId})`
    : `ID ${params.personId}`;

  return [
    `Bonjour,`,
    ``,
    `Je souhaite signaler une erreur, une incohérence, un doute ou une information à vérifier concernant la personne suivante : ${personLine}.`,
    ``,
    `Voici ce qui me semble incorrect, incomplet ou incertain :`,
    `- `,
    ``,
    `Proposition de correction ou précision éventuelle :`,
    `- `,
    ``,
    `Source, contexte ou explication complémentaire :`,
    `- `,
  ].join("\n");
}

export function ParticipantContactOrganizerPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { eventSlug } = useParams();
  const [searchParams] = useSearchParams();
  const slug = eventSlug ?? "demo";

  const preset = useMemo(() => {
    return getContactOrganizerPreset(searchParams.get("preset"));
  }, [searchParams]);

  const reportPersonId = searchParams.get("personId");
  const reportPersonFirstName = searchParams.get("personFirstName");
  const reportPersonLastName = searchParams.get("personLastName");

  const reportPersonLabel = [reportPersonFirstName, reportPersonLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const locationState =
    (location.state as ContactOrganizerLocationState | null) ?? null;

  const [values, setValues] = useState<ContactOrganizerFormValues>(() => {
  const initialMessage =
    preset?.key === "report-person-issue" && reportPersonId
      ? buildPersonIssueMessage({
          personId: reportPersonId,
          personLabel: reportPersonLabel || null,
        })
      : (preset?.messageTemplate ?? "");

  return {
    ...INITIAL_VALUES,
    topic: preset?.forcedTopic ?? "",
    message: initialMessage,
  };
});

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageAutofilled, setMessageAutofilled] = useState(false);

  const participantSession = getParticipantSession(slug);
  const participantId = participantSession?.participantId ?? null;

  useEffect(() => {
    if (!participantId) return;

    const tracker = createPageTimeTracker({
      participantId,
      eventSlug: slug,
      pageKey: `/e/${slug}/contact`,
    });

    tracker.start();

    return () => {
      void tracker.stop();
    };
  }, [participantId, slug]);

  useEffect(() => {
  setValues((prev) => {
    const presetMessage =
      preset?.key === "report-person-issue" && reportPersonId
        ? buildPersonIssueMessage({
            personId: reportPersonId,
            personLabel: reportPersonLabel || null,
          })
        : (preset?.messageTemplate ?? prev.message);

    return {
      ...prev,
      topic: preset?.forcedTopic ?? prev.topic,
      message:
        prev.message.trim().length > 0
          ? prev.message
          : presetMessage,
    };
  });
}, [preset, reportPersonId, reportPersonLabel]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!participantSession?.participantId) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profile = await getParticipantContactProfile(
          participantSession.participantId,
        );

        if (!mounted || !profile) return;

        const wantsReply = Boolean(
          profile.phone ||
          profile.email ||
          profile.messenger ||
          profile.preferredContactChannels.length > 0,
        );

        setValues((prev) => ({
          ...prev,
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          hasWhatsapp: profile.hasWhatsapp,
          messenger: profile.messenger ?? "",
          preferredContactChannels: profile.preferredContactChannels,
          wantsReply,
        }));
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Impossible de charger tes coordonnées.");
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [participantSession?.participantId]);

  useEffect(() => {
    let mounted = true;

    async function loadFindMeMessage() {
      if (!participantSession?.participantId) {
        return;
      }

      if (preset?.key !== "find-me-identification") {
        return;
      }

      if (messageAutofilled) {
        return;
      }

      try {
        const [closeFamily, grandparents] = await Promise.all([
          getFamilyKnowledgeCloseFamily({
            participantId: participantSession.participantId,
          }),
          getFamilyKnowledgeGrandparents({
            participantId: participantSession.participantId,
          }),
        ]);

        if (!mounted) return;

        const context = buildFindMeContactContext({
          participantFirstName: participantSession.firstName ?? undefined,
          participantLastName: participantSession.lastName ?? undefined,
          closeFamily,
          grandparents,
          answers: locationState?.findMeDraft ?? null,
        });

        setValues((prev) => ({
          ...prev,
          topic: preset.forcedTopic,
          message:
            prev.message.trim().length > 0 &&
            prev.message !== preset.messageTemplate
              ? prev.message
              : buildFindMeIdentificationMessage(context),
        }));

        setMessageAutofilled(true);
      } catch (e: any) {
        if (!mounted) return;
        setError(
          (prev) => prev ?? e?.message ?? "Impossible de préparer le message.",
        );
      }
    }

    void loadFindMeMessage();

    return () => {
      mounted = false;
    };
  }, [
    participantSession?.participantId,
    participantSession?.firstName,
    participantSession?.lastName,
    preset,
    locationState,
    messageAutofilled,
  ]);

  function validate(): string | null {
    if (!values.topic) {
      return "Merci de choisir le sujet de ton message.";
    }

    if (preset?.forcedTopic && values.topic !== preset.forcedTopic) {
      return "Le sujet de ce message est imposé par le parcours.";
    }

    if (!values.message.trim()) {
      return "Merci d’écrire ton message.";
    }

    if (values.message.trim().length < 5) {
      return "Ton message semble un peu trop court.";
    }

    if (values.wantsReply) {
      if (!hasAtLeastOneRequiredContact(values)) {
        return "Merci d’indiquer au moins un contact : téléphone ou email.";
      }

      if (values.preferredContactChannels.length === 0) {
        return "Choisis au moins un moyen de contact à privilégier.";
      }

      if (
        values.preferredContactChannels.includes("sms") &&
        !values.phone.trim()
      ) {
        return "Un numéro de téléphone est nécessaire pour le SMS.";
      }

      if (
        values.preferredContactChannels.includes("whatsapp") &&
        (!values.phone.trim() || !values.hasWhatsapp)
      ) {
        return "Pour WhatsApp, indique un téléphone et active l’option correspondante.";
      }

      if (
        values.preferredContactChannels.includes("email") &&
        !values.email.trim()
      ) {
        return "Une adresse email est nécessaire pour l’envoi par email.";
      }

      if (
        values.preferredContactChannels.includes("messenger") &&
        !values.messenger.trim()
      ) {
        return "Un identifiant Messenger est nécessaire pour ce canal.";
      }

      if (values.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email.trim())) {
          return "Merci de renseigner une adresse email valide.";
        }
      }
    }

    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      await saveOrganizerMessage({
        eventSlug: slug,
        participantId: participantSession?.participantId ?? null,
        senderFirstName: participantSession?.firstName ?? null,
        senderLastName: participantSession?.lastName ?? null,
        values,
      });

      nav(`/e/${slug}/welcome/confirmation?step=organizer-message`, {
        replace: true,
      });
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  const resolvedTitle = preset?.title ?? contactOrganizerFormConfig.title;
  const resolvedSubtitle =
    preset?.subtitle ?? contactOrganizerFormConfig.subtitle;
  const resolvedIntroText =
    preset?.introText ?? contactOrganizerFormConfig.introText;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pt-4 pb-28">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold text-indigo-700">
              <Mail size={14} />
              Message organisateur
            </div>

            <button
              type="button"
              onClick={() => nav(`/e/${slug}/home`)}
              className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Retour
              </span>
            </button>
          </div>

          <h1 className="mt-4 text-[28px] leading-[1.05] font-black tracking-tight text-slate-900">
            {resolvedTitle}
          </h1>

          <p className="mt-2 text-sm font-bold text-slate-700">
            {resolvedSubtitle}
          </p>

          <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
            {resolvedIntroText}
          </p>
        </section>

        {error ? (
          <div className="mt-4 rounded-[24px] border border-[rgba(220,38,38,0.22)] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 text-[color:var(--bad)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <div className="font-black text-slate-900">Oups</div>
                <div className="text-sm font-bold text-slate-700">{error}</div>
              </div>
            </div>
          </div>
        ) : null}

        <ContactOrganizerForm
          config={contactOrganizerFormConfig}
          value={values}
          loading={loading || loadingProfile}
          error={error}
          lockTopic={preset?.lockTopic === true}
          onChange={(patch) =>
            setValues((prev) => ({
              ...prev,
              ...patch,
              topic: preset?.forcedTopic ?? patch.topic ?? prev.topic,
            }))
          }
          onSubmit={onSubmit}
        />
      </main>
    </div>
  );
}
