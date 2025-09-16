// ActeEdit.tsx
import { AlertTriangle, ArrowLeft, FileText, Save, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { EtatCivilBureau, EtatCivilRegistre } from '@/types/etatcivil';
import { useEtatCivilStore } from '@/store/etatcivil';
import { getRegistreLabel } from './BureauRegistres';
import { ActeCoherence, getErrorsForActe, type Incoherence } from '../ActeCoherence-complet';
import { getIconForStatut } from '@/features/actes/transcription/constants/statutConfig';
import { Badge } from '@/components/ui/badge';
import { ActeForm, type ActeFormHandle } from './ActeForm';
import { DialogActeur } from '@/components/actes/DialogActeur';
import { emptyActeur } from '@/types/analyse';
import { ActeursAccordion } from '@/features/notaires/ActeursAccordion';
import { Button } from '@/components/ui/button';
import type { RelationPreview } from '@/types/relations-acteurs';
import {
  apiDeleteActeurCascade,
  apiFetchActeursEnrichis,
  apiFetchRelationsForActeId,
  apiUpdateActeLabel,
} from '@/services/acte.api';

const tabs = [{ label: 'Acte', icon: FileText }];

export default function ActeEdit() {
  const { acteId } = useParams();
  const navigate = useNavigate();

  const { acte, entites, fetchActeDetail } = useEtatCivilActesStore();
  const fetchRegistre = useEtatCivilStore((s) => s.fetchRegistre);
  const fetchBureau = useEtatCivilStore((s) => s.fetchBureau);

  const [activeSection, setActiveSection] = useState(tabs[0].label);
  const [registre, setRegistre] = useState<EtatCivilRegistre | null>(null);
  const [bureau, setBureau] = useState<EtatCivilBureau | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [acteurs, setActeurs] = useState<any[]>([]);
  const [selectedActeur, setSelectedActeur] = useState<any>(emptyActeur);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'edit' | 'create'>('create');
  const acteursAccordionRef = useRef<{ refreshEntities: () => void }>(null);
  const [erreurs, setErreurs] = useState<Incoherence[]>([]);
  const [relations, setRelations] = useState<RelationPreview[]>([]);
  const acteFormRef = useRef<ActeFormHandle & { isDirty?: () => boolean }>(null);

  const [saving, setSaving] = useState(false);
  const [blockNav, setBlockNav] = useState(false); // garde de sortie

  // --- Helpers diff ----------------------------------------------------------

  const isFormDirty = () => {
    return Boolean(acteFormRef.current?.isDirty?.());
  };

  // --- Reset à chaque changement d'acteId -----------------------------------

  useEffect(() => {
    if (!acteId) return;
    useEtatCivilActesStore.setState({ acte: null, entites: [] });
  }, [acteId]);

  // --- Chargement principal --------------------------------------------------

  useEffect(() => {
    if (!acteId) return;

    (async () => {
      try {
        setIsLoading(true);

        await fetchActeDetail(acteId);

        const { acte: loadedActe } = useEtatCivilActesStore.getState();
        const bureauId = loadedActe?.bureau_id;
        const registreId = loadedActe?.registre_id;

        const [acteursData, rels, reg, bur] = await Promise.all([
          apiFetchActeursEnrichis(acteId),
          apiFetchRelationsForActeId(acteId),
          registreId ? fetchRegistre(registreId) : Promise.resolve(null),
          bureauId ? fetchBureau(bureauId) : Promise.resolve(null),
        ]);

        setActeurs(acteursData ?? []);
        setRelations(rels ?? []);
        setRegistre(reg ?? null);
        setBureau(bur ?? null);
      } catch (err) {
        console.error('Erreur lors du chargement de la page acte', err);
        setRegistre(null);
        setBureau(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [acteId, fetchActeDetail, fetchRegistre, fetchBureau]);

  // --- Recalcul des incohérences --------------------------------------------

  useEffect(() => {
    if (!acte || !entites) return;
    setErreurs(getErrorsForActe(acte, entites, relations));
  }, [acte, entites, relations]);

  // --- Guard de sortie: beforeunload -----------------------------------------

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saving || isFormDirty()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saving]);

  // --- Utilitaires de refresh ------------------------------------------------

  const refreshErreurs = async () => {
    if (!acteId) return;
    await fetchActeDetail(acteId);
    const { acte: updatedActe, entites: updatedEntites } = useEtatCivilActesStore.getState();
    setErreurs(getErrorsForActe(updatedActe, updatedEntites, relations));
  };

  const refreshRelations = async () => {
    if (!acteId) return;
    try {
      const rels = await apiFetchRelationsForActeId(acteId);
      setRelations(rels ?? []);
    } catch (err) {
      console.error('Erreur lors du refresh des relations', err);
    }
  };

  // --- Save: seulement si diff ----------------------------------------------

  async function saveActeIfDirty(): Promise<boolean> {
    if (!acteFormRef.current) return false;

    if (!isFormDirty()) {
      // Rien à sauver
      return true;
    }

    setSaving(true);
    try {
      await acteFormRef.current.save();
      toast.success('Acte mis à jour');
      return true;
    } catch {
      toast.error('Erreur lors de l’enregistrement');
      return false;
    } finally {
      setSaving(false);
    }
  }

  // --- Label auto ------------------------------------------------------------

  async function editLabel(acteur: any) {
    try {
      if (!acteur || !acte?.type_acte || !acte?.id) return;

      const formatNomComplet = (p?: string, n?: string) => [p, n].filter(Boolean).join(' ').trim();
      let tmpLabel: string | null = null;

      if (acte.type_acte === 'naissance' && acteur.role === 'enfant') {
        tmpLabel = `acte de naissance de ${formatNomComplet(acteur.prenom, acteur.nom)}`;
      } else if (acte.type_acte === 'décès' && acteur.role === 'défunt') {
        tmpLabel = `acte de décès de ${formatNomComplet(acteur.prenom, acteur.nom)}`;
      }

      if (tmpLabel && acte.label !== tmpLabel) {
        await apiUpdateActeLabel(acte.id, tmpLabel);
        useEtatCivilActesStore.setState((prev) => ({
          ...prev,
          acte: prev.acte ? { ...prev.acte, label: tmpLabel! } : prev.acte,
        }));
      }
    } catch (err) {
      console.error('editLabel error', err);
    }
  }

  // --- Actions UI ------------------------------------------------------------

  async function addActeur() {
    const ok = await saveActeIfDirty();
    if (!ok) return;
    setSelectedActeur(emptyActeur);
    setMode('create');
    setShowModal(true);
  }

  async function handleNavBack() {
    if (saving || isFormDirty()) {
      const ok = confirm('Vous avez des modifications non enregistrées. Quitter quand même ?');
      if (!ok) return;
    }
    navigate('/ec-acte/' + acte!.id);
  }

  // --- Rendering -------------------------------------------------------------

  if (isLoading || !acte || acte.id !== acteId) {
    return (
      <div className='flex flex-col' aria-busy='true'>
        <p className='text-muted-foreground'>Chargement de l’acte...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col' aria-busy={isLoading || saving ? 'true' : 'false'}>
      <div className='sticky top-0 z-10 bg-white'>
        <div className='flex items-center justify-between px-6 py-3 border-b'>
          <div className='flex items-center gap-3'>
            {/* Remplace Link par un bouton pour gérer la garde de sortie */}
            <button onClick={handleNavBack} aria-label='Revenir à la fiche acte'>
              <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer' />
            </button>

            {getIconForStatut(acte.statut)}
            <div>
              <div className='flex items-center gap-x-2'>
                <h1 className='text-base font-semibold text-gray-800'>
                  {acte.label ? acte.label.charAt(0).toUpperCase() + acte.label.slice(1) : 'Acte'}
                </h1>
                <Badge className='m-0 bg-yellow-600 text-white shadow'>Mode édition</Badge>
                {erreurs && erreurs.length > 0 && (
                  <AlertTriangle className='w-4 h-4 text-yellow-600' aria-label='Incohérences détectées' />
                )}
              </div>
              <div className='text-xs flex items-center space-x-2'>
                {registre && (
                  <>
                    <span className='text-gray-800'>
                      {getRegistreLabel(registre.type_acte, registre.statut_juridique)}
                    </span>
                    <span className='text-gray-500'>{registre.annee}</span>
                    <span className='text-gray-500'>acte n°{acte.numero_acte}</span>
                    {bureau && (
                      <span className='text-gray-500'>
                        enregistré à la {bureau.nom} ({bureau.departement})
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <Button
              onClick={async () => {
                const ok = await saveActeIfDirty();
                if (ok) navigate('/ec-acte/' + acte.id);
              }}
              disabled={saving}
              className='flex items-center gap-2 text-sm hover:text-black'
            >
              <Save className='w-4 h-4' />
              {saving ? 'Enregistrement en cours...' : 'Enregistrer'}
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-8 px-6 text-sm border-b overflow-x-auto bg-white'>
          {tabs.map(({ label, icon: Icon }) => {
            const isActive = activeSection === label;
            return (
              <button
                key={label}
                onClick={() => setActiveSection(label)}
                className={`py-3 -mb-px border-b-2 flex items-center gap-2 transition-all ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-controls={`section-${label}`}
              >
                <Icon className='w-4 h-4' />
                {label}
                {label === 'Acteurs' && (
                  <span className='inline-flex items-center justify-center px-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
                    {acteurs.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section id={`section-Acte`} className='p-6 prose prose-sm max-w-none'>
        {activeSection === 'Acte' && (
          <Accordion type='multiple' defaultValue={['metadonnees', 'acteurs']}>
            {acte && acte?.statut !== 'transcrit' && (
              <AccordionItem value='incoherence'>
                <AccordionTrigger>
                  <div className='flex items-center gap-x-2'>
                    <AlertTriangle className='w-4 h-4 text-yellow-600' />
                    <h1>Incohérence de l'acte</h1>
                    <Badge variant='secondary' className='ml-2'>
                      {erreurs.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ActeCoherence acteId={acte.id} erreurs={erreurs} relations={relations} />
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value='metadonnees'>
              <AccordionTrigger>
                <div className='flex items-center gap-x-2'>
                  <FileText className='w-4 h-4 text-gray-500' />
                  <h1>Métadonnées de l'acte</h1>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ActeForm
                  ref={acteFormRef}
                  acte={acte}
                  onUpdated={async () => {
                    await fetchActeDetail(acte.id);
                  }}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value='acteurs'>
              <AccordionTrigger>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-x-2'>
                    <Users className='w-4 h-4 text-gray-500' />
                    <h1>Acteurs</h1>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {acteurs.length > 0 && (
                  <div className='flex items-center justify-end'>
                    <Button onClick={addActeur} className='mr-2'>
                      + Ajouter un acteur
                    </Button>
                  </div>
                )}

                <ActeursAccordion
                  acteId={acteId!}
                  sourceTable={'etat_civil_actes'}
                  mode={'edit'}
                  ref={acteursAccordionRef}
                  relations={relations}
                  onEdit={async (a) => {
                    const ok = await saveActeIfDirty();
                    if (!ok) return;
                    setSelectedActeur(a);
                    setMode('edit');
                    setShowModal(true);
                  }}
                  onAdd={addActeur}
                  onDelete={async (id) => {
                    const ok = await saveActeIfDirty();
                    if (!ok) return;

                    if (confirm('Confirmer la suppression de cet acteur ?')) {
                      try {
                        await apiDeleteActeurCascade(id);
                        setActeurs((prev) => prev.filter((a) => a.id !== id));
                        toast('Acteur supprimé', { icon: '🗑️', duration: 4000 });
                        acteursAccordionRef.current?.refreshEntities();
                        await refreshRelations();
                        await refreshErreurs();
                      } catch (err: any) {
                        toast.error(err.message ?? 'Erreur lors de la suppression');
                      }
                    }
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </section>

      <DialogActeur
        open={showModal}
        onClose={() => setShowModal(false)}
        mode={mode}
        acteur={selectedActeur}
        acteId={acteId!}
        acteDate={acte?.date}
        onSave={async (nouvelActeur) => {
          if (mode === 'edit') {
            setActeurs((prev) => prev.map((a) => (a.id === nouvelActeur.id ? nouvelActeur : a)));
          } else {
            setActeurs((prev) => [...prev, nouvelActeur]);
          }
          await editLabel(nouvelActeur);
          acteursAccordionRef.current?.refreshEntities();
          await refreshRelations();
          await refreshErreurs();
          setShowModal(false);
        }}
      />
    </div>
  );
}
