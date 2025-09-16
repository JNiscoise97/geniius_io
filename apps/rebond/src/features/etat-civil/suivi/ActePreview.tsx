// ActeLayout.tsx
import {
  ArrowLeft,
  CalendarDays,
  Landmark,
  Pen,
  ScrollText,
  Users,
  HelpCircle,
  BookOpen,
  Navigation,
  Unlink,
  House,
  CalendarFold,
  Flag,
  Pencil,
  Settings,
  Check,
  History,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HorizontalTimeline } from '@/components/shared/HorizontalTimeline';
import { displayNom } from '@/lib/nom';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import { parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/shared/StatusPill';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';
import { useEtatCivilStore } from '@/store/etatcivil';
import { getRegistreLabel } from './BureauRegistres';
import { ActeCoherence } from '../ActeCoherence-complet';
import { getIconForStatut } from '@/features/actes/transcription/constants/statutConfig';
import { ActeursAccordion } from '@/features/notaires/ActeursAccordion';
import AuditHistoryTab from '@/components/shared/AuditHistoryTab';
import { buildTranscriptionNarrative } from '@/lib/enrichirTranscription';
import TimelineWithIcons, { type TimelineItem } from '@/components/actes/TimelineWithIcons';
import { formatDateToNumericFrench } from '@/utils/date';

const tabs = [
  { label: 'Résumé', icon: ScrollText },
  { label: 'Acteurs', icon: Users },
  { label: 'Chronologie', icon: CalendarDays },
  { label: 'Transcription', icon: Pen },
  { label: 'Mentions marginales', icon: HelpCircle },
  { label: 'Navigation par rebond', icon: Navigation },
  { label: 'Notes', icon: BookOpen },
  { label: 'Historique de modifications', icon: History },
];

export default function ActeLayout() {
  const { acteId } = useParams();
  const [activeSection, setActiveSection] = useState(tabs[0].label);
  const { acte, entites, fetchActeDetail } = useEtatCivilActesStore();
  const [registre, setRegistre] = useState<EtatCivilRegistre | null>(null);
  const [bureau, setBureau] = useState<EtatCivilBureau | null>(null);
  const fetchRegistre = useEtatCivilStore((s) => s.fetchRegistre);
  const fetchBureau = useEtatCivilStore((s) => s.fetchBureau);
  const [isLoading, setIsLoading] = useState(false);

  const bureauId = acte?.bureau_id;
  const registreId = acte?.registre_id;

  useEffect(() => {
    if (!acteId) return;

    useEtatCivilActesStore.setState({ acte: null, entites: [] });

    (async () => {
      setIsLoading(true);
      try {
        await fetchActeDetail(acteId);
        const updatedActe = useEtatCivilActesStore.getState().acte;

        if (!updatedActe?.registre_id || !updatedActe?.bureau_id) return;

        const [reg, bur] = await Promise.all([
          fetchRegistre(updatedActe.registre_id),
          fetchBureau(updatedActe.bureau_id),
        ]);

        setRegistre(reg ?? null);
        setBureau(bur ?? null);
      } catch (err) {
        console.error('Erreur dans le chargement complet de l’acte', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [acteId]);

  const enfant = entites.find((e) => e.role === 'enfant');
  const sujet = entites.find((e) => e.role === 'sujet');
  const defunt = entites.find((e) => e.role === 'défunt');
  const acteDate = acte?.date ? parseISO(acte.date) : null;

  const acteTypeEstNaissance = acte?.type_acte === 'naissance';
  const acteTypeEstMariage = acte?.type_acte === 'mariage';

  let titleColorClass = "text-gray-800";
  
  let stepsTmp: any[] = [];
  let steps: TimelineItem[] = [];

  if (acteTypeEstNaissance) {
    steps = [];
    stepsTmp = [];
    if (enfant?.naissance_date) {
      steps.push({
        icon: Flag,
        title: 'Naissance',
        titleColorClass: titleColorClass,
        whenDate: formatDateToNumericFrench(enfant?.naissance_date),
        whenHour: enfant?.naissance_heure,
        description: 'Où a eu lieu exactement la naissance? '+enfant?.naissance_lieu_commune,
      });

      stepsTmp.push({
        icon: Flag,
        title: 'Naissance',
        date: enfant?.naissance_date,
        color: 'text-indigo-600',
        description: enfant?.naissance_lieu_commune,
      });
    }
    if (acteDate) {
      steps.push({
        icon: Landmark,
        title: "Inscription à l'état-civil",
        titleColorClass: titleColorClass,
        whenDate: formatDateToNumericFrench(acte?.date),
        whenHour: acte?.heure,
        description: 'quel bureau? qui était présent?'
      });

      stepsTmp.push({
        icon: Landmark,
        title: "Inscription à l'état-civil",
        date: acteDate,
        color: 'text-indigo-600',
      });
    }
  } else if (acte?.type_acte === 'décès') {
    steps = [];
    stepsTmp = [];
    if (defunt?.deces_date) {

      steps.push({
        icon: CalendarFold,
        title: 'Décès',
        titleColorClass: titleColorClass,
        whenDate: formatDateToNumericFrench(defunt?.deces_date),
        whenHour: defunt?.deces_heure,
        description: 'Où a eu lieu exactement le décès? '+defunt?.deces_lieu_commune,
      });


      stepsTmp.push({
        icon: CalendarFold,
        title: 'Décès',
        date: defunt?.deces_date,
        color: 'text-indigo-600',
        description: defunt?.deces_lieu_commune,
      });
    }
    if (acteDate) {
      steps.push({
        icon: Landmark,
        title: "Inscription à l'état-civil",
        titleColorClass: titleColorClass,
        whenDate: formatDateToNumericFrench(acte?.date),
        whenHour: acte?.heure,
        description: 'quel bureau? qui était présent?'
      });
      
      stepsTmp.push({
        icon: Landmark,
        title: "Déclaration à l'état-civil",
        date: acteDate,
        color: 'text-indigo-600',
      });
    }
  } else if (acte?.type_acte === 'mariage' && acteDate) {
    let iconMariage = acte?.comparution_mairie ? Landmark : House;
    steps = [
      {
        icon: iconMariage,
        title: 'Mariage',
        titleColorClass: titleColorClass,
        whenDate: formatDateToNumericFrench(acte?.date),
        whenHour: acte?.heure,
        description: (!acte?.comparution_mairie ? (acte?.comparution_observations ?? '') : 'quel bureau?')+'qui était présent?',
      },
    ];
    
    stepsTmp = [
      {
        icon: iconMariage,
        title: 'Mariage',
        date: acteDate,
        color: 'text-indigo-600',
        description: !acte?.comparution_mairie ? acte?.comparution_observations : '',
      },
    ];
  } else if (acte?.type_acte === 'reconnaissance' && acteDate) {
    steps = [{ icon: Landmark, title: 'Reconnaissance', titleColorClass: titleColorClass, whenDate: formatDateToNumericFrench(acte?.date), whenHour: acte?.heure, description: 'quel bureau? qui était présent?' }];
    stepsTmp = [{ icon: Landmark, title: 'Reconnaissance', date: acteDate, color: 'text-indigo-600' }];
  } else if (acte?.type_acte === 'affranchissement' && acteDate) {
    const arreteDate = extractArreteDateFromNote(sujet?.note || '');
    steps = [
      {
        icon: Unlink,
        title: "Arrêté d'affranchissement du Gouverneur",
        whenDate: formatDateToNumericFrench(arreteDate?.toISOString().substring(0, 10)?? ''),
        titleColorClass: titleColorClass,
      },
      {
        icon: Landmark,
        title: "Inscription à l'état-civil",
        whenDate: formatDateToNumericFrench(acte?.date),
        whenHour: acte?.heure,
        titleColorClass: titleColorClass,
        description: 'quel bureau? qui était présent?'
      },
    ];
    
    stepsTmp = [
      {
        icon: Unlink,
        title: "Arrêté d'affranchissement du Gouverneur",
        date: arreteDate,
        color: 'text-indigo-600',
      },
      {
        icon: Landmark,
        title: "Inscription à l'état-civil",
        date: acteDate,
        color: 'text-indigo-600',
      },
    ];
  }
  if (isLoading || !acte || acte.id !== acteId) {
    return (
      <div className='flex flex-col'>
        <p className='text-muted-foreground'>Chargement de l’acte...</p>
      </div>
    );
  }

  console.log('entites', entites);
  
  return (
    <div className='flex flex-col'>
      <div className='sticky top-0 z-10 bg-white'>
        <div className='flex items-center justify-between px-6 py-3 border-b'>
          <div className='flex items-center gap-3'>
            <Link to={`/ec-registre/${bureauId}/${registreId}`}>
              <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer' />
            </Link>
            {getIconForStatut(acte.statut)}
            <div>
              <h1 className='text-base font-semibold text-gray-800'>
                {acte.label.charAt(0).toUpperCase() + acte.label.slice(1)}
              </h1>
              <div className='text-xs flex items-center space-x-2'>
                {registre && (
                  <>
                    <span className='text-gray-800'>
                      {getRegistreLabel(registre.type_acte, registre.statut_juridique)}
                    </span>
                    <span className='text-gray-500'>{registre.annee}</span>
                    <span className='text-gray-500'>acte n°{acte.numero_acte}</span>
                    {bureau && (
                      <span className='text-gray-500'>
                        enregistré à la {bureau.nom} ({bureau.departement})
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Link to={`/ec-acte/edit/${acte.id}`}>
              <Button
                variant='ghost'
                className='flex items-center gap-2 text-sm text-gray-600 hover:text-black'
              >
                <Pencil className='w-4 h-4' />
                Modifier
              </Button>
            </Link>
            <div className='flex items-center gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button>
                    <StatusPill statut={acte?.statut || 'à transcrire'} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side='right'>
                  <DropdownMenuItem
                    onClick={async () => {
                      const now = new Date().toISOString();
                      await supabase
                        .from('etat_civil_actes')
                        .update({ statut: 'transcrit', updated_at: now })
                        .eq('id', acte?.id);

                      toast.success('Acte marqué comme transcrit');
                      if (acte) {
                        await fetchActeDetail(acte?.id);
                      }
                    }}
                    className='text-blue-800'
                  >
                    <Check className='w-4 h-4 mr-2' />
                    Marquer comme transcrit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Settings className='w-5 h-5 text-gray-700 cursor-pointer' />
          </div>
        </div>

        <div className='flex items-center gap-8 px-6 text-sm border-b overflow-x-auto bg-white'>
          {tabs.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActiveSection(label)}
              className={`py-3 -mb-px border-b-2 flex items-center gap-2 transition-all ${activeSection === label
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
                }`}
            >
              <Icon className='w-4 h-4' />
              {label}
              {label === 'Acteurs' && entites && (
                <span className='inline-flex items-center justify-center px-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
                  {entites.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <section className='p-6 prose prose-sm max-w-none'>
        {acte && acte?.statut != 'transcrit' && <ActeCoherence acteId={acte.id} />}
        {activeSection === 'Résumé' && (
          <>
            <h2 className='text-lg font-semibold mb-4'>Transcription (générée)</h2>

            {/* Bloc transcription + timeline côte à côte */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* 2/3 : transcription */}
              <div className="col-span-2">
                <h2 className="text-lg font-semibold mb-4">Transcription (générée)</h2>
                <article className="whitespace-pre-wrap leading-relaxed text-[15px] text-gray-800">
                  {buildTranscriptionNarrative({
                    acte,
                    entites,
                    registre,
                    bureau,
                  })}
                </article>
              </div>

              {/* 1/3 : timeline */}
              <div className="col-span-1">
                <TimelineWithIcons steps={steps} />
              </div>
            </div>


            <h2 className='text-lg font-semibold mb-4'>Résumé structuré de l’acte</h2>

            {/* Bloc 1 : Métadonnées de l’acte */}
            <div className='mb-6'>
              <h3 className='font-semibold text-gray-700'>📄 Informations générales</h3>
              <ul className='text-sm text-gray-800 list-disc list-inside mt-2'>
                <li>
                  Type : <strong>{acte.type_acte}</strong>
                </li>
                <li>
                  Date de l’acte : <strong>{acte.date}</strong>
                </li>
                <li>
                  Heure de l’acte : <strong>{acte.heure}</strong>
                </li>
                {acte.numero_acte && (
                  <li>
                    Numéro : <strong>{acte.numero_acte}</strong>
                  </li>
                )}
                {registre && (
                  <li>
                    Registre : {getRegistreLabel(registre.type_acte, registre.statut_juridique)},{' '}
                    {registre.annee}
                  </li>
                )}
                {bureau && (
                  <li>
                    Bureau : {bureau.nom} ({bureau.departement})
                  </li>
                )}
                {entites
                  .filter((e) => e.role === 'officier')
                  .map((e) => (
                    <li key={e.id}>Officier de l’état civil : {displayNom(e.prenom, e.nom)}</li>
                  ))}
                <li>
                  Statut : <strong>{acte.statut}</strong>
                </li>
                {acte.comparution_observations && (
                  <li>Observations : {acte.comparution_observations}</li>
                )}
                {acte.enfants_legitimes && (
                  <li>
                    Enfants légitimés : {acte.enfants_nombre} ({acte.enfants_legitimes})
                  </li>
                )}
              </ul>
            </div>

            {/* Bloc 2 : Individu(s) principal(aux) */}
            <div className='mb-6'>
              <h3 className='font-semibold text-gray-700'>👤 Personne(s) principale(s)</h3>
              <ul className='text-sm text-gray-800 list-disc list-inside mt-2'>
                {enfant && (
                  <li>
                    Enfant : <strong>{displayNom(enfant.prenom, enfant.nom)}</strong>
                    {enfant.naissance_date && `, né·e le ${enfant.naissance_date}`}
                    {enfant.naissance_lieu_commune && ` à ${enfant.naissance_lieu_commune}`}
                  </li>
                )}
                {defunt && (
                  <li>
                    Défunt : <strong>{displayNom(defunt.prenom, defunt.nom)}</strong>
                    {defunt.deces_date && `, décédé·e le ${defunt.deces_date}`}
                    {defunt.deces_lieu_commune && ` à ${defunt.deces_lieu_commune}`}
                    {defunt.age && `, à l’âge de ${defunt.age} ans`}
                  </li>
                )}
                {sujet && (
                  <li>
                    Sujet : <strong>{displayNom(sujet.prenom, sujet.nom)}</strong>
                    {sujet.note && <> – {sujet.note}</>}
                  </li>
                )}
                {acteTypeEstMariage && (
                  <>
                    {entites.find((e) => e.role === 'époux') && (
                      <li>
                        Époux :{' '}
                        <strong>
                          {displayNom(
                            entites.find((e) => e.role === 'époux')?.prenom,
                            entites.find((e) => e.role === 'époux')?.nom,
                          )}
                        </strong>
                      </li>
                    )}
                    {entites.find((e) => e.role === 'épouse') && (
                      <li>
                        Épouse :{' '}
                        <strong>
                          {displayNom(
                            entites.find((e) => e.role === 'épouse')?.prenom,
                            entites.find((e) => e.role === 'épouse')?.nom,
                          )}
                        </strong>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

            {/* Bloc 3 : Autres acteurs */}
            <div className='mb-6'>
              <h3 className='font-semibold text-gray-700'>👥 Autres personnes citées</h3>
              <ul className='text-sm text-gray-800 list-disc list-inside mt-2 space-y-1'>
                {entites
                  .filter(
                    (e) => !['enfant', 'défunt', 'sujet', 'époux', 'épouse'].includes(e.role ?? ''),
                  )
                  .filter((e) => !e.role?.startsWith('témoin') && e.role !== 'officier')
                  .map((e) => (
                    <li key={e.id}>
                      {e.role} : {displayNom(e.prenom, e.nom)}
                      {e.age && ` (${e.age} ans)`}
                      {e.note && ` – ${e.note}`}
                    </li>
                  ))}
              </ul>
            </div>

            {/* Bloc 4 : Signataires (témoins + officier) */}
            <div className='mb-2'>
              <h3 className='font-semibold text-gray-700'>✍️ Signataires de l’acte</h3>
              <ul className='text-sm text-gray-800 list-disc list-inside mt-2 space-y-1'>
                {entites
                  .filter((e) => e.role?.startsWith('témoin'))
                  .map((e) => (
                    <li key={e.id}>
                      Témoin : {displayNom(e.prenom, e.nom)} – {e.note || 'aucune note'}
                    </li>
                  ))}
                {entites
                  .filter((e) => e.role === 'officier')
                  .map((e) => (
                    <li key={e.id}>Officier de l’état civil : {displayNom(e.prenom, e.nom)}</li>
                  ))}
              </ul>
            </div>
          </>
        )}

        {activeSection === 'Acteurs' && (
          <>
            <ActeursAccordion acteId={acteId!} sourceTable={'etat_civil_actes'} />
          </>
        )}
        {activeSection === 'Chronologie' && (
          <>
            <h2 className='text-lg font-semibold mb-4'>Chronologie des événements</h2>
            <HorizontalTimeline steps={stepsTmp} />
          </>
        )}
        {activeSection === 'Notes' && (
          <p className='text-gray-500 italic'>Aucune note ajoutée pour cet acte.</p>
        )}
        {activeSection === 'Historique de modifications' && (
          <AuditHistoryTab acteId={acteId!} actorIds={entites.map((e) => e.id)} />
        )}
      </section>
    </div>
  );
}

function extractArreteDateFromNote(note: string): Date | null {
  if (!note) return null;

  // Découpe la note sur les séparateurs courants
  const parts = note.split(/;|et/gi).map((p) => p.trim());

  for (const part of parts) {
    // Ne traite que les parties contenant "arrêté" (avec ou sans accent/casse)
    if (!/arr[ée]t[ée]/i.test(part)) continue;

    // Recherche une date au format dd/mm/yyyy après "en date du" ou "date du"
    const match = part.match(/(?:en\s+date\s+du|date\s+du)\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (match && match[1]) {
      const [day, month, year] = match[1].split('/');
      const parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}
