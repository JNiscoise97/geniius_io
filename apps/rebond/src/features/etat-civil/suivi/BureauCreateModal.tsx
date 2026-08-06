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
import { supabaseRebond } from '@/lib/supabase';
import type { EtatCivilBureau } from '@/types/etatcivil';
import { Building2, MapPin, AlertTriangle } from 'lucide-react';

function norm(s: string) {
  return (s ?? '').trim().toLocaleLowerCase();
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm">
          {label} {required ? <span className="text-destructive">*</span> : null}
        </Label>
      </div>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-start gap-3 border-b px-4 py-3">
        <div className="mt-0.5 rounded-lg border bg-muted p-2 text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-medium leading-5">{title}</div>
          {subtitle ? (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
      </div>

      <div className="p-4">{children}</div>
    </div>
  );
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

  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

      if (nDept) return rNom === nNom && rCommune === nCommune && rDept === nDept;
      if (nRegion) return rNom === nNom && rCommune === nCommune && rRegion === nRegion;

      return rNom === nNom && rCommune === nCommune && rDept === nDept && rRegion === nRegion;
    });
  }, [bureauxExistants, nom, commune, departement, region]);

  const canSubmit = !bureauCreateLoading && !!norm(nom) && !!norm(commune);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent
        className="p-0 overflow-hidden"
        style={{ width: '54vw', height: '92vh', maxWidth: 'none', maxHeight: 'none' }}
      >
        {/* Header plus “marqué” */}
        <DialogHeader className="shrink-0 border-b bg-muted/40 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-lg">Ajouter un bureau</DialogTitle>
              <div className="mt-1 text-xs text-muted-foreground">
                Renseigne au minimum le <b>nom</b> et la <b>commune</b>. Département / région sont optionnels.
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-3xl space-y-4">
            {conflit ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-700">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-amber-900">
                      Doublon détecté
                    </div>
                    <div className="mt-0.5 text-xs text-amber-900/80">
                      Un bureau avec ce nom existe déjà pour cette commune (même département/région).
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <Section
              icon={<Building2 className="size-4" />}
              title="Infos principales"
              subtitle="Les champs indispensables pour identifier le bureau"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="nom"
                  label="Nom"
                  required
                  value={nom}
                  onChange={setNom}
                  placeholder="ex: Mairie de Sainte-Rose"
                />
                <Field
                  id="commune"
                  label="Commune"
                  required
                  value={commune}
                  onChange={setCommune}
                  placeholder="ex: Sainte-Rose"
                />
              </div>
            </Section>

            <Section
              icon={<MapPin className="size-4" />}
              title="Localisation"
              subtitle="Optionnel, utile pour lever les ambiguïtés"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="departement"
                  label="Département"
                  value={departement}
                  onChange={setDepartement}
                  placeholder="ex: Guadeloupe"
                />
                <Field
                  id="region"
                  label="Région"
                  value={region}
                  onChange={setRegion}
                  placeholder="ex: Guadeloupe"
                />
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Astuce : si tu remplis le <b>département</b>, c’est lui qui est utilisé pour détecter les doublons,
                sinon on se rabat sur la région.
              </div>
            </Section>
          </div>
        </div>

        {/* Footer plus net */}
        <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Champs obligatoires
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleClose} disabled={bureauCreateLoading}>
                Annuler
              </Button>

              <Button
                onClick={async () => {
                  if (!norm(nom) || !norm(commune)) return;

                  if (conflit) {
                    toast.error('Un bureau avec ce nom existe déjà pour cette commune.');
                    return;
                  }

                  setBureauCreateLoading(true);

                  try {
                    const payload = {
                      nom: nom.trim(),
                      commune: commune.trim(),
                      departement: departement.trim() ? departement.trim() : null,
                      region: region.trim() ? region.trim() : null,
                    };

                    const { data, error } = await supabaseRebond
                      .from('etat_civil_bureaux')
                      .insert([payload])
                      .select()
                      .single();

                    if (error) {
                      console.error('[BureauCreateModal] Erreur supabase :', error.message);
                      toast.error("Erreur lors de l'ajout du bureau");
                      return;
                    }

                    toast.success('Bureau ajouté avec succès');
                    if (onBureauCreated && data) onBureauCreated(data as EtatCivilBureau);
                    handleClose();
                  } catch (error) {
                    console.error('[BureauCreateModal] Erreur JS :', error);
                    toast.error('Une erreur est survenue');
                  } finally {
                    setBureauCreateLoading(false);
                  }
                }}
                disabled={!canSubmit || conflit}
                className="min-w-[180px]"
              >
                {bureauCreateLoading ? 'Ajout en cours...' : 'Ajouter le bureau'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
