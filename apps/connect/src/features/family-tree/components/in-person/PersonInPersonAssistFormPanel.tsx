import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Mail,
  Save,
  TriangleAlert,
  Users,
} from "lucide-react";

export type PersonInPersonAssistValues = {
  declaredPresent: boolean;
  attended2023: boolean | null;
  attended2024: boolean | null;

  testimonyInterest:
    | ""
    | "very_willing"
    | "willing"
    | "maybe"
    | "reluctant"
    | "no";

  testimonyTopics: string;

  allowNameInFamilyTree: boolean | null;
  allowPhotoInFamilyTree: boolean | null;
  allowInfoInFamilyTree: boolean | null;

  email: string;
  birthYear: string;
  targetIsMinor: boolean;
  consentCollectedFrom: string;
  notes: string;
};

type Props = {
  personDisplayName: string;
  participantExists: boolean;
  values: PersonInPersonAssistValues;
  isSubmitting: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
  onBack: () => void;
  onChange: (next: PersonInPersonAssistValues) => void;
  onSubmit: () => void;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidBirthYear(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const year = Number.parseInt(trimmed, 10);
  return Number.isInteger(year) && year >= 1800 && year <= 2100;
}

export function PersonInPersonAssistFormPanel({
  personDisplayName,
  participantExists,
  values,
  isSubmitting,
  successMessage,
  errorMessage,
  onBack,
  onChange,
  onSubmit,
}: Props) {
  const normalizedEmail = normalizeEmail(values.email);

  const requiresEmailForInvitation = !participantExists;
  const hasEmailWhenNeeded =
    !requiresEmailForInvitation || Boolean(normalizedEmail);
  const birthYearIsValid = isValidBirthYear(values.birthYear);

  const canSubmit = !isSubmitting && hasEmailWhenNeeded && birthYearIsValid;

  const submitLabel = isSubmitting
    ? "Enregistrement..."
    : !participantExists && normalizedEmail
      ? "Enregistrer et envoyer l’invitation"
      : "Enregistrer les informations";

  return (
    <div className="min-h-full">
      <section className="space-y-4 pb-44">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </div>

        {successMessage ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <div className="text-sm font-black text-emerald-900">
                {successMessage}
              </div>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
              <div className="text-sm font-black text-rose-900">
                {errorMessage}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <Users size={16} />
            <div className="text-sm font-black">
              Je suis en face de {personDisplayName}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={values.declaredPresent}
                onChange={(e) =>
                  onChange({
                    ...values,
                    declaredPresent: e.target.checked,
                  })
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="text-sm font-semibold text-slate-900">
                Cette personne participe à l'édition 2026
              </div>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  A participé en 2023
                </div>
                <select
                  value={
                    values.attended2023 === null
                      ? ""
                      : values.attended2023
                        ? "yes"
                        : "no"
                  }
                  onChange={(e) =>
                    onChange({
                      ...values,
                      attended2023:
                        e.target.value === ""
                          ? null
                          : e.target.value === "yes",
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </label>

              <label className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  A participé en 2024
                </div>
                <select
                  value={
                    values.attended2024 === null
                      ? ""
                      : values.attended2024
                        ? "yes"
                        : "no"
                  }
                  onChange={(e) =>
                    onChange({
                      ...values,
                      attended2024:
                        e.target.value === ""
                          ? null
                          : e.target.value === "yes",
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </label>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">
                Témoignage
              </div>

              <div className="mt-2 text-xs font-bold leading-5 text-slate-600">
                À quel point cette personne serait-elle d’accord pour partager son histoire ou ses souvenirs familiaux ?
              </div>

              <div className="mt-3 grid gap-2">
                {[
                  {
                    value: "very_willing",
                    label: "Très partante",
                    help: "Souhaite clairement témoigner.",
                  },
                  {
                    value: "willing",
                    label: "Plutôt partante",
                    help: "Ouverte à l’idée si on la recontacte.",
                  },
                  {
                    value: "maybe",
                    label: "À voir",
                    help: "Pas fermée, mais sans engagement clair.",
                  },
                  {
                    value: "reluctant",
                    label: "Plutôt réticente",
                    help: "Peu à l’aise ou peu motivée.",
                  },
                  {
                    value: "no",
                    label: "Ne souhaite pas témoigner",
                    help: "Refus clair.",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={[
                      "flex items-start gap-3 rounded-2xl border p-3 transition",
                      values.testimonyInterest === option.value
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="testimonyInterest"
                      checked={values.testimonyInterest === option.value}
                      onChange={() =>
                        onChange({
                          ...values,
                          testimonyInterest: option.value as PersonInPersonAssistValues["testimonyInterest"],
                        })
                      }
                      className="mt-1 h-4 w-4 border-slate-300 text-indigo-600"
                    />

                    <div className="min-w-0">
                      <div className="text-sm font-black text-slate-900">
                        {option.label}
                      </div>
                      <div className="mt-1 text-xs font-bold leading-5 text-slate-600">
                        {option.help}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <label className="mt-4 block">
                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Thématiques qu’elle aimerait aborder
                </div>
                <textarea
                  value={values.testimonyTopics}
                  onChange={(e) =>
                    onChange({
                      ...values,
                      testimonyTopics: e.target.value,
                    })
                  }
                  placeholder="Ex. enfance, parents, vie lontan, engagement, travail, religion, photos de famille..."
                  className="mt-2 block min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
                />
              </label>
            </div>

            <div className="relative rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">
                Consentements arbre
              </div>

              <div className="mt-3 grid gap-3">
                {[
                  {
                    key: "allowNameInFamilyTree",
                    label: "Afficher son nom",
                  },
                  {
                    key: "allowPhotoInFamilyTree",
                    label: "Afficher sa photo",
                  },
                  {
                    key: "allowInfoInFamilyTree",
                    label: "Afficher ses informations",
                  },
                ].map((field) => {
                  const key = field.key as
                    | "allowNameInFamilyTree"
                    | "allowPhotoInFamilyTree"
                    | "allowInfoInFamilyTree";

                  const current = values[key];

                  return (
                    <label
                      key={field.key}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="text-sm font-black text-slate-900">
                        {field.label}
                      </div>

                      <select
                        value={current === null ? "" : current ? "yes" : "no"}
                        onChange={(e) =>
                          onChange({
                            ...values,
                            [key]:
                              e.target.value === ""
                                ? null
                                : e.target.value === "yes",
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900"
                      >
                        <option value="">Non renseigné</option>
                        <option value="yes">Oui</option>
                        <option value="no">Non</option>
                      </select>
                    </label>
                  );
                })}
              </div>
            </div>

            {!participantExists ? (
              <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-950">
                  <Mail size={16} />
                  <div className="text-sm font-black">
                    Cette personne n’a pas encore d’accès participant
                  </div>
                </div>

                <div className="mt-2 text-xs font-bold leading-5 text-amber-900">
                  Renseigne son adresse mail pour permettre la création du
                  participant et l’envoi de l’invitation.
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label>
                    <div className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                      Adresse mail
                    </div>
                    <input
                      value={values.email}
                      onChange={(e) =>
                        onChange({ ...values, email: e.target.value })
                      }
                      placeholder="exemple@email.com"
                      className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                    />
                    {!normalizedEmail ? (
                      <div className="mt-2 text-xs font-bold text-amber-900">
                        L’adresse mail est nécessaire pour envoyer l’invitation.
                      </div>
                    ) : null}
                  </label>

                  <label>
                    <div className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                      Année de naissance
                    </div>
                    <input
                      value={values.birthYear}
                      onChange={(e) =>
                        onChange({ ...values, birthYear: e.target.value })
                      }
                      placeholder="Ex. 1988"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                    />
                    {!birthYearIsValid ? (
                      <div className="mt-2 text-xs font-bold text-rose-700">
                        Saisis une année valide entre 1800 et 2100.
                      </div>
                    ) : null}
                  </label>
                </div>
              </div>
            ) : null}

            <div className="relative rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">
                Informations complémentaires
              </div>
              <textarea
                value={values.notes}
                onChange={(e) =>
                  onChange({ ...values, notes: e.target.value })
                }
                className="mt-2 block min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900"
              />
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-600">
              <div className="inline-flex items-center gap-2">
                <Camera size={14} />
                La photo pourra être ajoutée depuis la fiche après validation du
                formulaire.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white via-white/95 to-white/0 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div className="c-container">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--blue)] font-black text-white transition disabled:opacity-60"
            >
              <Save size={18} />
              {submitLabel}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}