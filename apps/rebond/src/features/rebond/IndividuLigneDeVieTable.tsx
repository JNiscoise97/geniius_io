//IndividuLigneDeVieTable.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'react-router-dom';
import {
  DataTable,
  highlightMatch,
  type ColumnDef,
  type Filtre,
} from '@/components/shared/DataTable';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { deleteActeurIndividuRelation } from '@/lib/fusionActeurs';
import { StatusPill } from '../../components/shared/StatusPill';

interface LigneDeVieRow {
  acteId: string;
  sourceTable: string;
  acteLabel: string;
  acteStatut: string;
  acteNumero: string;
  acteType: string;
  bureauNom?: string;
  date: string;

  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  age: string;

  qualite: string;
  profession_brut: string;
  statut_brut: string;
  fonction: string;
  filiation: string;
  domicile: string;
  origine: string;
  role: string;
  lien: string;
  note: string;

  signature: string;
  signature_libelle: string;

  // Champs notaire (actes notariés uniquement)
  notaire?: string;
  notaireId?: string;
  notaireNom?: string;
  notairePrenom?: string;
  notaireTitre?: string;
  notaireLieuExercice?: string;
}

const defaultVisibleColumns: string[] = [
  'date',
  'acteLabel',
  'bureauNom',
  'qualite',
  'nom',
  'prenom',
  'age',
  'profession_brut',
  'statut_brut',
  'role',
  'lien',
  'dissocier',
];

export default function IndividuLigneDeVieTable({
  enrichis,
  visibleColumns,
  pageSize,
  title,
  appliedFiltres,
}: {
  enrichis?: any[] | null;
  visibleColumns?: string[];
  pageSize?: number;
  title?: string;
  appliedFiltres?: Filtre[];
}) {
  const { individuId } = useParams();
  const [rows, setRows] = useState<LigneDeVieRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteMentionLoadingId, setDeleteMentionLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const processData = async () => {
    setLoading(true);
    let data = enrichis;

    if (!data && individuId) {
      const result = await supabase
        .from('v_acteurs_enrichis')
        .select('*')
        .eq('individu_id', individuId);
      data = result.data ?? [];
    }

    if (!data || data.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const fullRows: LigneDeVieRow[] = data.map((acteur) => ({
      acteId: acteur.acte_id,
      sourceTable: acteur.source_table,
      acteLabel: acteur.acte_label || '',
      acteNumero: acteur.numero_acte || '',
      acteStatut: acteur.acte_statut || '',
      acteType:
        acteur.source_table == 'actes'
          ? 'acte notarié'
          : acteur.source_table == 'etat_civil_actes'
            ? "acte d'état-civil"
            : '',
      bureauNom: acteur.bureau_nom || '',
      date: acteur.acte_date || '',
      id: acteur.id,
      nom: acteur.nom,
      prenom: acteur.prenom,
      sexe: acteur.sexe,
      age: acteur.est_vivant || acteur.role === 'défunt' ? acteur.age : '†',
      qualite: acteur.qualite,
      profession_brut: acteur.profession_brut,
      statut_brut: acteur.statut_brut,
      fonction: acteur.fonction,
      filiation: acteur.filiation,
      domicile: acteur.domicile,
      origine: acteur.origine,
      role: acteur.role,
      lien: acteur.lien,
      note: acteur.note,
      signature: acteur.signature,
      signature_libelle: acteur.signature_libelle,
      notaireId: acteur.notaire_id,
      notaireNom: acteur.notaire_nom,
      notairePrenom: acteur.notaire_prenom,
      notaireTitre: acteur.notaire_titre,
      notaireLieuExercice: acteur.notaire_lieu_exercice,
      notaire: [acteur.notaire_titre, acteur.notaire_nom, acteur.notaire_prenom]
        .filter(Boolean)
        .join(' '),
    }));

    fullRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setRows(fullRows);
    setLoading(false);
  };

  const allColumns: ColumnDef<LigneDeVieRow>[] = [
    { key: 'date', label: 'Date' },
    {
      key: 'acteLabel',
      label: 'Acte',
      render: (row) => {
        const base = row.sourceTable === 'etat_civil_actes' ? 'ec-acte' : 'ac-acte';
        return (
          <a
            href={`/${base}/${row.acteId}`}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 hover:text-indigo-600'
          >
            <Navigation className='w-4 h-4 opacity-70' />
            {highlightMatch(row.acteLabel ?? '', search)}
          </a>
        );
      },
    },
    {
      key: 'acteRaccourci',
      label: "Raccourci vers l'acte",
      render: (row) => {
        const base = row.sourceTable === 'etat_civil_actes' ? 'ec-acte' : 'ac-acte';
        return (
          <a
            href={`/${base}/${row.acteId}`}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 hover:text-indigo-600'
          >
            <Navigation className='w-4 h-4 opacity-70' />
          </a>
        );
      },
    },
    { key: 'acteNumero', label: "Numéro d'acte" },
    {
      key: 'acteStatut',
      label: "Statut de l'acte",
      render: (row) => {
        return (
          <button>
            <StatusPill statut={row.acteStatut || 'à transcrire'} />
          </button>
        );
      },
    },
    { key: 'acteType', label: "Type d'acte" },
    { key: 'bureauNom', label: "Bureau d'état-civil" },
    { key: 'sourceTable', label: 'Source' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'sexe', label: 'Sexe' },
    { key: 'age', label: 'Âge' },
    { key: 'qualite', label: 'Qualité' },
    { key: 'profession_brut', label: 'Profession' },
    { key: 'statut_brut', label: 'Statut' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'filiation', label: 'Filiation' },
    { key: 'domicile', label: 'Domicile' },
    { key: 'origine', label: 'Origine' },
    { key: 'role', label: 'Rôle' },
    { key: 'lien', label: 'Lien' },
    { key: 'note', label: 'Note' },
    { key: 'signature', label: 'Signature?' },
    { key: 'signature_libelle', label: 'Libellé de la signature' },
    { key: 'notaire', label: 'Notaire' },
    {
      key: 'dissocier',
      label: 'Dissocier',
      render: (row) => {
        return (
          <Button
            size='sm'
            variant='ghost'
            className='text-xs text-red-500 hover:text-red-700 flex items-center gap-1'
            onClick={async () => {
              if (confirm('Confirmer la suppression de cette mention ?')) {
                setDeleteMentionLoadingId(row.id);
                try {
                  await deleteActeurIndividuRelation(row.id, individuId);
                  toast('Mention dissociée', {
                    icon: '🗑️',
                    duration: 4000,
                  });
                  await processData(); // 🔁 recharge le tableau
                } catch (error) {
                  console.error(
                    `[Dissociation] Erreur pour acteurId=${row.id}, individuId=${individuId}`,
                    error,
                  );
                  toast.error('Une erreur est survenue pendant la dissociation');
                } finally {
                  setDeleteMentionLoadingId(null);
                }
              }
            }}
            disabled={deleteMentionLoadingId === row.id}
          >
            {deleteMentionLoadingId === row.id ? 'Dissociation en cours...' : 'Dissocier'}
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    processData();
  }, [enrichis, individuId]);

  if (loading) return <p className='text-muted-foreground'>Chargement...</p>;

  return (
    <div className='space-y-4'>
      <DataTable
        title={title ? title : "Ligne de vie de l'individu"}
        data={rows}
        columns={allColumns}
        defaultVisibleColumns={visibleColumns ?? defaultVisibleColumns}
        pageSize={pageSize ?? 15}
        search={search}
        initialFiltres={appliedFiltres}
        onSearchChange={setSearch}
      />
    </div>
  );
}
