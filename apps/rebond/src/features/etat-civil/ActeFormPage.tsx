// ActeFormPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import { supabase } from '@/lib/supabase';
import { roleGroupMap } from './PageActeEtatCivil';
import { ActeCoherence } from './ActeCoherence-complet';
import { emptyActeur } from '@/types/analyse';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SectionActeurs } from '@/components/actes/SectionActeurs';
import { DialogActeur } from '@/components/actes/DialogActeur';

const initialState = {
  label: '',
  type_acte: '',
  date: '',
  numero_acte: '',
  transcription: null as string | null,
  bureau_id: '',
  annee: new Date().getFullYear(),
  source: '',
  mentions_marginales: '',
  comparution_mairie: null as boolean | null,
  comparution_observations: '',
  contrat_mariage: '',
  enfants_legitimes: '',
  enfants_nombre: '',
};

export default function ActeFormPage() {
  const { acteId } = useParams();
  const navigate = useNavigate();
  const { fetchActeById } = useEtatCivilActesStore();
  const [formData, setFormData] = useState<{
    label: string;
    type_acte: string;
    date: string;
    numero_acte: string;
    transcription: string | null;
    bureau_id: string;
    annee: number;
    source: string;
    mentions_marginales: string;
    comparution_mairie: boolean | null;
    comparution_observations: string;
    contrat_mariage: string;
    enfants_legitimes: string;
    enfants_nombre: string;
  }>(initialState);
  const [loading, setLoading] = useState(false);
  const [acte, setActe] = useState<any>(null);

  useEffect(() => {
    if (!acteId) return;
    const loadActe = async () => {
      setLoading(true);
      const acte = await fetchActeById(acteId);
      if (acte) {
        setActe(acte);
        setFormData({
          label: acte.label ?? '',
          type_acte: acte.type_acte ?? '',
          date: acte.date?.slice(0, 10) ?? '',
          numero_acte: acte.numero_acte ?? '',
          transcription: acte.transcription ?? '',
          bureau_id: acte.bureau_id ?? '',
          annee: acte.annee ?? new Date().getFullYear(),
          source: acte.source ?? '',
          mentions_marginales: acte.mentions_marginales ?? '',
          comparution_mairie: acte.comparution_mairie ?? null,
          comparution_observations: acte.comparution_observations ?? '',
          contrat_mariage: acte.contrat_mariage ?? '',
          enfants_legitimes: acte.enfants_legitimes ?? '',
          enfants_nombre: acte.enfants_nombre ?? '',
        });
      }
      setLoading(false);
    };
    const fetchActeurs = async () => {
      // 1. Récupérer les entités liées à l’acte
      const { data: entites, error: error1 } = await supabase
        .from('transcription_entites')
        .select('id')
        .eq('acte_id', acteId);

      if (error1 || !entites) {
        console.error('Erreur étape 1 (entites):', error1);
        return;
      }

      const entiteIds = entites.map((e) => e.id);

      // 2. Récupérer les mappings
      const { data: mappings, error: error2 } = await supabase
        .from('transcription_entites_mapping')
        .select('cible_id')
        .in('entite_id', entiteIds);

      if (error2 || !mappings) {
        console.error('Erreur étape 2 (mappings):', error2);
        return;
      }

      const acteurIds = mappings.map((m) => m.cible_id);

      // 3. Récupérer les acteurs
      const { data: acteurs, error: error3 } = await supabase
        .from('transcription_entites_acteurs')
        .select('*')
        .in('id', acteurIds);

      if (error3) {
        console.error('Erreur étape 3 (acteurs):', error3);
        return;
      }

      setActeurs(acteurs || []);
    };

    fetchActeurs();

    loadActe();
  }, [acteId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const now = new Date().toISOString();
    const payload = {
      ...formData,
      annee: parseInt(formData.annee.toString(), 10),
      enfants_nombre:
        formData.enfants_nombre === '' ? null : parseInt(formData.enfants_nombre.toString(), 10),
      updated_at: now
    };
    const insertPayload = {
      ...payload,
      created_at: now
    };

    try {
      if (acteId) {
        await supabase.from('etat_civil_actes').update(payload).eq('id', acteId);
      } else {
        await supabase.from('etat_civil_actes').insert(insertPayload);
      }
      navigate('/ec-acte/' + acteId);
    } catch (err) {
      console.error('Erreur enregistrement :', err);
    } finally {
      setLoading(false);
    }
  };

  const [bureaux, setBureaux] = useState<{ id: string; nom: string }[]>([]);
  useEffect(() => {
    const fetchBureaux = async () => {
      const { data, error } = await supabase
        .from('etat_civil_bureaux')
        .select('id, nom')
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur chargement bureaux :', error.message);
      } else {
        setBureaux(data || []);
      }
    };

    fetchBureaux();
  }, []);

  const [acteurs, setActeurs] = useState<any[]>([]);

  const [selectedActeur, setSelectedActeur] = useState<any>(emptyActeur);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'edit' | 'create'>('create');

  async function editLabel(acteur: any) {
    if (!acteur || !formData.type_acte) return;

    const formatNomComplet = (p: string, n: string) => (p && n ? `${p} ${n}` : p || n);
    let tmpLabel: string;

    if (formData.type_acte === 'décès' && acteur.role === 'défunt') {
      tmpLabel = `acte de décès de ${formatNomComplet(acteur.prenom, acteur.nom)}`;
      if (formData.label !== tmpLabel) {
        const now = new Date().toISOString();
        await supabase.from('etat_civil_actes').update({ label: tmpLabel, updated_at: now }).eq('id', acteId);
        setFormData((prev) => ({ ...prev, label: tmpLabel }));
      }
    }
  }

  const allTypes = [
    'naissance',
    'reconnaissance',
    'affranchissement',
    'jugement',
    'mariage',
    'divorce',
    'décès',
    'baptême',
    'mariage religieux',
    'inhumation',
  ];

  const ROLE_ORDER = [
  'enfant',
  'époux',
  'épouse',
  'sujet',
  'père',
  'mère',
  'époux-père',
  'époux-mère',
  'épouse-père',
  'épouse-mère',
  'déclarant',
  'officier',
  'témoin 1',
  'témoin 2',
  'témoin 3',
  'témoin 4',
  'témoin',
  'mention',
  'enfant légitimé',
  'autre',
];

const orderedActeurs = [...acteurs].sort((a, b) => {
  const indexA = ROLE_ORDER.indexOf(a.role ?? 'autre');
  const indexB = ROLE_ORDER.indexOf(b.role ?? 'autre');
  return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
});

  return (
    <div className='w-[85%] mx-auto py-10 px-4 space-y-8'>
      <h1 className='text-2xl font-bold'>{acteId ? 'Modifier l’acte' : 'Créer un nouvel acte'}</h1>
      {acteId && acte?.statut != 'transcrit' && <ActeCoherence acteId={acteId} />}
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <Label htmlFor='label'>Label</Label>
          <Input
            id='label'
            name='label'
            value={formData.label}
            readOnly
            className='bg-muted cursor-not-allowed'
          />
        </div>

        <div>
          <Label htmlFor='type_acte'>Type d’acte</Label>
          <select
            name='type_acte'
            id='type_acte'
            value={formData.type_acte}
            onChange={handleChange}
            className='w-full border rounded p-2'
          >
            <option value=''>-- Sélectionner --</option>
            {allTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='date'>Date de l’acte</Label>
            <Input
              id='date'
              name='date'
              type='date'
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor='numero_acte'>Numéro d’acte</Label>
            <Input
              id='numero_acte'
              name='numero_acte'
              value={formData.numero_acte}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='annee'>Année</Label>
            <Input
              id='annee'
              name='annee'
              type='number'
              value={formData.annee}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor='bureau_id'>Bureau</Label>
            <select
              id='bureau_id'
              name='bureau_id'
              value={formData.bureau_id}
              onChange={handleChange}
              className='w-full border rounded p-2'
            >
              <option value=''>-- Sélectionner un bureau --</option>
              {bureaux.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor='source'>Source</Label>
          <Input id='source' name='source' value={formData.source} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor='transcription'>Transcription</Label>

          <ToggleGroup
            type='single'
            value={formData.transcription ?? 'null'}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                transcription: val === 'null' ? null : val,
              }))
            }
            className='grid grid-cols-3 gap-2'
          >
            <ToggleGroupItem
              value='oui'
              variant='outline'
              className='rounded-sm border-none data-[state=on]:bg-green-100 data-[state=on]:text-green-800'
            >
              Oui
            </ToggleGroupItem>
            <ToggleGroupItem
              value='non'
              variant='outline'
              className='rounded-sm border-none data-[state=on]:bg-red-100 data-[state=on]:text-red-800'
            >
              Non
            </ToggleGroupItem>
            <ToggleGroupItem
              value='null'
              variant='outline'
              className='rounded-sm border-none data-[state=on]:bg-gray-100 data-[state=on]:text-gray-600'
            >
              N/R
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div>
          <Label htmlFor='mentions_marginales'>Mentions marginales</Label>
          <Textarea
            id='mentions_marginales'
            name='mentions_marginales'
            rows={3}
            value={formData.mentions_marginales}
            onChange={handleChange}
          />
        </div>

        {formData.type_acte === 'mariage' && (
          <>
            <div>
              <Label htmlFor='comparution_mairie'>Comparution à la mairie</Label>
              <select
                id='comparution_mairie'
                name='comparution_mairie'
                value={
                  formData.comparution_mairie === true
                    ? 'true'
                    : formData.comparution_mairie === false
                      ? 'false'
                      : ''
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    comparution_mairie:
                      e.target.value === 'true' ? true : e.target.value === 'false' ? false : null,
                  }))
                }
                className='w-full border rounded p-2'
              >
                <option value=''>-- Inconnu --</option>
                <option value='true'>Oui</option>
                <option value='false'>Non</option>
              </select>
            </div>

            <div>
              <Label htmlFor='comparution_observations'>Observations sur la comparution</Label>
              <Textarea
                id='comparution_observations'
                name='comparution_observations'
                rows={2}
                value={formData.comparution_observations}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor='contrat_mariage'>Contrat de mariage</Label>
              <Input
                id='contrat_mariage'
                name='contrat_mariage'
                value={formData.contrat_mariage}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor='enfants_legitimes'>Enfants légitimés</Label>
              <Input
                id='enfants_legitimes'
                name='enfants_legitimes'
                value={formData.enfants_legitimes}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor='enfants_nombre'>Nombre d’enfants</Label>
              <Input
                id='enfants_nombre'
                name='enfants_nombre'
                type='number'
                value={formData.enfants_nombre}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <div className='pt-4'>
          <Button type='submit' disabled={loading}>
            {loading ? 'Enregistrement...' : acteId ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
      <SectionActeurs
        acteurs={orderedActeurs}
        roleGroupMap={roleGroupMap}
        supabase={supabase}
        setActeurs={setActeurs}
        onEdit={(a) => {
          setSelectedActeur(a);
          setMode('edit');
          setShowModal(true);
        }}
        onAdd={() => {
          setSelectedActeur(null);
          setMode('create');
          setShowModal(true);
        }}
        onDelete={(id) => {
          setActeurs((prev) => prev.filter((a) => a.id !== id));
        }}
      />

      <DialogActeur
        open={showModal}
        onClose={() => setShowModal(false)}
        mode={mode}
        acteur={selectedActeur}
        acteId={acteId!}
        acteDate={acte?.date}
        onSave={async (nouvelActeur) => {
          if (mode === 'edit') {
            setActeurs((prev) => prev.map((a) => (a.id === nouvelActeur.id ? nouvelActeur : a)));
          } else {
            setActeurs((prev) => [...prev, nouvelActeur]);
          }
          await editLabel(nouvelActeur);
          setShowModal(false);
        }}
      />
    </div>
  );
}
