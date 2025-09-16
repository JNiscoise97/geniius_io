// components/actes/SectionActeurs.tsx
import { Button } from '@/components/ui/button';
import { updateIndividuIdentiteByIndividuId } from '@/lib/individus';
import { toast } from 'sonner';

export function SectionActeurs({
  acteurs,
  roleGroupMap,
  onEdit,
  onDelete,
  onAdd,
  supabase,
  setActeurs,
}: {
  acteurs: any[];
  roleGroupMap: Record<string, string>;
  onEdit: (acteur: any) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  supabase: any;
  setActeurs: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const groupedActeurs = acteurs.reduce((acc: Record<string, any[]>, acteur) => {
    const group = roleGroupMap[acteur.role?.toLowerCase()] ?? 'Autres';
    if (!acc[group]) acc[group] = [];
    acc[group].push(acteur);
    return acc;
  }, {});

  return (
    <section>
      <h2 className='text-xl font-bold'>Acteurs liés à l’acte</h2>
      <div className='space-y-6 mt-4'>
        {acteurs.length === 0 ? (
          <div className='text-center space-y-4'>
            <p className='text-muted-foreground'>Aucun acteur n’a encore été ajouté à cet acte.</p>
            <Button variant='ghost' onClick={onAdd}>
              + Ajouter un acteur
            </Button>
          </div>
        ) : (
          Object.entries(groupedActeurs).map(([group, acteurs]) => (
            <div key={group}>
              <h3 className='text-lg font-semibold mb-2'>{group}</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
                {acteurs.map((acteur) => (
                  <div key={acteur.id} className='border rounded p-3 space-y-2 shadow-sm bg-white'>
                    <div className='font-medium'>
                      {acteur.prenom} {acteur.nom}
                    </div>
                    <div className='text-sm text-gray-600 italic'>{acteur.role}</div>
                    <div className='flex gap-2'>
                      <Button size='sm' variant='outline' onClick={() => onEdit(acteur)}>
                        Modifier
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={async () => {
                          if (confirm('Confirmer la suppression de cet acteur ?')) {
                            try {
                              // 🧠 1. Récupérer l’individu_id AVANT suppression
                              const { data: enriched, error: fetchError } = await supabase
                                .from('v_acteurs_enrichis')
                                .select('individu_id')
                                .eq('id', acteur.id)
                                .maybeSingle();

                              if (fetchError) throw fetchError;
                              const individuId = enriched?.individu_id;

                              // 🗑 2. Supprimer le mapping et l’acteur
                              await supabase
                                .from('transcription_entites_mapping')
                                .delete()
                                .eq('cible_id', acteur.id);

                              await supabase
                                .from('transcription_entites_acteurs')
                                .delete()
                                .eq('id', acteur.id);

                              // 🔁 3. Mettre à jour l'identité de l'individu, si trouvé
                              if (individuId) {
                                await updateIndividuIdentiteByIndividuId(individuId);
                              }

                              // ✅ 4. Mise à jour UI
                              setActeurs((prev) => prev.filter((a) => a.id !== acteur.id));
                              toast(`Acteur supprimé`, { icon: '🗑️', duration: 4000 });
                            } catch (err: any) {
                              toast.error(err.message ?? 'Erreur lors de la suppression');
                            }
                          }
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant='ghost' onClick={onAdd}>
                  + Ajouter un acteur
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
