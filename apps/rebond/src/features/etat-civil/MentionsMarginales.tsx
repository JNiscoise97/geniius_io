import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import type { MentionMarginale } from '@/store/actes';
import {
  apiCreateMentionMarginale,
  apiDeleteMentionMarginale,
  apiListMentionsMarginales,
  apiUpdateMentionMarginale,
  type MentionMarginaleWithCible,
} from '@/services/acte.api';

// ⚠️ Adapte ces imports si besoin selon ton arborescence
// L'éditeur doit appeler onSaveSelection(nodes) avec le chemin sélectionné
// et idéalement exposer les labels pour construire une "breadcrumb" texte.
import { LieuEditorPanel } from '@/components/shared/LieuEditorPanel';
import type { ToponymeNode } from '@/features/toponymes-associer/utils/tree';
import { toast } from 'sonner';
import {
  formatDateToNumericFrench,
  isValidDateString,
  normalizeDateString,
  formatDateToFrench,
} from '@/utils/date';
import { Navigation, Pen, Trash2 } from 'lucide-react';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';

export function MentionsMarginales({ acteId }: { acteId: string }) {
  const [rows, setRows] = useState<MentionMarginaleWithCible[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MentionMarginale | null>(null);

  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState(false);

  // Sheet du picker de lieu
  const [openLieu, setOpenLieu] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      key: 'type',
      label: 'Type',
      render: (row) =>
        row.type_mention == 'reconnaissance-pere'
          ? 'reconnaissance par son père'
          : row.type_mention == 'reconnaissance-mere'
            ? 'reconnaissance par sa mère'
            : row.type_mention,
      columnWidth: '15%',
    },
    {
      key: 'lieu',
      label: 'Lieu',
      render: (row) => `${row.lieu_texte ?? ''}`,
      columnWidth: '20%',
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (row.date_acte ? formatDateToNumericFrench(row.date_acte) : ''),
      columnWidth: '10%',
    },
    {
      key: 'acte',
      label: 'Acte lié',
      render: (row) =>
        row.acte_id_cible ? (
          <a
            href={`/ec-acte/${row.acte_id_cible}`}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 hover:text-indigo-600'
          >
            <Navigation className='w-4 h-4 opacity-70' />
            {row.cible?.label ?? '—'}
          </a>
        ) : (
          ''
        ),
      columnWidth: '35%',
    },
    {
      key: 'source',
      label: 'Source',
      render: (row) => row?.source ?? '—',
      columnWidth: '10%',
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className='flex justify-end gap-2'>
          <Button variant='outline' size='icon' onClick={() => startEdit(row)}>
            <Pen className='w-4 h-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='text-red-500 hover:text-red-600'
            onClick={() => onDelete(row)}
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      ),
      columnWidth: '10%',
    },
  ];

  useEffect(() => {
    if (editing) {
      // on alimente l'input en FR à partir de la valeur ISO de l’édition
      setDateInput(formatDateToFrench(editing.date_acte ?? ''));
      setDateError(false);
    } else {
      setDateInput('');
      setDateError(false);
    }
  }, [editing?.id, open]);

  const load = async () => setRows(await apiListMentionsMarginales(acteId));
  useEffect(() => {
    load();
  }, [acteId]);

  const startAdd = () => {
    setEditing({ acte_id: acteId, type_mention: 'autre' });
    setOpen(true);
  };

  const startEdit = (row: MentionMarginaleWithCible) => {
    const { cible, ...base } = row;
    setEditing(base);
    setOpen(true);
  };

  const onDelete = async (row: MentionMarginale) => {
    await apiDeleteMentionMarginale(row.id!);
    await load();
  };

  const onSave = async () => {
    if (!editing) return;
    if (editing.id) await apiUpdateMentionMarginale(editing.id, editing);
    else await apiCreateMentionMarginale(editing);
    setOpen(false);
    await load();
  };

  // ---- Lieu structuré (Toponyme) ----

  const openToponymePicker = () => setOpenLieu(true);

  const clearToponyme = () => {
    if (!editing) return;
    setEditing({ ...editing, lieu_toponyme_id: null /* on garde le texte libre */ });
  };

  // Construit un label "chemin" lisible à partir des nodes retournés par le picker
  function buildPathLabel(nodes: ToponymeNode[]): string {
    // Essaie plusieurs propriétés possibles selon ton implémentation
    const parts = nodes
      .map((n: any) => n.label ?? n.toponyme_libelle ?? n.name ?? n.libelle)
      .filter(Boolean);
    return parts.join(' > ');
  }

  const handleLieuSave = (nodes: ToponymeNode[]) => {
    if (!editing || nodes.length === 0) {
      setOpenLieu(false);
      return;
    }
    const leaf = nodes[nodes.length - 1] as any;
    const leafId = leaf.toponyme_id ?? leaf.id; // selon ton modèle
    const pathText = buildPathLabel(nodes);

    setEditing({
      ...editing,
      lieu_toponyme_id: leafId,
      // Option : si tu veux pré-remplir le champ texte avec le chemin lisible
      // commente si tu préfères garder un texte libre différent
      lieu_texte:
        editing.lieu_texte && editing.lieu_texte.length > 0 ? editing.lieu_texte : pathText,
    });
    setOpenLieu(false);
  };

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-medium'>Mentions marginales</h3>
        <Button onClick={startAdd}>Ajouter</Button>
      </div>

      {/* Tableau simple */}
      {(!rows || rows.length == 0) && <p className='text-muted-foreground'>Aucune mention</p>}
      {rows && rows.length > 0 && (
        <DataTable
          title=''
          data={rows}
          columns={columns}
          defaultVisibleColumns={['type', 'lieu', 'date', 'acte', 'source', 'actions']}
          pageSize={-1}
          showMenu={false}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='!max-w-none sm:!max-w-none w-[70vw] h-[90vh] overflow-hidden p-0 flex flex-col'>
          <DialogHeader className='px-6 pt-6 pb-4 border-b'>
            <DialogTitle>{editing?.id ? 'Modifier la mention' : 'Ajouter une mention'}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className='px-6 py-4 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4'>
              {/* Type (1/3) */}
              <div className='md:col-span-4'>
                <Label>Type de mention</Label>
                <Select
                  value={editing.type_mention}
                  onValueChange={(v) =>
                    setEditing({ ...editing, type_mention: v as MentionMarginale['type_mention'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Choisir…' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='mariage'>Mariage</SelectItem>
                    <SelectItem value='divorce'>Divorce</SelectItem>
                    <SelectItem value='deces'>Décès</SelectItem>
                    <SelectItem value='reconnaissance-pere'>Reconnaissance par son père</SelectItem>
                    <SelectItem value='reconnaissance-mere'>Reconnaissance par sa mère</SelectItem>
                    <SelectItem value='adoption'>Adoption</SelectItem>
                    <SelectItem value='rectification'>Rectification</SelectItem>
                    <SelectItem value='annulation'>Annulation</SelectItem>
                    <SelectItem value='autre'>Autre</SelectItem>
                    <SelectItem value='texte_brut'>Texte brut</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date (1/3) */}
              {/* Date (1/3) — saisie libre FR + normalisation */}
              <div className='md:col-span-4'>
                <Label>Date de l’acte</Label>
                <Input
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  onBlur={() => {
                    const normalized = normalizeDateString(dateInput);
                    if (normalized && isValidDateString(normalized)) {
                      // on stocke en ISO dans editing.date_acte
                      setEditing({ ...editing!, date_acte: normalized });
                      setDateError(false);
                      // on reformate l'affichage en JJ/MM/AAAA (propre)
                      setDateInput(formatDateToFrench(normalized));
                    } else if (!dateInput.trim()) {
                      // champ vidé par l'utilisateur -> pas d'erreur, on efface la valeur
                      setEditing({ ...editing!, date_acte: null });
                      setDateError(false);
                    } else {
                      // saisie incorrecte -> on n'écrase pas la saisie, on marque l'erreur
                      setEditing({ ...editing!, date_acte: null });
                      setDateError(true);
                    }
                  }}
                  placeholder='Ex: 29/10/1946'
                  className={dateError ? 'border-red-500' : ''}
                />
                {dateError && (
                  <p className='text-red-600 text-sm mt-1'>
                    Format de date incorrect. Utilisez par exemple "29/10/1946" ou "29.06.1846".
                  </p>
                )}
              </div>

              {/* Numéro (1/3) */}
              <div className='md:col-span-4'>
                <Label>Numéro d’acte</Label>
                <Input
                  value={editing.numero_acte ?? ''}
                  onChange={(e) => setEditing({ ...editing, numero_acte: e.target.value || null })}
                />
              </div>

              {/* Lieu — full width */}
              <div className='md:col-span-12 grid gap-3 border rounded-md p-4'>
                <div className='flex items-center justify-between'>
                  <Label className='text-base'>Lieu</Label>
                  <div className='flex gap-2'>
                    <Button type='button' variant='outline' onClick={openToponymePicker}>
                      {editing.lieu_toponyme_id ? 'Modifier (structuré)…' : 'Choisir (structuré)…'}
                    </Button>
                    {editing.lieu_toponyme_id && (
                      <Button type='button' variant='ghost' onClick={clearToponyme}>
                        Utiliser un texte libre
                      </Button>
                    )}
                  </div>
                </div>

                {/* Structuré (badge + id + breadcrumb si tu mets editing.lieu_texte) */}
                <div className='text-sm'>
                  {editing.lieu_toponyme_id ? (
                    <div className='flex items-center gap-2'>
                      <span className='inline-flex items-center rounded px-1.5 py-0.5 text-xs border'>
                        structuré
                      </span>
                      <code className='px-1.5 py-0.5 rounded bg-muted'>
                        {editing.lieu_toponyme_id}
                      </code>
                      {editing.lieu_texte && (
                        <span className='text-muted-foreground'>({editing.lieu_texte})</span>
                      )}
                    </div>
                  ) : (
                    <span className='text-muted-foreground'>Aucun lieu structuré sélectionné</span>
                  )}
                </div>

                {/* Texte libre — désactivé si un structuré est en place */}
                <div className='grid gap-1'>
                  <Label>Lieu (texte)</Label>
                  <Input
                    placeholder='Saint-Denis, La Réunion…'
                    value={editing.lieu_texte ?? ''}
                    onChange={(e) => setEditing({ ...editing, lieu_texte: e.target.value || null })}
                    disabled={!!editing.lieu_toponyme_id}
                    className={editing.lieu_toponyme_id ? 'bg-muted cursor-not-allowed' : ''}
                  />
                  <p className='text-xs text-muted-foreground'>
                    {editing.lieu_toponyme_id
                      ? 'Le texte est piloté par le lieu structuré. Cliquez sur “Utiliser un texte libre” pour le modifier.'
                      : 'A défaut de lieu structuré, le texte libre sera utilisé.'}
                  </p>
                </div>
              </div>

              {/* Acte cible — full width */}
              <div className='md:col-span-12'>
                <Label>Acte cible</Label>
                <div className='flex gap-2'>
                  <Input
                    className='flex-1'
                    placeholder='ID d’acte (ou utilise le sélecteur)…'
                    value={editing.acte_id_cible ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, acte_id_cible: e.target.value || null })
                    }
                  />
                </div>
              </div>

              {/* Texte brut — full width, étiré */}
              <div className='md:col-span-12'>
                <Label>Texte brut (copie de la marge)</Label>
                <Textarea
                  rows={6}
                  className='min-h-[140px]'
                  value={editing.texte_brut ?? ''}
                  onChange={(e) => setEditing({ ...editing, texte_brut: e.target.value || null })}
                />
              </div>

              {/* Source — full width */}
              <div className='md:col-span-12'>
                <Label className='block mb-2 text-sm font-medium text-gray-700'>
                  Source de l’acte
                </Label>
                <div className='space-y-3'>
                  <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                    <input
                      type='radio'
                      name='source'
                      value='ANOM'
                      checked={editing.source === 'ANOM'}
                      onChange={() => setEditing({ ...editing, source: 'ANOM' })}
                      className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                    />
                    <div className='text-sm text-gray-800'>
                      <div className='font-medium'>ANOM</div>
                      <div className='text-gray-600'>
                        Archives nationales d’outre-mer
                        (www.anom.archivesnationales.culture.gouv.fr)
                      </div>
                    </div>
                  </label>

                  <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                    <input
                      type='radio'
                      name='source'
                      value='AD_971'
                      checked={editing.source === 'AD_971'}
                      onChange={() => setEditing({ ...editing, source: 'AD_971' })}
                      className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                    />
                    <div className='text-sm text-gray-800'>
                      <div className='font-medium'>AD de la Guadeloupe</div>
                      <div className='text-gray-600'>
                        Archives départementales de la Guadeloupe (archives.guadeloupe.fr)
                      </div>
                    </div>
                  </label>

                  <label className='flex items-start space-x-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer'>
                    <input
                      type='radio'
                      name='source'
                      value='Quénéhervé'
                      checked={editing.source === 'Quénéhervé'}
                      onChange={() => setEditing({ ...editing, source: 'Quénéhervé' })}
                      className='mt-1 h-4 w-4 text-blue-600 border-gray-300'
                    />
                    <div className='text-sm text-gray-800'>
                      <div className='font-medium'>Relevés de M. QUENEHERVE</div>
                      <div className='text-gray-600'>
                        Relevé des registres des esclaves par M. QUENEHERVE
                        (https://nos-ancetres-esclaves-guadeloupeens.webnode.fr/portfolio/)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Note — 1/2 si tu veux, sinon full width */}
              <div className='md:col-span-12'>
                <Label>Note</Label>
                <Input
                  value={editing.note ?? ''}
                  onChange={(e) => setEditing({ ...editing, note: e.target.value || null })}
                />
              </div>
            </div>
          )}

          <DialogFooter className='px-6 py-4 mt-auto border-t'>
            <Button
              onClick={async () => {
                // Validation "lieu structuré OU texte"
                const hasLieu = !!editing?.lieu_toponyme_id || !!editing?.lieu_texte?.trim();
                if (!hasLieu) {
                  toast?.error?.('Renseigner un lieu (structuré ou texte).');
                  return;
                }
                await onSave();
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet: Picker Toponyme */}
      <Sheet open={openLieu} onOpenChange={setOpenLieu}>
        <SheetContent side='right' className='w-full sm:max-w-[720px]'>
          <SheetHeader>
            <SheetTitle>Choisir un lieu</SheetTitle>
          </SheetHeader>

          {/* ⚠️ Adapte les props de LieuEditorPanel à ton implémentation */}
          <div className='mt-4'>
            <LieuEditorPanel
              title='Choisir un lieu'
              onCancel={() => setOpenLieu(false)}
              onSaveSelection={handleLieuSave}
            />
            <div className='mt-4 flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setOpenLieu(false)}>
                Annuler
              </Button>
              {/* Le bouton "Enregistrer" est géré par LieuEditorPanel via onSaveSelection */}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
