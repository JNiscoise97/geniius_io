// AssocierProfessionButton.tsx
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { Search, Plus, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { fetchProfession } from '@/services/dictionnaires.rpc';
import {
  associerProfessions,
  clearProfessionBrut,
  createProfession,
  getProfessionsPreview,
} from '@/services/acteur/acteur-profession';
import { Checkbox } from '@/components/ui/checkbox';

type Props = { professionBrut: string; onSuccess?: () => void };
type RefRow = { id: string; label: string; code: string };

export function AssocierProfessionButton({ professionBrut, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [refList, setRefList] = useState<RefRow[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RefRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [createValue, setCreateValue] = useState(professionBrut);
  const [previews, setPreviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearLegacy, setClearLegacy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return refList;
    return refList.filter(
      (r) => r.label.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
  }, [refList, search]);

  const loadRef = async () => {
    const { data, error } = await fetchProfession();
    if (error) toast.error('Erreur chargement référentiel');
    setRefList(data ?? []);
  };

  const toggle = (row: RefRow) => {
    const exists = selected.find((s) => s.id === row.id);
    if (exists) {
      setSelected((prev) => prev.filter((s) => s.id !== row.id));
    } else {
      setSelected((prev) => [...prev, row]); // ordre de sélection conservé
    }
  };

  const move = (from: number, to: number) => {
    setSelected((prev) => {
      const arr = [...prev];
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      return arr;
    });
  };

  const handleCreate = async () => {
    setLoading(true);
    const label = createValue.trim();
    if (!label) {
      setLoading(false);
      return;
    }
    const { data, error } = await createProfession(label);
    setLoading(false);
    if (error) {
      toast.error('Création impossible');
      return;
    }
    toast.success('Profession créée');
    setRefList((prev) => [...(prev ?? []), data as any]);
    setSelected((prev) => [...(prev ?? []), data as any]);
    setCreating(false);
  };

  const fetchPreview = async () => {
    if (selected.length === 0) {
      toast.error('Sélection vide');
      return;
    }
    setLoading(true);
    const { data, error } = await getProfessionsPreview(professionBrut);
    setLoading(false);
    if (error) {
      toast.error('Erreur prévisualisation');
      return;
    }
    setPreviews(data ?? []);
    setStep(2);
  };

  const confirm = async () => {
    const ids = selected.map((s) => s.id);
    setLoading(true);
    const { error } = await associerProfessions(professionBrut, ids);
    if (error) {
      setLoading(false);
      toast.error('Erreur lors de l’insertion');
      return;
    }

    // vider le legacy si coché
    if (clearLegacy) {
      const { data, error: clearErr } = await clearProfessionBrut(professionBrut);
      if (clearErr) {
        toast.error("Associations ok, mais impossible de vider 'profession_brut'.");
      } else {
        toast.success(`Champ 'profession_brut' vidé (${data ?? 0} ligne(s)).`);
      }
    } else {
      toast.success('Associations enregistrées');
    }

    setLoading(false);
    setOpen(false);
    setStep(1);
    setSelected([]);
    setSearch('');
    setClearLegacy(false);
    onSuccess?.();
  };

  useEffect(() => {
    if (open) loadRef();
  }, [open]);

  const columns: ColumnDef<any>[] = [
    { key: 'acteur_nom_complet', label: 'Acteur' },
    { key: 'acte_date', label: 'Date' },
    { key: 'acte_label', label: 'Acte' },
  ];

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          setOpen(true);
        }}
      >
        Associer
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setStep(1);
          setSelected([]);
          setCreating(false);
          setCreateValue(professionBrut);
        }}
      >
        <DialogContent className='!max-w-none sm:!max-w-none w-[70vw] h-[90vh] overflow-hidden p-6 flex flex-col gap-4'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold'>
              {step === 1
                ? `Associer à une profession (${professionBrut})`
                : `Prévisualisation (${professionBrut})`}
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <>
              <div className='flex items-center justify-between gap-2'>
                {/* Recherche */}
                <div className='flex items-center gap-2'>
                  <Search className='w-4 h-4 opacity-70' />
                  <Input
                    placeholder='Rechercher…'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-64'
                  />
                  {search && (
                    <Button size='icon' variant='ghost' onClick={() => setSearch('')}>
                      <X className='w-4 h-4' />
                    </Button>
                  )}
                </div>

                {/* Créer */}
                {!creating ? (
                  <Button variant='secondary' size='sm' onClick={() => setCreating(true)}>
                    <Plus className='w-4 h-4 mr-1' /> Créer
                  </Button>
                ) : (
                  <div className='flex items-center gap-2'>
                    <Input
                      value={createValue}
                      onChange={(e) => setCreateValue(e.target.value)}
                      className='w-64'
                    />
                    <Button size='sm' onClick={handleCreate} disabled={loading}>
                      Valider
                    </Button>
                    <Button size='icon' variant='ghost' onClick={() => setCreating(false)}>
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                )}
              </div>

              {/* Liste ref + sélection ordonnée */}
              <div className='grid grid-cols-2 gap-4 h-0 min-h-[0] flex-1'>
                {/* gauche : ref filtré */}
                <div className='border rounded p-2 overflow-auto'>
                  {filtered.map((r) => (
                    <div
                      key={r.id}
                      className='flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded'
                    >
                      <span>{r.label}</span>
                      <Button variant='outline' onClick={() => toggle(r)}>
                        {selected.find((s) => s.id === r.id) ? 'Retirer' : 'Ajouter'}
                      </Button>
                    </div>
                  ))}
                </div>
                {/* droite : sélection (ordre) */}
                <div className='border rounded p-2 overflow-auto'>
                  <div className='text-sm text-muted-foreground mb-2'>Ordre d’application</div>
                  {selected.map((r, idx) => (
                    <div
                      key={r.id}
                      className='flex items-center justify-between gap-2 py-1 px-2 bg-gray-50 rounded mb-1'
                    >
                      <span className='font-medium'>
                        {idx + 1}. {r.label}
                      </span>
                      <div className='flex gap-1'>
                        <Button variant='ghost' onClick={() => idx > 0 && move(idx, idx - 1)}>
                          <ArrowLeft className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          onClick={() => idx < selected.length - 1 && move(idx, idx + 1)}
                        >
                          <ArrowRight className='w-4 h-4' />
                        </Button>
                        <Button variant='outline' onClick={() => toggle(r)}>
                          Retirer
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selected.length === 0 && (
                    <div className='text-sm text-muted-foreground'>Aucune sélection</div>
                  )}
                </div>
              </div>

              <div className='mt-auto flex justify-end gap-2'>
                <Button variant='secondary' onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={fetchPreview} disabled={selected.length === 0 || loading}>
                  Suivant
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className='flex-1 overflow-auto rounded border bg-white p-4'>
                <DataTable
                  data={previews}
                  columns={columns}
                  title=''
                  pageSize={-1}
                  defaultSort={['acte_date']}
                />
              </div>
              <div className='mt-auto flex justify-end gap-2'>
                <label className='flex items-center gap-2 text-sm'>
                  <Checkbox
                    id='clearLegacy'
                    checked={clearLegacy}
                    onCheckedChange={(v) => setClearLegacy(!!v)}
                    disabled={loading}
                  />
                  <span>
                    Vider le champ <code>profession_brut</code> après association
                  </span>
                </label>
                <div className='flex gap-2'>
                  <Button variant='secondary' onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button onClick={confirm} disabled={loading}>
                    Confirmer l’insertion
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
