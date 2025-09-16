import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { formatDateToFrench, normalizeDateString, isValidDateString } from '@/utils/date';
import type { ActeBase } from '@/types/acte';

export function ActeAcCreateModal({
  open,
  onClose,
  notaireId,
  registreId,
  numeroParDefaut,
  actesExistants,
  onActeCreated,
}: {
  open: boolean;
  onClose: () => void;
  notaireId: string;
  registreId: string;
  numeroParDefaut?: string | null;
  actesExistants?: any[];
  onActeCreated?: (acte: ActeBase) => void;
}) {
  const [numeroActe, setNumeroActe] = useState('');
  const [date, setDate] = useState('');
  const [source, setSource] = useState<'ANOM' | 'AD_971'>('ANOM');
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (numeroParDefaut) setNumeroActe(numeroParDefaut);
  }, [numeroParDefaut]);

  function resetForm() {
    setNumeroActe('');
    setDate('');
    setSource('ANOM');
    setLabel('');
    setCreating(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleCreate() {
  if (!numeroActe || !date || !label) {
    toast.error('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const conflit = actesExistants?.some(
    (a) => a.numero_acte === numeroActe && a.registre_id === registreId,
  );

  if (conflit) {
    toast.error('Un acte avec ce numéro existe déjà dans ce registre.');
    return;
  }

  setCreating(true);
  const now = new Date().toISOString();

  const { data: newActe, error } = await supabase
    .from('actes')
    .insert([
      {
        notaire_registre_id: registreId,
        numero_acte: numeroActe,
        source,
        label,
        statut: 'brouillon',
        created_at: now,
      },
    ])
    .select()
    .single();

  if (error || !newActe) {
    console.error('[ActeCreateModal] Erreur supabase :', error?.message);
    toast.error("Erreur lors de la création de l'acte");
    setCreating(false);
    return;
  }

  // ✅ Alimenter actes_notaires
  const { error: errorActesNotaires } = await supabase.from('actes_notaires').insert([
    {
      acte_id: newActe.id,
      notaire_id: notaireId,
      role: 'principal',
    },
  ]);

  if (errorActesNotaires) {
    console.error('[ActeCreateModal] Erreur actes_notaires :', errorActesNotaires.message);
    toast.error("Erreur lors de l'association avec le notaire");
    setCreating(false);
    return;
  }

  // ✅ Alimenter seances
  const { error: errorSeance } = await supabase.from('seances').insert([
    {
      acte_id: newActe.id,
      date: { exact: date }, // ISO format déjà normalisé
    },
  ]);

  if (errorSeance) {
    console.error('[ActeCreateModal] Erreur seances :', errorSeance.message);
    toast.error("Erreur lors de l'enregistrement de la séance");
    setCreating(false);
    return;
  }

  toast.success('Acte créé avec succès');
  if (onActeCreated) onActeCreated(newActe);
  handleClose();
  setCreating(false);
}


  // date : string (ISO)
  // inputValue : string affichée dans le champ texte
  const [inputDate, setInputDate] = useState(() =>
    typeof date === 'string' && isValidDateString(date) ? formatDateToFrench(date) : (date ?? ''),
  );
  const [dateError, setDateError] = useState(false);

  useEffect(() => {
    if (typeof date === 'string' && isValidDateString(date)) {
      setInputDate(formatDateToFrench(date));
      setDateError(false);
    }
  }, [date]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='w-full max-w-xl'>
        <DialogHeader>
          <DialogTitle>Ajouter un acte</DialogTitle>
        </DialogHeader>

        <div className='py-4 grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='numero_acte'>Numéro d’acte</Label>
            <Input
              id='numero_acte'
              value={numeroActe}
              onChange={(e) => setNumeroActe(e.target.value)}
              placeholder='Ex : 12'
            />
          </div>
          
          <div className='col-span-2'>
            <Label htmlFor='date'>Date</Label>
            <Input
              id='date'
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              onBlur={() => {
                const normalized = normalizeDateString(inputDate);
                if (normalized && isValidDateString(normalized)) {
                  setDate(normalized); // format ISO
                  setInputDate(formatDateToFrench(normalized));
                  setDateError(false);
                } else if (!inputDate.trim()) {
                  setDate('');
                  setDateError(false);
                } else {
                  setDateError(true);
                }
              }}
              placeholder='Ex: 10 décembre 1818 ou 29/06/1846'
              className={dateError ? 'border-red-500' : ''}
            />
            {dateError && (
              <p className='text-red-600 text-sm mt-1'>
                Format incorrect. Essayez "29/06/1846" ou "10 décembre 1818".
              </p>
            )}
          </div>

          <div className='sm:col-span-2'>
            <Label className='block mb-2 text-sm font-medium text-gray-700'>Source de l’acte</Label>
            <div className='space-y-3'>
              <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                <input
                  type='radio'
                  name='source'
                  value='ANOM'
                  checked={source === 'ANOM'}
                  onChange={() => setSource('ANOM')}
                  className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                />
                <div className='text-sm text-gray-800'>
                  <div className='font-medium'>ANOM</div>
                  <div className='text-gray-600'>
                    Archives nationales d’outre-mer (www.anom.archivesnationales.culture.gouv.fr)
                  </div>
                </div>
              </label>

              <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                <input
                  type='radio'
                  name='source'
                  value='AD_971'
                  checked={source === 'AD_971'}
                  onChange={() => setSource('AD_971')}
                  className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                />
                <div className='text-sm text-gray-800'>
                  <div className='font-medium'>AD de la Guadeloupe</div>
                  <div className='text-gray-600'>
                    Archives départementales de la Guadeloupe (archives.guadeloupe.fr)
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className='sm:col-span-2'>
            <Label htmlFor='label'>Résumé ou label</Label>
            <Textarea
              id='label'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={handleClose} disabled={creating}>
            Annuler
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Création en cours...' : 'Créer l’acte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
