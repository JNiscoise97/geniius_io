// FusionActeursModal.tsx
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
import { supabase } from '@/lib/supabase';
import type { EtatCivilRegistre } from '@/types/etatcivil';

export function RegistreCreateModal({
  open,
  onClose,
  bureauId,
  registresExistants,
  onRegistreCreated,
}: {
  open: boolean;
  onClose: () => void;
  bureauId: string;
  registresExistants: EtatCivilRegistre[] | undefined;
  onRegistreCreated?: (registre: EtatCivilRegistre) => void;
}) {
  const [registreCreateLoading, setRegistreCreateLoading] = useState(false);
  const [annee, setAnnee] = useState('');
  const [modeRegistre, setModeRegistre] = useState<'par_type' | 'chronologique_mixte'>('par_type');
  const [statutJuridique, setStatutJuridique] = useState<null | 'esclave' | 'nouveau_libre'>(null);
  const [ordreNumerotation, setOrdreNumerotation] = useState<'par_type' | 'globale'>('par_type');
  const [nombreActesEstime, setNombreActesEstime] = useState<number | null>(null);
  const [numeroActeMin, setNumeroActeMin] = useState<number | null>(1);
  const [numeroActeMax, setNumeroActeMax] = useState<number | null>(null);

  const [complet, setComplet] = useState(false);
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
  function resetForm() {
    setAnnee('');
    setSelectedTypes([]);
    setModeRegistre('par_type');
    setStatutJuridique(null);
    setOrdreNumerotation('par_type');
    setNombreActesEstime(null);
    setNumeroActeMin(1);
    setNumeroActeMax(null);
    setComplet(false);
    setRegistreCreateLoading(false);
  }

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    if (selectedTypes.length > 1) {
      setOrdreNumerotation('globale');
      setModeRegistre('chronologique_mixte');
    }
  }, [selectedTypes]);

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
            <div className='col-span-2'>
              <Label>Types d’actes</Label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2'>
                {allTypes.map((type) => {
                  const isChecked = selectedTypes.includes(type);
                  return (
                    <label key={type} className='flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        value={type}
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTypes((prev) => [...prev, type]);
                          } else {
                            setSelectedTypes((prev) => prev.filter((t) => t !== type));
                          }
                        }}
                      />
                      {type}
                    </label>
                  );
                })}
              </div>
              {selectedTypes.length > 0 && (
                <div className='mt-1 text-sm text-gray-600 italic'>
                  Sélection : {selectedTypes.join(', ')}
                </div>
              )}
            </div>
            <div className='col-span-2'>
              <Label className='block mb-2 text-sm font-medium text-gray-700'>
                Mode du registre
              </Label>
              <div className='space-y-3'>
                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='mode_registre'
                    value='par_type'
                    checked={modeRegistre === 'par_type'}
                    onChange={() => setModeRegistre('par_type')}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Par type</div>
                    <div className='text-gray-600'>
                      Le registre contient un seul type d’acte (naissance, mariage ou décès).
                    </div>
                  </div>
                </label>

                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='mode_registre'
                    value='chronologique_mixte'
                    checked={modeRegistre === 'chronologique_mixte'}
                    onChange={() => setModeRegistre('chronologique_mixte')}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Chronologique mixte</div>
                    <div className='text-gray-600'>
                      Le registre contient plusieurs types d’actes mélangés, numérotés de manière
                      unique.
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className='col-span-2'>
              <Label className='block mb-2 text-sm font-medium text-gray-700'>
                Ordre de numérotation des actes
              </Label>
              <div className='space-y-3'>
                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='ordre_numerotation'
                    value='par_type'
                    checked={ordreNumerotation === 'par_type'}
                    onChange={() => setOrdreNumerotation('par_type')}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Par type</div>
                    <div className='text-gray-600'>
                      Les numéros d’actes recommencent à 1 pour chaque type d’acte.
                    </div>
                  </div>
                </label>

                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='ordre_numerotation'
                    value='globale'
                    checked={ordreNumerotation === 'globale'}
                    onChange={() => setOrdreNumerotation('globale')}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Globale</div>
                    <div className='text-gray-600'>
                      Les actes sont numérotés de manière continue, tous types confondus.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className='col-span-2'>
              <Label className='block mb-2 text-sm font-medium text-gray-700'>
                Statut juridique
              </Label>
              <div className='space-y-3'>
                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='statut_juridique'
                    value=''
                    checked={statutJuridique === null}
                    onChange={() => setStatutJuridique(null)}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Libres</div>
                    <div className='text-gray-600'>
                      Le registre concerne des personnes libres.
                    </div>
                  </div>
                </label>

                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='statut_juridique'
                    value='esclave'
                    checked={statutJuridique === 'esclave'}
                    onChange={() => setStatutJuridique('esclave')}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Esclaves</div>
                    <div className='text-gray-600'>
                      Le registre concerne des personnes esclaves.
                    </div>
                  </div>
                </label>

                <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                  <input
                    type='radio'
                    name='statut_juridique'
                    value='nouveau_libre'
                    checked={statutJuridique === 'nouveau_libre'}
                    onChange={() => setStatutJuridique('nouveau_libre')}
                    className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                  />
                  <div className='text-sm text-gray-800'>
                    <div className='font-medium'>Nouveaux libres</div>
                    <div className='text-gray-600'>
                      Le registre concerne des personnes émancipées par le décret d'abolition de l'esclavage de 1848.
                    </div>
                  </div>
                </label>
              </div>
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
              const selectedSet = new Set(selectedTypes);

              // vérifier s'il y a un chevauchement pour cette année et ce bureau
              const conflit = registresExistants?.some((r) => {
                if (r.annee !== anneeInt) return false;
                if (r.statut_juridique !== statutJuridique) return false;

                const existingTypes = r.type_acte.split('|');
                return existingTypes.some((type) => selectedSet.has(type));
              });

              if (conflit) {
                toast.error(
                  'Un registre de cette année existe déjà pour le types d’acte et le statut juridique sélectionnés.',
                );
                setRegistreCreateLoading(false);
                return;
              }

              try {
                const { data, error } = await supabase.from('etat_civil_registres').insert([
                  {
                    bureau_id: bureauId,
                    annee: parseInt(annee),
                    type_acte: selectedTypes.join('|'),
                    mode_registre: modeRegistre,
                    statut_juridique: statutJuridique,
                    ordre_numerotation: ordreNumerotation,
                    nombre_actes_estime: nombreActesEstime,
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
            disabled={registreCreateLoading || !annee || selectedTypes.length === 0}
          >
            {registreCreateLoading ? 'Ajout en cours...' : 'Ajouter le registre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
