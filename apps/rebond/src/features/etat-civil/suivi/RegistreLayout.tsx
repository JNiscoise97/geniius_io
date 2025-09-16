// RegistreLayout.tsx
import {
  ArrowLeft,
  Settings,
  Loader2,
  User,
  AlertCircle,
  BarChart2,
  Pen,
  Plus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEtatCivilStore } from '@/store/etatcivil';
import type { EtatCivilActe, EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';
import { getRegistreLabel } from './BureauRegistres';
import { ActeCreateModal } from './ActeCreateModal';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/shared/StatusPill';
import { getIconForStatutFromStats } from '@/features/actes/transcription/constants/statutConfig';

const tabs: { label: string; icon: React.ElementType }[] = [
  { label: 'Actes', icon: BarChart2 },
  { label: 'Officiers', icon: User },
  { label: 'Qualité des données', icon: AlertCircle },
  { label: 'Notes', icon: Pen },
];

export default function RegistreLayout() {
  const { id } = useParams();
  const { bureauId } = useParams();
  const [registre, setRegistre] = useState<EtatCivilRegistre | null>(null);
  const [bureau, setBureau] = useState<EtatCivilBureau | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchRegistre = useEtatCivilStore((s) => s.fetchRegistre);
  const fetchBureau = useEtatCivilStore((s) => s.fetchBureau);

  useEffect(() => {
    if (!id || !bureauId) return;

    setIsLoading(true);

    Promise.all([fetchRegistre(id), fetchBureau(bureauId)])
      .then(([reg, bur]) => {
        setRegistre(reg ?? null);
        setBureau(bur ?? null);
      })
      .catch((err) => {
        console.error('Erreur lors du chargement du registre ou du bureau', err);
        setRegistre(null);
        setBureau(null);
      })
      .finally(() => setIsLoading(false));
  }, [id, bureauId]);

  const [activeSection, setActiveSection] = useState(tabs[0].label);

  const [createActeModalOpen, setCreateActeModalOpen] = useState(false);
  const [numeroActeACreer, setNumeroActeACreer] = useState<string | null>(null);

  const handleCreateActeDemanded = (numero: string) => {
    setNumeroActeACreer(numero);
    setCreateActeModalOpen(true);
  };

  const [actesLocal, setActesLocal] = useState<any[]>([]);
  useEffect(() => {
    if (registre?.actes) {
      setActesLocal(registre.actes);
    }
  }, [registre?.actes]);
  const handleNewActe = (newActe: EtatCivilActe) => {
    setActesLocal((prev) => [...prev, newActe]);
  };

  return (
    <>
      {isLoading && (
        <div className='flex items-center justify-center h-[60vh]'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        </div>
      )}
      {!isLoading && bureau && registre ? (
        <div className='flex max-h-auto flex-col'>
          <div className='sticky top-0 z-10 bg-white'>
            <div className='flex items-center justify-between px-6 py-3 border-b bg-white'>
              <div className='flex items-center gap-3'>
                <Link to={`/ec-bureau/${bureauId}`}>
                  <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer'>
                    <title>Retour</title>
                  </ArrowLeft>
                </Link>
                {getIconForStatutFromStats(registre.actes_estimes, registre.actes_transcrits)}
                <span className='text-base font-semibold text-gray-800'>
                  {getRegistreLabel(registre.type_acte, registre.statut_juridique)}
                </span>
                <span className='text-sm text-gray-500'>{registre.annee}</span>
                <span className='text-sm text-gray-500'>
                  enregistré à la {bureau.nom} ({bureau.departement})
                </span>
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
              {activeSection === 'Actes' ? (
                <>
                  <h2 className='text-lg font-semibold mb-4'>Actes</h2>
                  <div className='grid grid-cols-2 md:grid-cols-5 gap-4 text-sm'>
                    <StatCard label='Actes à transcrire' value={registre.actes_a_transcrire} />
                    <StatCard label='Actes transcrits' value={registre.actes_transcrits} />
                    <StatCard label='Actes à relever' value={registre.actes_a_relever} />
                    <StatCard label='Actes relevés' value={registre.actes_releves} />
                    <StatCard label='Actes estimés' value={registre.actes_estimes} />
                  </div>

                  <DataTableActes
                    actes={actesLocal}
                    actesEstimes={registre.actes_estimes}
                    onCreateActeDemanded={handleCreateActeDemanded}
                  />
                </>
              ) : activeSection === 'Actes' ? (
                <>
                  <p></p>
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
          <ActeCreateModal
            bureauId={bureau.id}
            registreId={registre.id}
            open={createActeModalOpen}
            onClose={() => {
              setCreateActeModalOpen(false);
              setNumeroActeACreer(null);
            }}
            actesExistants={registre.actes}
            numeroParDefaut={numeroActeACreer ?? ''}
            onActeCreated={handleNewActe}
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

function DataTableActes({
  actes,
  actesEstimes,
  onCreateActeDemanded,
}: {
  actes: any[];
  actesEstimes: number;
  onCreateActeDemanded: (numero: string) => void;
}) {
  // Construction des actes "visibles" (actes existants + lignes vides)
  const actesParNumero: Record<string, any> = {};
  const doublons: Record<string, any[]> = {};

  actes.forEach((a) => {
    if (!a.numero_acte) return;
    const numero = a.numero_acte;
    if (!doublons[numero]) doublons[numero] = [];
    doublons[numero].push(a);
  });

  const numerosDoublonnes: string[] = [];

  for (const numero in doublons) {
    const liste = doublons[numero];
    if (liste.length === 1) {
      actesParNumero[numero] = liste[0];
    } else {
      numerosDoublonnes.push(numero);
      // Choisir l'acte avec la date la plus ancienne (ou non vide en priorité)
      const avecDate = liste.filter((a) => a.date);
      if (avecDate.length > 0) {
        actesParNumero[numero] = avecDate.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )[0];
      } else {
        actesParNumero[numero] = liste[0]; // fallback si toutes les dates sont vides
      }
    }
  }

  const tousNumeros = actes.map((a) => parseInt(a.numero_acte)).filter((n) => !isNaN(n));
  const maxNumero = tousNumeros.length > 0 ? Math.max(...tousNumeros) : 0;
  const actesEstimesCorrige = Math.max(actesEstimes, maxNumero, 0);

  const lignesAffichees: any[] = [];

  // 1. Lignes normales
  for (let i = 1; i <= actesEstimesCorrige; i++) {
    const numeroStr = i.toString();
    lignesAffichees.push(
      actesParNumero[numeroStr] || {
        id: `__placeholder_${i}`,
        numero_acte: numeroStr,
        date: '',
        type_acte: '',
        source: '',
        label: '',
        __vide: true,
      },
    );
  }

  // 2. Ajout des doublons restants à la fin
  const doublonsSupp: any[] = [];
  for (const numero of numerosDoublonnes) {
    const liste = doublons[numero];
    const actePrincipal = actesParNumero[numero];
    const autres = liste.filter((a) => a.id !== actePrincipal.id);
    autres.forEach((a) =>
      doublonsSupp.push({
        ...a,
        __doublon: true,
      }),
    );
  }

  // Marquer les doublons à trier en fin
  doublonsSupp.forEach((a) => {
    a.__ordre = 1;
  });
  // Marquer les lignes normales
  lignesAffichees.forEach((a) => {
    a.__ordre = 0;
  });

  const toutesLignes = [...lignesAffichees, ...doublonsSupp];

  // Détection des trous dans les actes effectivement présents
  const numerosPresents = actes.map((a) => parseInt(a.numero_acte)).filter((n) => !isNaN(n));
  const trous: number[] = [];
  for (let i = 1; i <= actesEstimesCorrige; i++) {
    if (!numerosPresents.includes(i)) trous.push(i);
  }

  const columns: ColumnDef<any>[] = [
    {
      key: 'numero_acte',
      label: 'N°',
      render: (row) => row.numero_acte,
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (row.__vide ? <span className='text-gray-400 italic'>—</span> : row.date),
    },
    {
      key: 'type_acte',
      label: 'Type',
      render: (row) =>
        row.__vide ? <span className='text-gray-400 italic'>—</span> : row.type_acte,
    },
    {
      key: 'source',
      label: 'Source',
      render: (row) => (row.__vide ? <span className='text-gray-400 italic'>—</span> : row.source),
    },
    {
      key: 'label',
      label: 'Label',
      render: (row) =>
        row.__vide ? (
          <span className='text-gray-400 italic'>Aucun acte</span>
        ) : (
          <Link to={`/ec-acte/${row.id}`} className='font-medium'>
            {row.label}
          </Link>
        ),
    },
    {
      key: 'avancement',
      label: 'Avancement',
      render: (row) =>
        row.__vide ? (
          <Button
            size='sm'
            onClick={() => onCreateActeDemanded(row.numero_acte)}
            className='text-xs flex items-center gap-1'
          >
            <Plus className='w-4 h-4' />
            Créer l'acte
          </Button>
        ) : (
          <StatusPill statut={row?.statut || 'à transcrire'} />
        ),
    },
  ];

  return (
    <div className='space-y-4 mt-6'>
      {trous.length > 0 && (
        <div className='bg-yellow-50 text-yellow-900 text-sm p-3 rounded'>
          ⚠️ Trous détectés dans la numérotation :{' '}
          <span className='font-semibold'>{trous.join(', ')}</span>
        </div>
      )}
      {numerosDoublonnes.length > 0 && (
        <div className='bg-red-50 text-red-900 text-sm p-3 rounded'>
          ❗ Des doublons ont été détectés pour les numéros :
          <span className='font-semibold'> {numerosDoublonnes.join(', ')}</span>. Les actes avec un numéro en doublon sont affichés à la fin.
        </div>
      )}
      <DataTable
        data={[...toutesLignes].sort((a, b) => {
          // 1. Ordre d’affichage : doublons à la fin
          if (a.__ordre !== b.__ordre) return a.__ordre - b.__ordre;
          // 2. Puis tri par numéro
          return (a.numero_acte ?? '').localeCompare(b.numero_acte ?? '', 'fr', { numeric: true });
        })}
        columns={columns}
        title='Liste des actes'
        pageSize={-1}
      />
    </div>
  );
}
