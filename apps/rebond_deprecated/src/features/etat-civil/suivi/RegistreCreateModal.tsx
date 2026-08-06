// RegistreCreateModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import type { EtatCivilRegistre } from '@/types/etatcivil';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { Field } from '@/components/shared/Fields';
import { AlertTriangle } from 'lucide-react';


type TypeActeMultiRef = { ids: string[] } | null;

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

  // --- Form state ---
  const [annee, setAnnee] = useState('');
  const [typeActeRef, setTypeActeRef] = useState<TypeActeMultiRef>(null);

  const [registreModeRef, setRegistreModeRef] = useState<string | null>(null);
  const [registreOrdreNumerotationRef, setRegistreOrdreNumerotationRef] =
    useState<string | null>(null);
  const [registreStatutJuridiqueRef, setRegistreStatutJuridiqueRef] =
    useState<string | null>(null);
  const [registreRegimeFiscalSupportRef, setRegistreRegimeFiscalSupportRef] =
    useState<string | null>(null);

  const [nombreActesEstime, setNombreActesEstime] = useState<number | null>(
    null,
  );
  const [numeroActeMin, setNumeroActeMin] = useState<number | null>(1);
  const [numeroActeMax, setNumeroActeMax] = useState<number | null>(null);

  // --- Derived ---
  const currentTypeIds = useMemo(() => typeActeRef?.ids ?? [], [typeActeRef]);

  const isValid =
    Boolean(annee) &&
    currentTypeIds.length > 0 &&
    Boolean(registreModeRef) &&
    Boolean(registreOrdreNumerotationRef);

  // --- Helpers ---
  function resetForm() {
    setAnnee('');
    setTypeActeRef(null);

    setRegistreModeRef(null);
    setRegistreOrdreNumerotationRef(null);
    setRegistreStatutJuridiqueRef(null);
    setRegistreRegimeFiscalSupportRef(null);


    setNombreActesEstime(null);
    setNumeroActeMin(1);
    setNumeroActeMax(null);

    setRegistreCreateLoading(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const hydrateTypeLabels = async (typeIds: string[]) => {
    const clean = Array.from(new Set((typeIds ?? []).map(String).filter(Boolean)));
    if (!clean.length) return [];

    const { data, error } = await supabase
      .from('ref_ec_type_acte')
      .select('id,label')
      .in('id', clean);

    if (error) throw error;

    const byId = new Map(
      (data ?? []).map((r: any) => [String(r.id), String(r.label ?? '')]),
    );

    return clean.map((id) => byId.get(id) ?? '').filter(Boolean);
  };

  const handleSubmit = async () => {
    if (registreCreateLoading) return;
    if (!isValid) return;

    setRegistreCreateLoading(true);

    try {
      const anneeInt = parseInt(annee, 10);
      if (!Number.isFinite(anneeInt)) {
        toast.error('Année invalide');
        return;
      }

      // 1) labels à partir des ids (pour type_acte legacy + conflit)
      const selectedTypeLabels = await hydrateTypeLabels(currentTypeIds);
      if (!selectedTypeLabels.length) {
        toast.error("Aucun type d’acte sélectionné");
        return;
      }

      // 2) conflit (comme avant, sur labels)
      const selectedSet = new Set(selectedTypeLabels);

      const conflit = registresExistants?.some((r) => {
        if (r.annee !== anneeInt) return false;

        const existingTypes = (r.type_acte ?? '').split('|').filter(Boolean);
        return existingTypes.some((type) => selectedSet.has(type));
      });

      if (conflit) {
        toast.error(
          'Un registre de cette année existe déjà pour le type d’acte et le statut juridique sélectionnés.',
        );
        return;
      }

      // 3) insert registre
      const { data, error } = await supabase
        .from('etat_civil_registres')
        .insert([
          {
            bureau_id: bureauId,
            annee: anneeInt,

            // legacy string (pour compat)
            type_acte: selectedTypeLabels.join('|'),

            registre_mode_ref: registreModeRef,

            registre_ordre_numerotation_ref: registreOrdreNumerotationRef,
            registre_statut_juridique_ref: registreStatutJuridiqueRef,
            registre_regime_fiscal_support_ref: registreRegimeFiscalSupportRef,

            nombre_actes_estime: nombreActesEstime,
            numero_acte_min: numeroActeMin,
            numero_acte_max: numeroActeMax,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('[RegistreCreateModal] Erreur supabase :', error.message);
        toast.error("Erreur lors de l'ajout du registre");
        return;
      }

      // 4) liaison types d’actes (table pivot)
      if (data?.id && currentTypeIds.length) {
        const rows = currentTypeIds.map((typeId) => ({
          registre_id: data.id,
          type_acte_id: typeId,
        }));

        const { error: linkErr } = await supabase
          .from('etat_civil_registres_type_acte')
          .insert(rows);

        if (linkErr) {
          console.error(
            '[RegistreCreateModal] Erreur liaison types actes:',
            linkErr.message,
          );
          toast.error(
            "Registre créé, mais erreur lors de l'association des types d'actes",
          );
        }
      }

      // 5) calcul + update label (après pivot, sinon create_registre_label ne "voit" pas les types)
      if (data?.id) {
        try {
          const { data: def, error: defErr } = await supabase.rpc('create_registre_label', {
            p_registre_id: data.id,
          });
          if (defErr) throw defErr;

          const nextLabel = String(def ?? '').trim();

          const { error: labErr } = await supabase
            .from('etat_civil_registres')
            .update({ label: nextLabel || null })
            .eq('id', data.id);

          if (labErr) throw labErr;

          // important : si tu relies `registre.label` dans l'UI, renvoie le registre MAJ
          data.label = nextLabel || null;
        } catch (e: any) {
          console.warn('[RegistreCreateModal] init label failed', e);
          // tu peux décider : non-bloquant (souvent ok) ou bloquant selon ton besoin
        }
      }

      toast.success('Registre ajouté avec succès');
      if (onRegistreCreated && data) onRegistreCreated(data);
      handleClose();
    } catch (e: any) {
      console.error('[RegistreCreateModal] Erreur JS :', e);
      toast.error('Une erreur est survenue');
    } finally {
      setRegistreCreateLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className='flex flex-col p-0'
        style={{
          width: '50vw',
          height: '95vh',
          maxWidth: 'none',
          maxHeight: 'none',
        }}
      >
        {/* Header */}
        <DialogHeader className='px-6 py-4 border-b shrink-0 sticky top-0 z-10 bg-white'>
          <DialogTitle>Ajouter un registre</DialogTitle>
        </DialogHeader>

        <div className='rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mt-3'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='h-4 w-4 mt-0.5 text-amber-700' />
            <div className='min-w-0'>
              <div className='text-sm font-semibold text-amber-900'>Chantiers en cours</div>
              <div className='mt-0.5 text-xs text-amber-800'>
                <ol>
                  <li>[MODEL] remplissage auto de "Cadre juridique et population concernée" en fonction du type d'acte</li>
                  <li>[MODEL] multi select du "Cadre juridique et population concernée"</li>
                  <li>[MODEL] corrélation entre "Cadre juridique et population concernée" et "Types d’actes"</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className='flex-1 overflow-hidden'>
          <div className='h-full overflow-y-auto px-6 py-5'>
            {/* Bloc 1 — Identification */}
            <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
              <h3 className='text-sm font-semibold text-slate-900'>
                Identification
              </h3>

              <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-3'>
                  <Field label='Année *' readonly={false} value={annee}>
                    <Input
                      inputMode='numeric'
                      value={annee}
                      onChange={(e) => setAnnee(e.target.value)}
                      placeholder='Ex. 1898'
                    />
                  </Field>
                </div>

                <div className='md:col-span-9'>
                  <div className='text-xs font-medium text-slate-700'>
                    Types d’actes *
                  </div>

                  <div className='mt-1'>
                    <RefSinglePickerSmart
                      table='ref_ec_type_acte'
                      mode='edit'
                      actionsInvisible={false}
                      multi={true}
                      value={(currentTypeIds ?? []) as any}
                      onChange={(next) => {
                        const ids = Array.isArray(next)
                          ? Array.from(
                            new Set((next as any[]).map(String).filter(Boolean)),
                          )
                          : [];
                        setTypeActeRef(ids.length ? { ids } : null);
                      }}
                      titleOverride='Types d’actes'
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bloc 2 — Logique administrative & juridique */}
            <section className='mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
              <h3 className='text-sm font-semibold text-slate-900'>
                Cadre administratif et juridique
              </h3>

              <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-12'>
                  <div className='text-xs font-medium text-slate-700'>
                    Mode de constitution du registre *
                  </div>
                  <div className='mt-1'>
                    <RefSinglePickerSmart
                      table='ref_registre_mode'
                      mode='edit'
                      actionsInvisible={false}
                      value={registreModeRef}
                      onChange={(next) =>
                        setRegistreModeRef(next ? String(next) : null)
                      }
                    />
                  </div>
                </div>

                <div className='md:col-span-12'>
                  <div className='text-xs font-medium text-slate-700'>
                    Règle d’attribution des numéros d’actes *
                  </div>
                  <div className='mt-1'>
                    <RefSinglePickerSmart
                      table='ref_registre_ordre_numerotation'
                      mode='edit'
                      actionsInvisible={false}
                      value={registreOrdreNumerotationRef}
                      onChange={(next) =>
                        setRegistreOrdreNumerotationRef(next ? String(next) : null)
                      }
                    />
                  </div>
                </div>

                <div className='md:col-span-12'>
                  <div className='text-xs font-medium text-slate-700'>
                    Cadre juridique et population concernée
                  </div>
                  <div className='mt-1'>
                    <RefSinglePickerSmart
                      table='ref_registre_statut_juridique'
                      mode='edit'
                      actionsInvisible={false}
                      value={registreStatutJuridiqueRef}
                      onChange={(next) =>
                        setRegistreStatutJuridiqueRef(next ? String(next) : null)
                      }
                    />
                  </div>
                </div>

                <div className='md:col-span-12'>
                  <div className='text-xs font-medium text-slate-700'>
                    Régime fiscal et probatoire du support
                  </div>
                  <div className='mt-1'>
                    <RefSinglePickerSmart
                      table='ref_registre_regime_fiscal_support'
                      mode='edit'
                      actionsInvisible={false}
                      value={registreRegimeFiscalSupportRef}
                      onChange={(next) =>
                        setRegistreRegimeFiscalSupportRef(next ? String(next) : null)
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bloc 3 — Volumétrie & numérotation */}
            <section className='mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
              <h3 className='text-sm font-semibold text-slate-900'>
                Volumétrie et numérotation
              </h3>

              <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-12'>
                <div className='md:col-span-4'>
                  <Field
                    label="Nombre d'actes estimé"
                    readonly={false}
                    value={nombreActesEstime ?? ''}
                  >
                    <Input
                      inputMode='numeric'
                      value={nombreActesEstime ?? ''}
                      onChange={(e) =>
                        setNombreActesEstime(
                          e.target.value ? parseInt(e.target.value, 10) : null,
                        )
                      }
                      placeholder='Ex. 120'
                    />
                  </Field>
                </div>

                <div className='md:col-span-4'>
                  <Field
                    label='Numéro d’acte min.'
                    readonly={false}
                    value={numeroActeMin ?? ''}
                  >
                    <Input
                      inputMode='numeric'
                      value={numeroActeMin ?? ''}
                      onChange={(e) =>
                        setNumeroActeMin(
                          e.target.value ? parseInt(e.target.value, 10) : null,
                        )
                      }
                      placeholder='Ex. 1'
                    />
                  </Field>
                </div>

                <div className='md:col-span-4'>
                  <Field
                    label='Numéro d’acte max.'
                    readonly={false}
                    value={numeroActeMax ?? ''}
                  >
                    <Input
                      inputMode='numeric'
                      value={numeroActeMax ?? ''}
                      onChange={(e) =>
                        setNumeroActeMax(
                          e.target.value ? parseInt(e.target.value, 10) : null,
                        )
                      }
                      placeholder='Ex. 128'
                    />
                  </Field>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className='px-6 py-4 border-t shrink-0 flex justify-end gap-2 bg-white'>
          <Button
            variant='ghost'
            onClick={handleClose}
            disabled={registreCreateLoading}
          >
            Annuler
          </Button>

          <Button
            disabled={registreCreateLoading || !isValid}
            onClick={handleSubmit}
          >
            {registreCreateLoading ? 'Ajout en cours...' : 'Ajouter le registre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
