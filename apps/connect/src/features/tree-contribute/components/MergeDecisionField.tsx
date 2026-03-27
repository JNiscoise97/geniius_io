// components/tree-contribute/MergeDecisionField.tsx

import { CheckCircle2, CircleDashed, PencilLine, Sparkles } from "lucide-react";

export type MergeDecisionValue =
  | ""
  | "confirm_existing"
  | "complete_existing"
  | "correct_existing"
  | "create_person"
  | "skip_for_now";

type MergeDecisionOption = {
  value: Exclude<MergeDecisionValue, "">;
  title: string;
  description: string;
};

type MergeDecisionFieldProps = {
  value: MergeDecisionValue;
  onChange: (value: MergeDecisionValue) => void;
  canConfirmExisting?: boolean;
  canCompleteExisting?: boolean;
  canCorrectExisting?: boolean;
  canCreatePerson?: boolean;
  canSkip?: boolean;
};

export function MergeDecisionField({
  value,
  onChange,
  canConfirmExisting = true,
  canCompleteExisting = true,
  canCorrectExisting = true,
  canCreatePerson = true,
  canSkip = true,
}: MergeDecisionFieldProps) {
  const options: MergeDecisionOption[] = [
    ...(canConfirmExisting
      ? [
          {
            value: "confirm_existing" as const,
            title: "Confirmer la fiche existante",
            description:
              "Les informations présentes dans l’arbre te semblent correctes.",
          },
        ]
      : []),

    ...(canCompleteExisting
      ? [
          {
            value: "complete_existing" as const,
            title: "Compléter la fiche existante",
            description:
              "Tes informations peuvent enrichir une fiche déjà présente dans l’arbre.",
          },
        ]
      : []),

    ...(canCorrectExisting
      ? [
          {
            value: "correct_existing" as const,
            title: "Signaler une différence",
            description:
              "Une ou plusieurs informations dans l’arbre te semblent incorrectes ou à vérifier.",
          },
        ]
      : []),

    ...(canCreatePerson
      ? [
          {
            value: "create_person" as const,
            title: "Créer une nouvelle fiche",
            description:
              "Aucune fiche correspondante n’a été trouvée dans l’arbre pour cette personne.",
          },
        ]
      : []),

    ...(canSkip
      ? [
          {
            value: "skip_for_now" as const,
            title: "Je préfère décider plus tard",
            description:
              "Tu peux laisser cette personne de côté pour le moment et y revenir plus tard.",
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const active = value === option.value;
        const icon = getOptionIcon(option.value);

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "w-full rounded-[22px] border p-4 text-left transition",
              active
                ? "border-indigo-200 bg-indigo-50"
                : "border-slate-200 bg-white",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 rounded-2xl p-3",
                  active
                    ? "bg-white text-indigo-700"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-black text-slate-900">
                  {option.title}
                </div>

                <div className="mt-1 text-sm font-bold leading-6 text-slate-700">
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getOptionIcon(value: Exclude<MergeDecisionValue, "">) {
  switch (value) {
    case "confirm_existing":
      return <CheckCircle2 size={20} />;

    case "complete_existing":
      return <Sparkles size={20} />;

    case "correct_existing":
      return <PencilLine size={20} />;

    case "create_person":
      return <Sparkles size={20} />;

    case "skip_for_now":
    default:
      return <CircleDashed size={20} />;
  }
}