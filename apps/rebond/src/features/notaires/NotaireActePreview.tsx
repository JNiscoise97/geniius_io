// NotaireActePreview.tsx
import {
  ArrowLeft,
  ScrollText,
  Users,
  BookOpen,
  Navigation,
  Pencil,
  Settings,
  Check,
  FileSignature,
  FileText,
  PencilLine,
  Gavel,
  ShieldCheck,
  StickyNote,
  MoreHorizontal,
  Star,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { displayNotaireNom } from '@/lib/nom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/shared/StatusPill';
import { getIconForStatut } from '@/features/actes/transcription/constants/statutConfig';
import { useActeStore } from '@/store/actes';
import { useFavorisStore } from '@/store/favoris';
import { toast } from 'sonner';
import { ActeursAccordion } from './ActeursAccordion';
import AnalyseEditor from '../actes/analyse/AnalyseEditor';

const tabs = [
  { label: 'Résumé', icon: ScrollText },
  { label: 'Acteurs', icon: Users },
  { label: 'Transcription', icon: FileText },
  { label: 'Annotations', icon: PencilLine },
  { label: 'Navigation par rebond', icon: Navigation },
  { label: 'Notaires', icon: Gavel },
  { label: 'Sources', icon: BookOpen },
  { label: 'Qualité des données', icon: ShieldCheck },
  { label: 'Fichiers', icon: FileSignature },
  { label: 'Notes', icon: StickyNote },
  { label: 'Autres', icon: MoreHorizontal },
];

export default function NotaireActePreview() {
  const { acteId } = useParams();

  const [activeSection, setActiveSection] = useState(tabs[0].label);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActeById = useActeStore((state) => state.fetchActeById);
  const acte = useActeStore((state) =>
    state.actes.find((a) => a.id === acteId)
  );

  // Favoris store
    const {
      fetchActeFavoris,
      ajouterActeFavori,
      retirerActeFavori,
      acteFavorisIds,
    } = useFavorisStore();
  
    const isFavori = acteId ? acteFavorisIds.includes(acteId) : false;

  const registre = acte?.registre;
  const notaire = acte?.notaires?.find((n) => n.role === "principal")?.notaire;

  useEffect(() => {
    if (!acteId) return;

    setIsLoading(true);
    fetchActeById(acteId)
      .catch((err) =>
        console.error("Erreur dans fetchActeById:", err)
      )
      .finally(() => setIsLoading(false));
  }, [acteId, fetchActeById]);

  // Gestion des favoris
  const ajouterFavori = async () => {
    if (notaire && acteId) {
      await ajouterActeFavori(acteId);
      toast.success(`Acte #${acteId} ajouté aux favoris`)
    }
  };

  const retirerFavori = async () => {
    if (notaire && acteId) {
      await retirerActeFavori(acteId);
      toast(`Acte #${acteId} retiré des favoris`, {
            icon: "⭐",
            duration: 4000
          })
    }
  };

  return isLoading ? (
    <div className='flex flex-col'>
      <p className='text-muted-foreground'>Chargement de l’acte...</p>
    </div>
  ) : notaire && registre && acte ? (
    <div className='flex flex-col'>
      <div className='sticky top-0 z-20 bg-white'>
        <div className='flex items-center justify-between px-6 py-3 border-b'>
          <div className='flex items-center gap-3'>
            <Link to={`/ac-registre/${notaire.id}/${registre.id}`}>
              <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer' />
            </Link>
            {getIconForStatut(acte.statut)}
            <div>
              <h1 className='text-base font-semibold text-gray-800'>
                {acte.label}
              </h1>
              <div className='text-xs flex items-center space-x-2'>
                <span className='text-gray-800'>
                  Minutes pour l'année {registre.annee}
                </span>
                <span className='text-gray-500'>acte n°{acte.numero_acte}</span>
                <span className='text-gray-500'>
                  conservées par {displayNotaireNom(notaire.titre, notaire.nom, notaire.prenom)}
                </span>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <Link to={`/ac-acte/edit/${acte.id}`}>
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
                      alert('à implémenter')
                    }}
                    className='text-blue-800'
                  >
                    <Check className='w-4 h-4 mr-2' />
                    Marquer comme transcrit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'}`}
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
            <p>TODO</p>
          ) : activeSection === 'Acteurs' ? (
              <ActeursAccordion acteId={acteId!} sourceTable={"actes"} type='sous_categorie' />
          ) : activeSection === 'Transcription' ? (
            <div className='h-[600px]'><AnalyseEditor acteId={acteId!} /></div>
          ) : activeSection === 'Sources' ? (
            <p>TODO</p>
          ) : activeSection === 'Qualité des données' ? (
            <p>TODO</p>
          ) : activeSection === 'Notes' ? (
            <p>TODO</p>
          ) : (
            <p>Autres</p>
          )}
        </section>
      </div>
    </div>
  ) : null;
}