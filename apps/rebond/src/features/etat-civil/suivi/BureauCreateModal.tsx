// BureauCreateModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import type { EtatCivilBureau } from '@/types/etatcivil';

function norm(s: string) {
  return (s ?? '').trim().toLocaleLowerCase();
}

export function BureauCreateModal({
  open,
  onClose,
  bureauxExistants,
  onBureauCreated,
}: {
  open: boolean;
  onClose: () => void;
  bureauxExistants: EtatCivilBureau[] | undefined;
  onBureauCreated?: (bureau: EtatCivilBureau) => void;
}) {
  const [bureauCreateLoading, setBureauCreateLoading] = useState(false);

  // ✅ inputs controlled: string (pas null)
  const [nom, setNom] = useState('');
  const [commune, setCommune] = useState('');
  const [departement, setDepartement] = useState('');
  const [region, setRegion] = useState('');

  function resetForm() {
    setNom('');
    setCommune('');
    setDepartement('');
    setRegion('');
    setBureauCreateLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // ✅ reset quand on ré-ouvre le modal (optionnel mais propre)
  useEffect(() => {
    if (open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ conflit: même nom + même commune + même département (ou région si tu préfères)
  const conflit = useMemo(() => {
    const nNom = norm(nom);
    const nCommune = norm(commune);
    const nDept = norm(departement);
    const nRegion = norm(region);

    if (!nNom || !nCommune) return false;

    return (bureauxExistants ?? []).some((r) => {
      const rNom = norm((r as any).nom ?? '');
      const rCommune = norm((r as any).commune ?? '');
      const rDept = norm((r as any).departement ?? '');
      const rRegion = norm((r as any).region ?? '');

      // 👉 règle conseillée : nom + commune + département (si département rempli)
      if (nDept) {
        return rNom === nNom && rCommune === nCommune && rDept === nDept;
      }

      // sinon fallback : nom + commune + région (si région remplie)
      if (nRegion) {
        return rNom === nNom && rCommune === nCommune && rRegion === nRegion;
      }

      // sinon minimal : nom + commune
      return rNom === nNom && rCommune === nCommune && rDept === nDept && rRegion === nRegion;
    });
  }, [bureauxExistants, nom, commune, departement, region]);

  const canSubmit = !bureauCreateLoading && norm(nom) && norm(commune);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // ✅ IMPORTANT : on ferme seulement quand nextOpen === false
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent
        className="flex flex-col p-0"
        style={{ width: '50vw', height: '95vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0 sticky top-0 z-10">
          <DialogTitle>Ajouter un bureau</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden py-4 px-10">
          <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="ex: Mairie de Sainte-Rose"
              />
            </div>

            <div>
              <Label htmlFor="commune">Commune</Label>
              <Input
                id="commune"
                type="text"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="ex: Sainte-Rose"
              />
            </div>

            <div>
              <Label htmlFor="departement">Département</Label>
              <Input
                id="departement"
                type="text"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                placeholder="ex: Guadeloupe"
              />
            </div>

            <div>
              <Label htmlFor="region">Région</Label>
              <Input
                id="region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="ex: Guadeloupe"
              />
            </div>

            {conflit ? (
              <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Un bureau avec ce nom existe déjà pour cette commune (même département/région).
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={bureauCreateLoading}>
            Annuler
          </Button>

          <Button
            onClick={async () => {
              if (!norm(nom) || !norm(commune)) return;

              // ✅ anti-doublon front
              if (conflit) {
                toast.error('Un bureau avec ce nom existe déjà pour cette commune.');
                return;
              }

              setBureauCreateLoading(true);

              try {
                const payload = {
                  nom: nom.trim(),
                  commune: commune.trim(),
                  // ✅ on envoie null si vide pour éviter de polluer la DB
                  departement: departement.trim() ? departement.trim() : null,
                  region: region.trim() ? region.trim() : null,
                };

                const { data, error } = await supabase
                  .from('etat_civil_bureaux')
                  .insert([payload])
                  .select()
                  .single();

                if (error) {
                  console.error('[BureauCreateModal] Erreur supabase :', error.message);

                  // si tu as une contrainte unique côté DB, ça tombera ici
                  toast.error("Erreur lors de l'ajout du bureau");
                  return;
                }

                toast.success('Bureau ajouté avec succès');
                if (onBureauCreated && data) {
                  onBureauCreated(data as EtatCivilBureau);
                }
                handleClose();
              } catch (error) {
                console.error('[BureauCreateModal] Erreur JS :', error);
                toast.error('Une erreur est survenue');
              } finally {
                setBureauCreateLoading(false);
              }
            }}
            disabled={!canSubmit || conflit}
          >
            {bureauCreateLoading ? 'Ajout en cours...' : 'Ajouter le bureau'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
