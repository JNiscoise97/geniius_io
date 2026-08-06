import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronRight, MoreVertical, Plus } from "lucide-react";
import { highlightLabel } from "./utils/highlight";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    createVariante as createVarianteSvc,
    createLieu as createLieuSvc,
} from '@/features/toponymes-associer/services/toponymes.rpc';
import type { ToponymeNode } from "./utils/tree";

export function TreeNodeSelect({
    node,
    selectedIds,
    onSelect,
    onAddVariante,
    onAddLieu,
    defaultLabel,
    filter,
    search,
    registerMatchRef,
    autoOpenSet,
}: {
    node: ToponymeNode;
    selectedIds: Set<string>;
    onSelect: (path: ToponymeNode[]) => void;
    onAddVariante: (parentLieuId: string, variante: ToponymeNode) => void;
    onAddLieu: (parentLieuId: string, childNode: ToponymeNode) => void;
    defaultLabel?: string;
    filter?: string;
    search?: string;
    registerMatchRef?: (el: HTMLElement | null) => void;
    autoOpenSet?: Set<string>;
}) {
    const [open, setOpen] = useState(false);
    const [addingVariante, setAddingVariante] = useState(false);
    const [addingLieu, setAddingLieu] = useState(false);
    const [newLieuLabel, setNewLieuLabel] = useState('');
    const [newLieuType, setNewLieuType] = useState<string>('maison');
    const [savingLieu, setSavingLieu] = useState(false);
    const [newLabel, setNewLabel] = useState(node.label);
    const [saving, setSaving] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const canAddVariante = node.is_principal;

    const LIEU_TYPES = ['chambre', 'maison', 'route', 'rue', 'chemin', 'établissement', 'habitation', 'section', 'quartier', 'hameau', 'paroisse', 'ville', 'commune', 'lieu-dit', 'propriete', 'entite_naturelle', 'canton', 'département', 'région', 'province', 'état', 'pays', 'continent', 'zone_informelle', 'autre'];


    const isWrapper = node.lieu_id === 'root' && node.toponyme_id === 'fake';
    const isOpen =
        isWrapper || open || !!autoOpenSet?.has(node.lieu_id) || (!!filter?.trim() && hasChildren);

    const isSearchHit = !!search?.trim() && node.label.toLowerCase().includes(search!.toLowerCase());

    async function handleCreateVariante() {
        if (!newLabel.trim()) return;
        try {
            setSaving(true);
            const { data, error } = await createVarianteSvc(node.lieu_id, newLabel.trim());

            if (error) {
                toast.error('Erreur lors de la création de la variante');
                return;
            }

            const varianteNode: ToponymeNode = {
                lieu_id: data.lieu_id,
                label: data.libelle,
                toponyme_id: data.id,
                is_principal: false,
                children: node.children, // partage les enfants du principal
                variantes: [],
                path: [],
            };

            onAddVariante(node.lieu_id, varianteNode);
            toast.success('Variante ajoutée');
            setAddingVariante(false);
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateLieu() {
        const label = newLieuLabel.trim();
        if (!label) return;

        try {
            setSavingLieu(true);

            const { topo, lieuErr, topoErr } = await createLieuSvc(
                node.lieu_id /* parent */,
                label,
                newLieuType
            );

            if (lieuErr) {
                toast.error("Erreur lors de la création du lieu");
                return;
            }
            if (topoErr || !topo) {
                toast.error("Lieu créé, mais erreur lors du toponyme principal");
                return;
            }

            const childNode: ToponymeNode = {
                lieu_id: topo.lieu_id,
                label: topo.libelle,
                toponyme_id: topo.id,
                is_principal: true,
                children: [],
                variantes: [],
                path: [],
            };

            if (!isOpen) setOpen(true);
            onAddLieu(node.lieu_id, childNode);
            toast.success('Lieu ajouté');

            setAddingLieu(false);
            setNewLieuLabel('');
            setNewLieuType('maison');
        } finally {
            setSavingLieu(false);
        }
    }


    return (
        <div className='pl-2 mt-1'>
            <div className='flex flex-col gap-1 pl-2 mt-1'>
                <div className='flex items-center gap-1'>
                    {hasChildren ? (
                        <div className='cursor-pointer text-muted-foreground' onClick={() => setOpen(!open)}>
                            {isOpen ? <ChevronDown className='w-4 h-4' /> : <ChevronRight className='w-4 h-4' />}
                        </div>
                    ) : (
                        <div className='' style={{ color: 'transparent' }}>
                            <ChevronRight className='w-4 h-4' />
                        </div>
                    )}

                    <div className='flex items-center gap-1 group'>
                        {canAddVariante && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className='p-1 rounded hover:bg-gray-100 focus:outline-none'
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label='Plus d’options'
                                    >
                                        <MoreVertical className='w-4 h-4 text-transparent group-hover:text-gray-400' />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align='start'
                                    side='bottom'
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setAddingVariante(true);
                                            setNewLabel(node.label ?? defaultLabel ?? '');
                                        }}
                                    >
                                        <Plus className='w-4 h-4' /> Ajouter une variante
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setAddingLieu(true);
                                            setOpen(true); // pour s’assurer que la zone enfants est visible
                                            setNewLieuLabel('');
                                            setNewLieuType('section');
                                        }}
                                    >
                                        <Plus className="w-4 h-4" /> Ajouter un lieu
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <div
                            ref={(el) => {
                                if (registerMatchRef && isSearchHit) registerMatchRef(el);
                            }}
                            className={`cursor-pointer px-1 rounded flex items-center gap-1 ${selectedIds.has(node.toponyme_id)
                                ? 'bg-blue-100 text-blue-800 font-semibold'
                                : 'hover:bg-gray-100'
                                }`}
                            onClick={() => {
                                onSelect(node.path);
                                if (hasChildren && !open) setOpen(true);
                            }}
                        >
                            {highlightLabel(node.label, filter ?? '', search ?? '')}
                            {selectedIds.has(node.toponyme_id) && <Check className='w-4 h-4 text-blue-800' />}
                        </div>
                    </div>
                </div>

                {/* Variantes */}
                <div className='mt-1'>
                    {node.variantes?.map((variante) => {
                        const varianteIsSearchHit =
                            !!search?.trim() && variante.label.toLowerCase().includes(search!.toLowerCase());

                        return (
                            <div
                                key={variante.toponyme_id}
                                ref={(el) => {
                                    if (registerMatchRef && varianteIsSearchHit) registerMatchRef(el);
                                }}
                                className={`ml-6 text-sm italic cursor-pointer px-1 rounded flex items-center gap-1 ${selectedIds.has(variante.toponyme_id)
                                    ? 'bg-blue-100 text-blue-800 font-semibold'
                                    : 'hover:bg-gray-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(variante.path);
                                    if (variante.children && variante.children.length > 0 && !open) setOpen(true);
                                }}
                            >
                                <MoreVertical className='w-4 h-4 text-transparent' />
                                {highlightLabel(variante.label, filter ?? '', search ?? '')}
                                <span className='text-gray-500'>(variante)</span>
                                {selectedIds.has(variante.toponyme_id) && (
                                    <Check className='w-4 h-4 text-blue-800' />
                                )}
                            </div>
                        );
                    })}

                    {canAddVariante && addingVariante && (
                        <div className='ml-6 mt-1 flex items-center gap-1'>
                            <input
                                className='border rounded px-2 py-1 text-sm'
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateVariante();
                                    if (e.key === 'Escape') setAddingVariante(false);
                                }}
                                autoFocus
                            />
                            <Button
                                className='text-xs'
                                disabled={saving || !newLabel.trim()}
                                onClick={handleCreateVariante}
                            >
                                Valider
                            </Button>
                            <Button variant='secondary' className='text-xs' onClick={() => setAddingVariante(false)}>
                                Annuler
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {(isOpen) && (
                <div className='pl-4'>
                    {node.children?.map((child) => (
                        <TreeNodeSelect
                            key={child.lieu_id}
                            node={child}
                            selectedIds={selectedIds}
                            onSelect={onSelect}
                            onAddVariante={onAddVariante}
                            onAddLieu={onAddLieu}
                            defaultLabel={node.label ?? defaultLabel}
                            filter={filter}
                            search={search}
                            registerMatchRef={registerMatchRef}
                            autoOpenSet={autoOpenSet}
                        />
                    ))}

                    {addingLieu && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input
                                className="border rounded px-2 py-1 text-sm"
                                placeholder="Libellé du lieu"
                                value={newLieuLabel}
                                onChange={(e) => setNewLieuLabel(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateLieu();
                                    if (e.key === 'Escape') setAddingLieu(false);
                                }}
                                autoFocus
                            />
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={newLieuType}
                                onChange={(e) => setNewLieuType(e.target.value)}
                            >
                                {LIEU_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <Button
                                className="text-xs"
                                disabled={savingLieu || !newLieuLabel.trim()}
                                onClick={handleCreateLieu}
                            >
                                Valider
                            </Button>
                            <Button
                                variant="secondary"
                                className="text-xs"
                                onClick={() => setAddingLieu(false)}
                            >
                                Annuler
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}