// ActeCreateModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DictionnaireEditorPanel,
  type DictionnaireKind,
} from '@/components/shared/DictionnaireEditorPanel';
import { toIds, toLabels } from '@/utils/dictionnaireValue';
import { ListeChipsViewSmart } from '@/components/shared/ListeChipsViewSmart';

import { formatDateToFrench, normalizeDateString, isValidDateString } from '@/utils/date';
import type { EtatCivilActe } from '@/types/etatcivil';

type ActeCreateModalProps = {
  open: boolean;
  onClose: () => void;

  bureauId: string;
  registreId: string;

  numeroParDefaut?: string | null;

  onActeCreated?: (acte: EtatCivilActe) => Promise<void> | void;
};

type DictState = {
  kind: DictionnaireKind;
  title: string;
  multi: boolean;
  defaultSelectedIds: string[];
  onValidate: (items: { id: string; code: string; label: string }[]) => Promise<void> | void;
} | null;

export function ActeCreateModal({
  open,
  onClose,
  bureauId,
  registreId,
  numeroParDefaut,
  onActeCreated
}: ActeCreateModalProps) {
  const navigate = useNavigate();

  // Form (minimal)
  const [numeroActe, setNumeroActe] = useState('');
  const [label, setLabel] = useState('');

  // Date: on conserve le comportement "champ texte intelligent"
  // date = string ISO (YYYY-MM-DD) stockée
  const [date, setDate] = useState<string>('');
  const [inputDate, setInputDate] = useState<string>('');
  const [dateError, setDateError] = useState(false);

  // Dictionnaire type acte ref
  const [typeActeRef, setTypeActeRef] = useState<{ ids: string[]; labels: string[] } | null>(null);

  // UI states
  const [creating, setCreating] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [dictArgs, setDictArgs] = useState<DictState>(null);

  useEffect(() => {
    setNumeroActe(numeroParDefaut ? String(numeroParDefaut) : '');
  }, [numeroParDefaut, open]);

  // init inputDate quand date change
  useEffect(() => {
    if (typeof date === 'string' && isValidDateString(date)) {
      setInputDate(formatDateToFrench(date));
      setDateError(false);
    }
  }, [date]);

  // Reset quand on ferme
  function reset() {
    setNumeroActe(numeroParDefaut ? String(numeroParDefaut) : '');
    setLabel('');
    setTypeActeRef(null);

    setDate('');
    setInputDate('');
    setDateError(false);

    setCreating(false);
    setDictOpen(false);
    setDictArgs(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  const currentTypeLabels = useMemo(() => toLabels(typeActeRef as any), [typeActeRef]);
  const currentTypeIds = useMemo(() => toIds(typeActeRef as any), [typeActeRef]);

  function openTypeActeDictionnaire() {
    setDictArgs({
      kind: 'type_acte_ref',
      title: 'Sélectionner le type d’acte',
      multi: false,
      defaultSelectedIds: currentTypeIds,
      onValidate: async (items) => {
        const ids = items.map((i) => i.id);
        const labels = items.map((i) => i.label);
        setTypeActeRef({ ids, labels });
        setDictOpen(false);
      },
    });
    setDictOpen(true);
  }

  function clearTypeActe() {
    setTypeActeRef(null);
  }

  function validateAndCommitDate() {
    const raw = inputDate.trim();
    if (!raw) {
      setDate('');
      setDateError(true);
      return false;
    }

    const normalized = normalizeDateString(raw);
    if (normalized && isValidDateString(normalized)) {
      setDate(normalized); // ISO
      setInputDate(formatDateToFrench(normalized));
      setDateError(false);
      return true;
    }

    setDateError(true);
    return false;
  }

  async function handleCreate() {
    const typeActeRefId = typeActeRef?.ids?.[0] ?? null;

    if (!typeActeRefId) {
      toast.error('Veuillez sélectionner un type d’acte.');
      return;
    }

    if (!label.trim()) {
      toast.error('Le label est requis.');
      return;
    }

    // commit date depuis input texte
    const okDate = validateAndCommitDate();
    if (!okDate) {
      toast.error('La date est requise (format valide).');
      return;
    }

    setCreating(true);

    const payload: Record<string, any> = {
      bureau_id: bureauId,
      registre_id: registreId,
      numero_acte: numeroActe?.trim() ? numeroActe.trim() : null,

      // Ref dictionnaire
      type_acte_ref: typeActeRefId,

      // Requis
      date, // ISO YYYY-MM-DD
      label: label.trim(),

      // Par défaut
      status: 'DRAFT',
    };

    const { data: newActe, error } = await supabase
      .from('etat_civil_actes')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      const isUnique =
        msg.includes('duplicate key') || msg.includes('unique') || msg.includes('23505');

      if (isUnique) toast.error('Un acte avec ce numéro existe déjà dans ce registre.');
      else toast.error('Erreur lors de la création de l’acte.');

      console.error('[ActeCreateModal] insert error:', error.message);
      setCreating(false);
      return;
    }

    toast.success('Acte créé');
    try {
      await onActeCreated?.(newActe as EtatCivilActe);
    } catch {
      // non bloquant
    }

    setCreating(false);
    handleClose();

    // Ajuste si ta route diffère
    navigate(`/ec-acte/edit/${newActe.id}`);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='w-full max-w-xl'>
          <DialogHeader>
            <DialogTitle>Créer un acte</DialogTitle>
            <DialogDescription>
              Minimaliste : numéro (optionnel), type (obligatoire), date (obligatoire), label
              (obligatoire).
            </DialogDescription>
          </DialogHeader>

          <div className='py-4 grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='sm:col-span-2'>
              <Label htmlFor='label'>Label</Label>
              <Textarea
                id='label'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder='Ex : Acte de naissance de Prénom NOM'
              />
              <p className='mt-1 text-xs text-muted-foreground'>Ce champ est requis.</p>
            </div>

            <div className='sm:col-span-2'>
              <Label>Type d’acte</Label>
              <ListeChipsViewSmart
                titre="Type d'acte"
                values={currentTypeLabels}
                dense
                actionsInvisible = {false}
                onEdit={openTypeActeDictionnaire}
                onDelete={clearTypeActe}
              />
              <p className='mt-1 text-xs text-muted-foreground'>Ce champ est requis.</p>
            </div>

            <div>
              <Label htmlFor='numero_acte'>Numéro d’acte</Label>
              <Input
                id='numero_acte'
                value={numeroActe}
                onChange={(e) => setNumeroActe(e.target.value)}
                placeholder='Ex : 12'
              />
              <p className='mt-1 text-xs text-muted-foreground'>Ce champ est optionnel.</p>
            </div>

            <div className='sm:col-span-2'>
              <Label htmlFor='date'>Date</Label>
              <Input
                id='date'
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                onBlur={validateAndCommitDate}
                placeholder='Ex: 10 décembre 1818 ou 29/06/1846'
                className={dateError ? 'border-red-500' : ''}
              />
              {dateError && (
                <p className='text-red-600 text-sm mt-1'>
                  Format incorrect. Essayez "29/06/1846" ou "10 décembre 1818".
                </p>
              )}
              <p className='mt-1 text-xs text-muted-foreground'>Ce champ est requis.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant='ghost' onClick={handleClose} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dictionnaire */}
      <Sheet open={dictOpen} onOpenChange={setDictOpen}>
        <SheetContent side='right' className='w-[520px] sm:w-[640px] p-0'>
          {dictArgs && (
            <DictionnaireEditorPanel
              kind={dictArgs.kind}
              title={dictArgs.title}
              multi={dictArgs.multi}
              defaultSelectedIds={dictArgs.defaultSelectedIds}
              onValidate={dictArgs.onValidate}
              onCancel={() => setDictOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default ActeCreateModal;
