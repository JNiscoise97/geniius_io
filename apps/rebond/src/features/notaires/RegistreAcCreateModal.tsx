// RegistreAcCreateModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import type { NotaireRegistre } from '@/types/acte';

export function RegistreAcCreateModal({
  open,
  onClose,
  notaireId,
  registresExistants,
  onRegistreCreated,
}: {
  open: boolean;
  onClose: () => void;
  notaireId: string;
  registresExistants: NotaireRegistre[] | undefined;
  onRegistreCreated?: (registre: NotaireRegistre) => void;
}) {
  const [registreCreateLoading, setRegistreCreateLoading] = useState(false);
  const [annee, setAnnee] = useState('');
  const [nombreActesEstime, setNombreActesEstime] = useState<number | null>(null);
  const [numeroActeMin, setNumeroActeMin] = useState<number | null>(1);
  const [numeroActeMax, setNumeroActeMax] = useState<number | null>(null);

  const [complet, setComplet] = useState(false);
  
  function resetForm() {
    setAnnee('');
    setNombreActesEstime(null);
    setNumeroActeMin(1);
    setNumeroActeMax(null);
    setComplet(false);
    setRegistreCreateLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className='flex flex-col p-0'
        style={{ width: '50vw', height: '95vh', maxWidth: 'none', maxHeight: 'none' }}
      >        {' '}
        <DialogHeader className='px-6 py-4 border-b shrink-0 sticky top-0 z-10'>
          <DialogTitle>Ajouter un registre</DialogTitle>
        </DialogHeader>
        <div className='flex-1 flex overflow-hidden py-4 px-10 '>
          <div className='overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='annee'>Année</Label>
              <Input
                id='annee'
                type='number'
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='nombreActesEstime'>Nombre d'actes estimé</Label>
              <Input
                id='nombreActesEstime'
                type='number'
                value={nombreActesEstime ?? ''}
                onChange={(e) =>
                  setNombreActesEstime(e.target.value ? parseInt(e.target.value) : null)
                }
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='numero_acte_min'>Numéro d’acte min.</Label>
                <Input
                  id='numero_acte_min'
                  type='number'
                  value={numeroActeMin ?? ''}
                  onChange={(e) =>
                    setNumeroActeMin(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder='ex : 1'
                />
              </div>
              <div>
                <Label htmlFor='numero_acte_max'>Numéro d’acte max.</Label>
                <Input
                  id='numero_acte_max'
                  type='number'
                  value={numeroActeMax ?? ''}
                  onChange={(e) =>
                    setNumeroActeMax(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder='ex : 128'
                />
              </div>
            </div>

            <div className='col-span-2'>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={complet}
                  onChange={(e) => setComplet(e.target.checked)}
                />
                <span>Ce registre est-il complet ?</span>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter className='px-6 py-4 border-t shrink-0 flex justify-end gap-2'>
          <Button variant='ghost' onClick={handleClose} disabled={registreCreateLoading}>
            Annuler
          </Button>
          <Button
            onClick={async () => {
              setRegistreCreateLoading(true);
              const anneeInt = parseInt(annee);

              // vérifier s'il y a un chevauchement pour cette année et ce bureau
              const conflit = registresExistants?.some((r) => {
                if (r.annee !== anneeInt) return false;
              });

              if (conflit) {
                toast.error(
                  "Un registre existe déjà pour l'année sélectionnée pour ce notaire.",
                );
                setRegistreCreateLoading(false);
                return;
              }

              try {
                const { data, error } = await supabase.from('notaire_registres').insert([
                  {
                    notaire_id: notaireId,
                    annee: parseInt(annee),
                    nombre_actes: nombreActesEstime,
                    numero_acte_min: numeroActeMin,
                    numero_acte_max: numeroActeMax,
                    complet,
                  },
                ]).select()
                  .single();

                if (error) {
                  console.error('[RegistreCreateModal] Erreur supabase :', error.message);
                  toast.error("Erreur lors de l'ajout du registre");
                } else {
                  toast.success('Registre ajouté avec succès');
                  if (onRegistreCreated && data) {
                    onRegistreCreated(data);
                  }
                  handleClose();
                }
              } catch (error) {
                console.error('[RegistreCreateModal] Erreur JS :', error);
                toast.error('Une erreur est survenue');
              } finally {
                setRegistreCreateLoading(false);
              }
            }}
            disabled={registreCreateLoading || !annee}
          >
            {registreCreateLoading ? 'Ajout en cours...' : 'Ajouter le registre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
