import { ScrollArea } from '@/components/ui/scroll-area';
import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import { StatusPill } from '../../components/shared/StatusPill';
import { parseISO } from 'date-fns';
import {
  CalendarDays,
  CalendarFold,
  Check,
  HelpCircle,
  House,
  Navigation,
  Pencil,
  Unlink,
  Users,
  X,
} from 'lucide-react';
import { Landmark, Flag } from 'lucide-react';
import { HorizontalTimeline } from '@/components/shared/HorizontalTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ActeCoherence } from './ActeCoherence-complet';

export const roleGroupMap: Record<string, string> = {
  père: 'Parents',
  mère: 'Parents',
  époux: 'Époux',
  épouse: 'Époux',
  'époux-père': "Parents de l'époux",
  'époux-mère': "Parents de l'époux",
  'épouse-père': "Parents de l'épouse",
  'épouse-mère': "Parents de l'épouse",
  'enfant légitimé': 'Enfants légitimés',
  parents: 'Parents',
  'temoin 1': 'Témoins',
  'témoin 1': 'Témoins',
  'temoin 2': 'Témoins',
  'témoin 2': 'Témoins',
  'temoin 3': 'Témoins',
  'témoin 3': 'Témoins',
  'temoin 4': 'Témoins',
  'témoin 4': 'Témoins',
  déclarant: 'Témoins',
  enfant: 'Enfant(s)',
  défunt: 'Défunt',
  sujet: 'Sujet(s)',
};

export default function PageActeEtatCivil() {
  const { acteId } = useParams();
  const { acte, bureau, entites, loading, fetchActeDetail } = useEtatCivilActesStore();

  useEffect(() => {
    if (acteId) {
      fetchActeDetail(acteId);
    }
  }, [acteId, fetchActeDetail]);

  const enfant = entites.find((e) => e.role === 'enfant');
  const sujet = entites.find((e) => e.role === 'sujet');
  const defunt = entites.find((e) => e.role === 'défunt');
  const acteDate = acte?.date ? parseISO(acte.date) : null;

  let steps: any[] = [];

  if (acte?.type_acte === 'naissance') {
    steps = [];
    if(enfant?.naissance_date){
      steps.push({ icon: Flag, title: 'Naissance', date: enfant?.naissance_date, color: 'text-indigo-600', description: enfant?.naissance_lieu_commune })
    }
    if(acteDate){
      steps.push({
        icon: Landmark,
        title: "Inscription à l'état-civil",
        date: acteDate,
        color: 'text-indigo-600'
      })
    }
  } else if (acte?.type_acte === 'décès') {
    steps = [];
    if(defunt?.deces_date){
      steps.push({ icon: CalendarFold, title: 'Décès', date: defunt?.deces_date, color: 'text-indigo-600',
        description: defunt?.deces_lieu_commune })
    }
    if(acteDate){
      steps.push({
        icon: Landmark,
        title: "Déclaration à l'état-civil",
        date: acteDate,
        color: 'text-indigo-600'
      })
    }
  } else if (acte?.type_acte === 'mariage' && acteDate) {
    let iconMariage = acte?.comparution_mairie ? Landmark : House;
    steps = [
      {
        icon: iconMariage,
        title: 'Mariage',
        date: acteDate,
        color: 'text-indigo-600',
        description: !acte?.comparution_mairie ? acte?.comparution_observations : '',
      },
    ];
  } else if (acte?.type_acte === 'reconnaissance' && acteDate) {
    steps = [{ icon: Landmark, title: 'Reconnaissance', date: acteDate, color: 'text-indigo-600' }];
  } else if (acte?.type_acte === 'affranchissement' && acteDate) {
    const arreteDate = extractArreteDateFromNote(sujet?.note || '');
    steps = [
      {
        icon: Unlink,
        title: "Arrêté d'affranchissement du Gouverneur",
        date: arreteDate,
        color: 'text-indigo-600',
      },
      ,
      {
        icon: Landmark,
        title: "Inscription à l'état-civil",
        date: acteDate,
        color: 'text-indigo-600',
      },
    ];
  }

  const groupedActors = entites.reduce((acc: Record<string, any[]>, acteur) => {
    const roleKey = acteur.role?.toLowerCase();
    const group = roleKey && roleGroupMap[roleKey] ? roleGroupMap[roleKey] : 'Autres';

    if (!acc[group]) acc[group] = [];
    acc[group].push(acteur);
    return acc;
  }, {});

  const parents = entites.filter(
    (e) => e.role?.toLowerCase() === 'père' || e.role?.toLowerCase() === 'mère',
  );
  const hasPere = parents.some((e) => e.role?.toLowerCase() === 'père');
  const hasMere = parents.some((e) => e.role?.toLowerCase() === 'mère');

  const missingParents: { role: string; label: string }[] = [];

  if (!hasPere) missingParents.push({ role: 'père', label: 'Père' });
  if (!hasMere) missingParents.push({ role: 'mère', label: 'Mère' });
  if (acte?.type_acte != 'mariage') {
    for (const parent of missingParents) {
      const group = roleGroupMap[parent.role] || 'Autres';
      if (!groupedActors[group]) groupedActors[group] = [];

      groupedActors[group].push({
        id: `faux-${parent.role}`,
        role: parent.role,
        est_cite: false,
        faux: true,
      });
    }
  }
  return (
    <ScrollArea className='p-6 w-[85%] mx-auto space-y-10'>
      {/* 🧾 Section Titre */}
      <section id='titre'>
        {loading ? (
          <p className='text-muted-foreground'>Chargement de l’acte...</p>
        ) : acte ? (
          <div>
            <div className='flex items-start justify-between'>
              <h1 className='text-2xl font-bold max-w-[80%]'>{formatLabel(acte.label)}</h1>
              <div className='flex items-center gap-2'>
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
              </div>
            </div>

            <p className='text-muted-foreground text-sm mt-1'>
              {bureau?.nom && `${bureau.nom}`}
              {acte.numero_acte
                ? ` – registre des ${acte.type_acte}${acte.type_acte.endsWith("s") ? "" :"s"} enregistrées en ${acte.annee}, acte n°${acte.numero_acte}`
                : ''}
            </p>
          </div>
        ) : (
          <p className='text-destructive'>Aucun acte trouvé.</p>
        )}
      </section>

      {acte && acte?.statut != 'transcrit' && <ActeCoherence acteId={acte.id} />}

      {/* 🧠 Métadonnées de l’acte */}
      {steps && <section id='chronologie' className='pt-10'>
        <div className='flex items-center gap-2 mb-4'>
          <CalendarDays className='text-primary w-5 h-5' />
          <h2 className='text-2xl font-bold text-foreground tracking-tight'>
            Chronologie des événements
          </h2>
        </div>

        <div className='border-t border-muted mb-6' />

        <div className='flex items-center gap-6 overflow-x-auto px-2 py-4'>
          <HorizontalTimeline steps={steps} />
        </div>
      </section>}

      {/* 📜 Transcription */}
      <section id='transcription'>{/* À remplir */}</section>

      {/* 👤 Acteurs liés à l’acte */}
      <section id='acteurs'>
        <div className='flex items-center gap-2 mb-4'>
          <Users className='text-primary w-5 h-5' />
          <h2 className='text-2xl font-bold text-foreground tracking-tight'>
            Acteurs liés à l’acte
          </h2>
        </div>
        <div className='border-t border-muted mb-6' />

        <div className='space-y-8'>
          {orderGroups(groupedActors, acte?.type_acte).map(([group, acteurs]) => (
            <div key={group}>
              <div className='flex items-center gap-2 mb-2'>
                <Users className='w-5 h-5 text-primary' />
                <h3 className='text-xl font-semibold capitalize text-foreground'>{group}</h3>
              </div>

              <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3'>
                {orderByMultiOrRoleOrName(acteurs).map((acteur) => (
                  <motion.div
                    key={acteur.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className='hover:shadow-lg transition-shadow duration-200'>
                      <CardHeader className='flex flex-col items-start space-y-1'>
                        <div className='flex items-center justify-between w-full'>
                          <div className='flex items-center gap-2'>
                            {acteur.role && (
                              <Badge variant='outline' className='text-xs capitalize'>
                                {acteur.role}
                              </Badge>
                            )}
                            {acteur.individuId && (
                              <Link to={`/individu/${acteur.individuId}`}>
                                <Button variant='ghost' className='flex items-center gap-2 text-sm'>
                                  <Navigation className='w-4 h-4 opacity-70 text-indigo-600' />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                        <CardTitle className='text-base'>
                          {acteur.nom ? `${acteur.prenom} ${acteur.nom}` : acteur.label}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className='text-sm text-gray-700 space-y-1'>
                        {acteur.faux ? (
                          <p>Non mentionné</p>
                        ) : (
                          <>
                            {acteur.filiation && (
                              <p>
                                <strong>Filiation</strong> : {acteur.filiation}
                              </p>
                            )}
                            {acteur.profession && (
                              <p>
                                <strong>Profession</strong> : {acteur.profession}
                              </p>
                            )}
                            {acteur.domicile && (
                              <p>
                                <strong>Domicile</strong> : {acteur.domicile}
                              </p>
                            )}
                            {acteur.qualite && (
                              <p>
                                <strong>Qualité</strong> : {acteur.qualite}
                              </p>
                            )}
                            {acteur.fonction && (
                              <p>
                                <strong>Fonction</strong> : {acteur.fonction}
                              </p>
                            )}
                            {acteur.statut && (
                              <p>
                                <strong>Statut</strong> : {acteur.statut}
                              </p>
                            )}
                            {acteur.origine && (
                              <p>
                                <strong>Origine</strong> : {acteur.origine}
                              </p>
                            )}
                            {acteur.sexe && (
                              <p>
                                <strong>Sexe</strong> : {acteur.sexe}
                              </p>
                            )}
                            {acteur.age && (
                              <p>
                                <strong>Âge</strong> : {acteur.age}
                              </p>
                            )}
                            {acteur.lien && (
                              <p>
                                <strong>Lien</strong> : {acteur.lien}
                              </p>
                            )}
                            {acteur.note && (
                              <p>
                                <strong>Note</strong> : {acteur.note}
                              </p>
                            )}

                            <div className='pt-2 space-y-1'>
                              {bool('Vivant', acteur.est_vivant)}
                              {acteur.role !== 'enfant' &&
                                acteur.role !== 'sujet' &&
                                acteur.role !== 'défunt' &&
                                acteur.role !== 'enfant légitimé' &&
                                !(acteur.role === 'père' && !acteur.est_declarant) &&
                                !(acteur.role === 'mère' && !acteur.est_declarant) &&
                                bool('Présent', acteur.est_present)}
                              {(acteur.role === 'père' ||
                                acteur.role === 'mère' ||
                                acteur.role === 'déclarant') &&
                                bool('Déclarant', acteur.est_declarant)}
                              {acteur.est_present && bool('A signé', acteur.a_signe)}
                              {acteur.est_present && acteur.signature && (
                                <p>
                                  <strong>Signature</strong> : {acteur.signature}{acteur.signature_libelle? " « "+acteur.signature_libelle+" »":''}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔗 Liens généalogiques et contextuels */}
      <section id='liens'>{/* À remplir */}</section>

      {/* 📌 Mentions marginales */}
      <section id='mentions-marginales'>{/* À remplir */}</section>

      {/* 🧭 Navigation / actions */}
      <section id='navigation'>{/* À remplir */}</section>
    </ScrollArea>
  );
}
function formatLabel(label: string): string {
  if (!label) return '';
  return (label.charAt(0).toUpperCase() + label.slice(1)).replace(/\? SANS NOM/g, '');
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

const bool = (label: string, value?: boolean) => (
  <div className='flex items-center gap-2'>
    {value === true ? (
      <Check className='w-4 h-4 text-green-600' />
    ) : value === false ? (
      <X className='w-4 h-4 text-gray-400' />
    ) : (
      <HelpCircle className='w-4 h-4 text-yellow-500' />
    )}
    <span className='text-sm text-gray-700'>{label}</span>
  </div>
);

const orderByMultiOrRoleOrName = (acteurs: any[]) => {
  const rolePriority = (acteur: any): number => {
    const role = (acteur.role || '').toLowerCase();
    const isFather = role.includes('père');
    const isMother = role.includes('mère');
    const isEpoux = role.includes('époux');
    const isEpouse = role.includes('épouse');

    // Priorités :
    if (role === 'père') return 0;
    if (role === 'mère') return 1;
    if (isEpoux && isFather) return 2;
    if (isEpoux && isMother) return 3;
    if (isEpouse && isFather) return 4;
    if (isEpouse && isMother) return 5;
    if (isEpoux) return 6;
    if (isEpouse) return 7;

    return 10; // par défaut
  };

  const get = (v: any) => (v?.toString() || '').toLowerCase();

  return [...acteurs].sort((a, b) => {
    const prioDiff = rolePriority(a) - rolePriority(b);
    if (prioDiff !== 0) return prioDiff;

    return (
      get(a.multi).localeCompare(get(b.multi)) ||
      get(a.role).localeCompare(get(b.role)) ||
      get(a.nom).localeCompare(get(b.nom))
    );
  });
};

function orderGroups(
  grouped: Record<string, any[]>,
  typeActe: string | undefined,
): [string, any[]][] {
  const orderMap: Record<string, string[]> = {
    naissance: ['Enfant(s)', 'Parents', 'Témoins', 'Autres'],
    reconnaissance: ['Sujet(s)', 'Parents', 'Témoins', 'Autres'],
    affranchissement: ['Sujet(s)', 'Parents', 'Témoins', 'Autres'],
    mariage: [
      'Époux',
      "Parents de l'époux",
      "Parents de l'épouse",
      'Enfants légitimés',
      'Témoins',
      'Autres',
    ],
    décès: ['Défunt', 'Parents', 'Témoins', 'Autres'],
  };

  const defaultOrder = ['Autres'];
  const ordre = orderMap[typeActe ?? ''] ?? defaultOrder;

  const entries = Object.entries(grouped);

  return entries.sort((a, b) => {
    const ia = ordre.indexOf(a[0]);
    const ib = ordre.indexOf(b[0]);
    return (ia === -1 ? ordre.length : ia) - (ib === -1 ? ordre.length : ib);
  });
}
