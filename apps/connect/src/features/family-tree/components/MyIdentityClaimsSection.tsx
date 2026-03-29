import { ArrowRight, CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { PersonIdentityClaim } from "../api/getMyPersonIdentityClaim";

type Props = {
  claims: PersonIdentityClaim[];
  loading?: boolean;
  error?: string | null;
  onOpenPerson?: (personId: string) => void;
};

function getStatusMeta(status: PersonIdentityClaim["claim_status"]) {
  switch (status) {
    case "approved":
      return {
        label: "Profil confirmé",
        icon: <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />,
        containerClassName: "border-emerald-200 bg-emerald-50",
        titleClassName: "text-emerald-900",
        textClassName: "text-emerald-800",
      };

    case "rejected":
      return {
        label: "Demande non validée",
        icon: <XCircle className="mt-0.5 h-4 w-4 text-rose-700" />,
        containerClassName: "border-rose-200 bg-rose-50",
        titleClassName: "text-rose-900",
        textClassName: "text-rose-800",
      };

    case "pending":
    default:
      return {
        label: "En cours de vérification",
        icon: <Clock3 className="mt-0.5 h-4 w-4 text-amber-700" />,
        containerClassName: "border-amber-200 bg-amber-50",
        titleClassName: "text-amber-900",
        textClassName: "text-amber-800",
      };
  }
}

function getButtonMeta(status: PersonIdentityClaim["claim_status"]) {
  if (status === "approved") {
    return {
      label: "Me voir dans l’arbre",
      className:
        "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]",
    };
  }

  return {
    label: "Voir cette fiche dans l’arbre",
    className:
      "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]",
  };
}

function formatDate(value: string | null) {
  if (!value) return null;

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isVisibleClaim(claim: PersonIdentityClaim): boolean {
  return Boolean(claim.person_id?.trim());
}

export function MyIdentityClaimsSection({
  claims,
  loading = false,
  error = null,
  onOpenPerson,
}: Props) {
  const visibleClaims = claims.filter(isVisibleClaim);

  if (loading) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">
          Mon identification
        </div>
        <div className="mt-0.5 text-xs text-slate-700">
          Chargement de tes informations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
        <div className="text-sm font-semibold text-rose-900">
          Mon identification
        </div>
        <div className="mt-0.5 text-xs text-rose-800">{error}</div>
      </div>
    );
  }

  if (visibleClaims.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {visibleClaims.map((claim) => {
        const personId = claim.person_id.trim();
        const status = getStatusMeta(claim.claim_status);
        const button = getButtonMeta(claim.claim_status);

        return (
          <div
            key={claim.id}
            className={`rounded-[28px] border border-slate-200 p-5 shadow-sm ${status.containerClassName}`}
          >
            <div className="flex items-start gap-3">
              {status.icon}

              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold ${status.titleClassName}`}>
                  {status.label}
                </div>

                {claim.claim_status === "pending" ? (
                  <div className={`mt-1 text-xs ${status.textClassName}`}>
                    Tu as demandé à rattacher cette fiche à ton profil.
                  </div>
                ) : null}

                {claim.claim_status === "rejected" ? (
                  <div className={`mt-1 text-xs ${status.textClassName}`}>
                    Cette fiche n’a pas encore pu être confirmée comme étant la tienne.
                  </div>
                ) : null}

                <div className={`mt-1 text-xs ${status.textClassName}`}>
                  {claim.claim_status === "approved"
                    ? `Vérifié le ${formatDate(claim.moderated_at) ?? "—"}`
                    : `Envoyé le ${formatDate(claim.submitted_at) ?? "—"}${
                        claim.moderated_at
                          ? ` • Vérifié le ${formatDate(claim.moderated_at) ?? "—"}`
                          : ""
                      }`}
                </div>

                {claim.moderator_comment &&
                claim.claim_status !== "approved" ? (
                  <div className={`mt-2 text-xs ${status.textClassName}`}>
                    Message de l’organisateur : {claim.moderator_comment}
                  </div>
                ) : null}

                {onOpenPerson ? (
                  <button
                    type="button"
                    onClick={() => onOpenPerson(personId)}
                    className={`mt-3 group ${button.className}`}
                  >
                    <span>{button.label}</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}