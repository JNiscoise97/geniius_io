import React from "react";
import {
  Rocket,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Mail,
  FileText,
  Star,
  User,
  Clock
} from "lucide-react";

/**
 * TimelineWithIcons — composant React autonome (fichier unique)
 * - Ligne verticale à gauche
 * - Billes (icônes) posées sur la ligne
 * - À droite de chaque bille : un titre coloré + un commentaire en text-sm
 * - À gauche de la bille : date + heure (facultatif)
 * - Espacement vertical homogène entre les blocs
 * - Données hardcodées ci-dessous (max 10)
 *
 * Dépendances visuelles : TailwindCSS (classes utilitaires) + lucide-react (icônes)
 */

export type TimelineItem = {
  id?: string;
  title: string;
  titleColorClass?: string;
  description?: string;
  whenDate?: string;
  whenHour?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const MAX_ITEMS = 10;
const ITEMS: TimelineItem[] = [
  { id: "1", whenDate: "28/08/2025", whenHour: "09:00", icon: CalendarClock, title: "Brief d'ouverture", titleColorClass: "text-sky-600" },
  { id: "2", whenDate: "28/08/2025", whenHour: "10:15", icon: Rocket, title: "Lancement de la version", titleColorClass: "text-emerald-600", description: "Mise en production du lot de fonctionnalités planifié." },
  { id: "3", icon: MapPin, title: "Point site", titleColorClass: "text-indigo-600", description: "Contrôle rapide des monitoring et métriques principales." },
  { id: "4", whenDate: "28/08/2025", icon: MessageSquare, title: "Atelier produit", titleColorClass: "text-fuchsia-600", description: "Atelier de cadrage: parcours utilisateur et bacs d'idées." },
  { id: "5", whenDate: "28/08/2025", whenHour: "14:45", icon: FileText, title: "Revue doc", titleColorClass: "text-amber-600", description: "Nettoyage / structure de la documentation technique." },
  { id: "6", whenDate: "28/08/2025", whenHour: "16:00", icon: Mail, title: "Communication", titleColorClass: "text-rose-600", description: "Annonce aux parties prenantes et note de version." },
  { id: "7", icon: User, title: "Support VIP", titleColorClass: "text-teal-600", description: "Accompagnement dédié pour les comptes sensibles." },
  { id: "8", icon: CheckCircle2, title: "Validation finale", titleColorClass: "text-green-600", description: "Contrôles finaux OK, passage en rythme de croisière." },
  { id: "9", icon: Star, title: "Récap' journée", titleColorClass: "text-purple-600", description: "Points forts, risques ouverts, éléments à reporter." },
  { id: "10", whenDate: "28/08/2025", whenHour: "09:30", icon: Clock, title: "Stand-up J+1", titleColorClass: "text-blue-600", description: "Synchronisation rapide et plan d'action." }
].slice(0, MAX_ITEMS);

const cls = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(" ");

export default function TimelineWithIcons({ steps }: { steps?: TimelineItem[] | null }) {
  const data = steps && steps.length > 0 ? steps : ITEMS;
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Timeline</h2>

      <div className="relative">
        {/* Ligne verticale continue */}
        <div className="absolute left-[8rem] top-0 bottom-0 w-px bg-gray-200" />

        <ul className="space-y-8">
          {data.map((step) => (
            <li key={step.id} className="grid grid-cols-[6rem_2rem_1fr] items-center gap-x-4 relative">
              {/* Date/heure */}
              <div
                className={cls(
                  "text-xs tabular-nums text-gray-500",
                  !step.whenDate && "opacity-0"
                )}
              >
                {step.whenDate || "_"}
                {step.whenHour && <br />}
                {step.whenHour}
              </div>


              {/* Bille */}
              <div className="flex items-center justify-center relative">
                <span className="z-5 inline-grid size-8 place-items-center rounded-full bg-white ring-2 ring-gray-300 shadow-sm">
                  <step.icon className="size-4" aria-hidden />
                </span>
              </div>

              {/* Contenu */}
              <div>
                <div className={cls("font-semibold", step.titleColorClass || "text-gray-900", "text-sm")}>{step.title}</div>
                {step.description && <p className="mt-1 text-xs text-gray-600">{step.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
