// NotaireLayout.tsx
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
  Star,
  Pencil,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from 'react-router-dom';
import { RegistreAcCreateModal } from './RegistreAcCreateModal';
import { getIconForStatutFromStats } from '@/features/actes/transcription/constants/statutConfig';
import { useNotaireStore } from '@/store/notaires';
import { toast } from 'sonner';
import type { Notaire } from '@/types/acte';
import { useFavorisStore } from '@/store/favoris';
import { displayNotaireNom } from '@/lib/nom';
import { NotaireRegistres } from './NotaireRegistres';
import { useActeStore } from '@/store/actes';
import { Button } from '@/components/ui/button';

const tabs: { label: string; icon: React.ElementType }[] = [
  { label: 'Statistiques', icon: BarChart2 },
  { label: 'Minutes conservées', icon: FileText },
  { label: "Minutes conservées par d'autres notaires", icon: FileText },
  { label: 'Collaborateurs', icon: User },
  { label: 'Sources', icon: BookOpen },
  { label: 'Qualité des données', icon: AlertCircle },
  { label: 'Notes', icon: Pen },
];

export default function NotaireLayout() {
  const { id } = useParams<{ id: string }>();
  const [notaire, setNotaire] = useState<Notaire | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(tabs[0].label);
  const [createRegistreModalOpen, setCreateRegistreModalOpen] = useState(false);

  // Favoris store
  const {
    fetchNotaireFavoris,
    ajouterNotaireFavori,
    retirerNotaireFavori,
    notaireFavorisIds,
  } = useFavorisStore();

  const isFavori = id ? notaireFavorisIds.includes(id) : false;

  // Notaire store
  const fetchNotaire = useNotaireStore((s) => s.fetchOne);

  // Actes store
  const { actes, fetchActes } = useActeStore();

  // Effet : chargement des favoris au premier rendu
  useEffect(() => {
    fetchNotaireFavoris();
  }, []);

  // Effet : chargement du notaire quand `id` change
  useEffect(() => {
    if (!id) return;

    const loadNotaire = async () => {
      setIsLoading(true);
      try {
        const result = await fetchNotaire(id);
        if (!result) {
          console.warn("Aucun notaire trouvé");
        }
        setNotaire(result ?? null);
      } catch (error) {
        console.error(`Erreur lors du chargement du notaire ${id}`, error);
        setNotaire(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotaire();
  }, [id]);

  // Effet : chargement des actes associés
  useEffect(() => {
    if (id) fetchActes();
  }, [id]);

  // Gestion des favoris
  const ajouterFavori = async () => {
    if (notaire && id) {
      await ajouterNotaireFavori(id);
      toast.success(`Notaire ${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""} ajouté aux favoris`);
    }
  };

  const retirerFavori = async () => {
    if (notaire && id) {
      await retirerNotaireFavori(id);
      toast(`Notaire ${notaire.titre ?? ""} ${notaire.nom} ${notaire.prenom ?? ""} retiré des favoris`, {
        icon: "⭐",
        duration: 4000,
      });
    }
  };

  // Statistiques
  const stats = useMemo(() => {
    if (!id || !notaire) {
      return {
        totalActes: 0,
        actesReleves: 0,
        actesTranscrits: 0,
        types: {},
      };
    }

    const actesNotaire = actes.filter((a) =>
      a.notaires?.some((n) => n.role === "principal" && n.notaire?.id === id)
    );

    const totalActes = notaire.registres?.reduce((sum, a) => sum + (a.actes_estimes ?? 0), 0) ?? 0;
    const actesReleves = actesNotaire.length;
    const actesTranscrits = actesNotaire.filter((a) => a.statut === "transcrit").length;

    const types: Record<string, number> = {};
    actesNotaire.forEach((a) => {
      a.typeOperation?.forEach((t) => {
        types[t] = (types[t] ?? 0) + 1;
      });
    });

    return { totalActes, actesReleves, actesTranscrits, types };
  }, [actes, id, notaire]);

  return (
    <>
      {isLoading && (
        <div className='flex items-center justify-center h-[60vh]'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        </div>
      )}
      {!isLoading && notaire ? (
        <div className='flex max-h-auto flex-col'>
          <div className='sticky top-0 z-10 bg-white'>
            <div className='flex items-center justify-between px-6 py-3 border-b bg-white'>
              <div className='flex items-center gap-3'>
                <Link to={`/notaires/liste`}>
                  <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer'>
                    <title>Retour</title>
                  </ArrowLeft>
                </Link>
                {getIconForStatutFromStats(stats.totalActes, stats.actesTranscrits)}
                <span className='text-base font-semibold text-gray-800'>{displayNotaireNom(notaire.titre, notaire.nom, notaire.prenom)}</span>
                {notaire.etude && <span className='text-sm text-gray-500'>
                  Etude : {notaire.etude}
                </span>}
                {notaire.lieu_exercice && <span className='text-sm text-gray-500'>
                  Lieu d’exercice : {notaire.lieu_exercice}
                </span>}
                <div className='flex gap-2'>
                  <Badge variant='secondary'>
                    Avancement de la transcription :{' '}
                    {stats.actesTranscrits
                      ? stats.actesTranscrits == 0
                        ? '0%'
                        : stats.actesTranscrits > 0 && stats.totalActes
                          ? `${Math.floor((stats.actesTranscrits / stats.totalActes) * 100)}%`
                          : 'inconnu'
                      : 'inconnu'}
                  </Badge>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <Link to={`/notaire/edit/${notaire.id}`}>
                  <Button
                    variant='ghost'
                    className='flex items-center gap-2 text-sm text-gray-600 hover:text-black'
                  >
                    <Pencil className='w-4 h-4' />
                    Modifier
                  </Button>
                </Link>
                {isFavori ? (
                  <button
                    onClick={retirerFavori}
                    title="Retirer des favoris"
                    className="text-yellow-500 hover:text-yellow-600 transition-all duration-200 transform hover:scale-110"
                  >
                    <Star className="w-6 h-6 fill-yellow-500 transition-colors duration-200" />
                  </button>
                ) : (
                  <button
                    onClick={ajouterFavori}
                    title="Marquer comme favori"
                    className="text-gray-400 hover:text-yellow-500 transition-all duration-200 transform hover:scale-110"
                  >
                    <Star className="w-6 h-6 transition-colors duration-200" />
                  </button>
                )}
                <Settings className='w-5 h-5 text-gray-700 bg-orange-200 cursor-pointer' />
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
                    <StatCard label='Actes à transcrire' value={stats.actesReleves - stats.actesTranscrits} />
                    <StatCard label='Actes transcrits' value={stats.actesTranscrits} />
                    <StatCard label='Actes à relever' value={stats.totalActes - stats.actesReleves} />
                    <StatCard label='Actes relevés' value={stats.actesReleves} />
                    <StatCard label='Actes estimés' value={stats.totalActes} />
                  </div>
                </>
              ) : activeSection === 'Minutes conservées' ? (
                <>
                  <NotaireRegistres notaireId={notaire.id} registres={notaire.registres ?? []} />
                </>
              ) : activeSection === "Minutes conservées par d'autres notaires" ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Minutes conservées par d'autres notaires</h2>
                  <p className='text-sm text-gray-700'>
                    à compléter.
                  </p>
                </>
              ) : activeSection === 'Collaborateurs' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Collaborateurs</h2>
                  <p className='text-sm text-gray-700'>
                    à compléter.
                  </p>
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
          <RegistreAcCreateModal
            notaireId={notaire.id}
            open={createRegistreModalOpen}
            onClose={() => setCreateRegistreModalOpen(false)}
            registresExistants={notaire.registres}
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
