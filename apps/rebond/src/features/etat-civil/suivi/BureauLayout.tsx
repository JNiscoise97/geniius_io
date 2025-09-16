// BureauLayout.tsx
import {
  ArrowLeft,
  FileText,
  Settings,
  Loader2,
  User,
  BookOpen,
  AlertCircle,
  BarChart2,
  Pen,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from 'react-router-dom';
import { useEtatCivilStore } from '@/store/etatcivil';
import type { EtatCivilBureau } from '@/types/etatcivil';
import { DataTable } from '@/components/shared/DataTable';
import { useFonctionsTimeline } from '@/hooks/useOfficiersParBureau';
import { capitalize } from '@/lib/enrichirNarration';
import { RegistreCreateModal } from './RegistreCreateModal';
import { BureauRegistres } from './BureauRegistres';
import { getIconForStatutFromStats } from '@/features/actes/transcription/constants/statutConfig';
import { RadialActesChart } from '@/components/stats/RadialActesChart';

const tabs: { label: string; icon: React.ElementType }[] = [
  { label: 'Statistiques', icon: BarChart2 },
  { label: 'Registres', icon: FileText },
  { label: 'Officiers', icon: User },
  { label: 'Sources', icon: BookOpen },
  { label: 'Qualité des données', icon: AlertCircle },
  { label: 'Notes', icon: Pen },
];

export default function BureauLayout() {
  const { id } = useParams();
  const [bureau, setBureau] = useState<EtatCivilBureau | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchBureau = useEtatCivilStore((s) => s.fetchBureau);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    fetchBureau(id)
      .then((b) => setBureau(b ?? null))
      .catch((err) => {
        console.error(`Erreur lors du chargement du bureau ${id}`, err);
        setBureau(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const [activeSection, setActiveSection] = useState(tabs[0].label);

  const { fonctionsTimeline } = useFonctionsTimeline(id);
  const fonctionPriorite = [
    'maire',
    'adjoint au maire',
    'sous-officier',
    'premier',
    'second',
    'conseiller',
    'membre du conseil',
  ];

  function getPriorite(fonction: string) {
    const lower = fonction.toLowerCase();
    const index = fonctionPriorite.findIndex((prefix) => lower.startsWith(prefix));
    return index === -1 ? fonctionPriorite.length + lower.localeCompare(fonction) : index;
  }

  const fonctionsTimelineTriees = [...fonctionsTimeline]
    .filter((f) => f.fonction && f.fonction.trim() !== '' && f.fonction.trim() !== 'null')
    .sort((a, b) => {
      return getPriorite(a.fonction) - getPriorite(b.fonction);
    });

  const [createRegistreModalOpen, setCreateRegistreModalOpen] = useState(false);

  return (
    <>
      {isLoading && (
        <div className='flex items-center justify-center h-[60vh]'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        </div>
      )}
      {!isLoading && bureau ? (
        <div className='flex max-h-auto flex-col'>
          <div className='sticky top-0 z-10 bg-white'>
            <div className='flex items-center justify-between px-6 py-3 border-b bg-white'>
              <div className='flex items-center gap-3'>
                <Link to={`/ec-bureaux/liste`}>
                  <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer'>
                    <title>Retour</title>
                  </ArrowLeft>
                </Link>
                {getIconForStatutFromStats(bureau.actes_estimes, bureau.actes_transcrits)}
                <span className='text-base font-semibold text-gray-800'>{bureau.nom}</span>
                <span className='text-sm text-gray-500'>
                  à {bureau.commune} ({bureau.departement})
                </span>
                <div className='flex gap-2'>
                  <Badge variant='secondary'>
                    Avancement de la transcription :{' '}
                    {bureau.actes_transcrits && bureau.actes_transcrits > 0 && bureau.actes_estimes
                      ? `${Math.floor((bureau.actes_transcrits / bureau.actes_estimes) * 100)}%`
                      : 'inconnu'}
                  </Badge>
                </div>
              </div>
              <div className='flex items-center gap-4'>
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
                </button>
              ))}
            </div>
          </div>
          <div className='flex flex-1 overflow-hidden'>
            <section className='flex-1 overflow-y-auto p-6 mb-4 prose prose-sm'>
              {activeSection === 'Statistiques' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Statistiques</h2>
                  <p className='text-sm text-gray-700'>
                    Données agrégées : nombre d’actes, taux de transcription, nombre de registres
                    par période, etc.
                  </p>
                  <div className='grid grid-cols-2 md:grid-cols-5 gap-4 text-sm'>
                    <StatCard label='Actes à transcrire' value={bureau.actes_a_transcrire} />
                    <StatCard label='Actes transcrits' value={bureau.actes_transcrits} />
                    <StatCard label='Actes à relever' value={bureau.actes_a_relever} />
                    <StatCard label='Actes relevés' value={bureau.actes_releves} />
                    <StatCard label='Actes estimés' value={bureau.actes_estimes} />
                    <RadialActesChart
                      actes_estimes={bureau.actes_estimes}
                      actes_releves={bureau.actes_releves}
                      actes_transcrits={bureau.actes_transcrits}
                    />
                  </div>
                </>
              ) : activeSection === 'Registres' ? (
                <>
                  <BureauRegistres bureauId={bureau.id} registres={bureau.registres ?? []} />
                </>
              ) : activeSection === 'Officiers' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Officiers</h2>
                  <p className='text-sm text-gray-700'>
                    Liste des personnes identifiées comme officiers de l’état civil ou assimilés
                    (d’après les actes signés).
                  </p>

                  <div className='space-y-8'>
                    {/*loadingOfficiers ? (
                      <Loader2 className='w-6 h-6 animate-spin text-blue-600' />
                    ) : (
                      <FriseOfficiers
                        officiers={officiers}
                        anneeDebut={1790}
                        anneeFin={1930}
                      />
                    )*/}
                    <div className='space-y-8'>
                      <Accordion type='multiple' className='w-full space-y-2'>
                        {fonctionsTimelineTriees.map(({ fonction, periodes }) => (
                          <AccordionItem key={fonction} value={fonction}>
                            <AccordionTrigger className='text-left text-base font-semibold text-gray-800'>
                              <div>
                                {capitalize(fonction)}
                                <Badge variant='secondary' className='ml-2'>
                                  {periodes.length}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className='w-fit min-w-[50%] overflow-auto'>
                                <DataTable
                                  title={'Officiers'}
                                  data={periodes.sort((a, b) => a.debut - b.debut)}
                                  columns={[
                                    {
                                      key: 'nom',
                                      label: 'Nom',
                                      render: (row) =>
                                        row.individuId ? (
                                          <a
                                            href={`/individu/${row.individuId}`}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-indigo-800 underline hover:text-indigo-600'
                                          >
                                            {row.nom}
                                          </a>
                                        ) : (
                                          row.nom
                                        ),
                                    },
                                    { key: 'debut', label: 'Début' },
                                    { key: 'fin', label: 'Fin' },
                                    {
                                      key: 'duree',
                                      label: 'Durée',
                                      render: (row) => `${row.fin - row.debut + 1} ans`,
                                    },
                                    { key: 'nbActes', label: "Nombre d'actes" },
                                  ]}
                                  pageSize={-1}
                                  defaultSort={['debut']}
                                />
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </>
              ) : activeSection === 'Sources' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Sources</h2>
                  <p className='text-sm text-gray-700'>
                    Liens vers archives numérisées, inventaires, répertoires, ou documents connexes.
                  </p>
                </>
              ) : activeSection === 'Qualité des données' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Qualité des données</h2>
                  <p className='text-sm text-gray-700'>
                    Analyse des données manquantes, doublons, ou incohérences signalées dans les
                    registres de ce bureau.
                  </p>
                </>
              ) : activeSection === 'Notes' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Notes</h2>
                  <p className='text-sm text-gray-700'>
                    📝 Notes et commentaires de recherche liés à ce bureau.
                  </p>
                </>
              ) : (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Notes</h2>
                  <p className='text-sm text-gray-700'>
                    📝 Notes et commentaires de recherche liés à ce bureau.
                  </p>
                </>
              )}
            </section>
          </div>
          <RegistreCreateModal
            bureauId={bureau.id}
            open={createRegistreModalOpen}
            onClose={() => setCreateRegistreModalOpen(false)}
            registresExistants={bureau.registres}
          />
        </div>
      ) : null}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className='border rounded p-3 shadow-sm text-center'>
      <div className='text-2xl font-bold'>{value}</div>
      <div className='text-muted-foreground'>{label}</div>
    </div>
  );
}
