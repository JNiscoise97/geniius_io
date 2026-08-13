//IndividuFiche.tsx

import { useIndividuStore } from '@/store/useIndividuStore';
import {
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  User,
  Users,
  ListTree,
  MapPin,
  Layers3,
  Briefcase,
  Archive,
  BookOpen,
  Mail,
  Settings,
  X,
  Share2,
  FileText,
  Mars,
  Venus,
  Circle,
  UsersIcon,
  InfoIcon,
  Loader2,
  SpellCheck,
  Navigation,
  Pen,
  Link2,
  ClipboardCheck,
  CheckCircle2,
} from 'lucide-react';
import IndividuLigneDeVieTable from './IndividuLigneDeVieTable';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase, supabaseRebond } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import {
  getChronoProfessions,
  getDeces,
  getNaissance,
  getTopNomsPrenoms,
} from '@/lib/enrichirIndividu';
import IndividuBiographie from '../mock-up/composants/IndividuBiographie';
import { EnfantCard } from './EnfantCard';
import AnalyseNomPrenom from './AnalyseNomPrenom';
import { Button } from '@/components/ui/button';
import AnalyseFamille from './analyse-famille/AnalyseFamille';
import AnalyseProfessionStatutFonction from './AnalyseProfessionStatutFonction';
import AnalyseSignature from './AnalyseSignature';
import RelationsAccordion from './RelationsAccordion';
import { displayNom } from '@/lib/nom';
import { fetchEntityAttributes, fetchEntityDetail, upsertEntityAttribute } from '@/features/entites/entites.service';
import type { EntityAttribute, EntityDetail, EntityFact } from '@/features/entites/entites.types';

const tabs = [
  { label: 'Synthèse', icon: User },
  { label: 'Relations & faits', icon: Link2 },
  { label: 'Informations à valider', icon: ClipboardCheck },
  { label: 'Détails', icon: ListTree },
  { label: 'Ligne de vie', icon: Layers3 },
  { label: 'Famille', icon: Users },
  { label: 'Lieux', icon: MapPin },
  { label: 'Appellations', icon: SpellCheck },
  { label: 'Signature', icon: Pen },
  { label: 'Activités', icon: Briefcase },
  { label: 'Mentions', icon: Archive },
  { label: 'Sources', icon: BookOpen },
  { label: 'Hypothèses', icon: AlertCircle },
  { label: 'Réseau relationnel', icon: Share2 },
  { label: 'Notes de recherche', icon: FileText },
];

const historique = [
  { date: '1832-04-12', label: 'Naissance à Basse-Terre' },
  { date: '1851-07-03', label: 'Mariage avec Jean RIVIÈRE' },
  { date: '1862-09-15', label: 'Naissance de Louise RIVIÈRE' },
  { date: '1886-01-01', label: 'Mention dans le recensement de Basse-Terre' },
  { date: '1891-05-22', label: 'Mention dans une donation chez Me DURAND' },
];

// Prédicats retenus comme "attributs d'identité" analysables dans l'onglet
// "Informations à valider" — liste volontairement restreinte aux faits qui
// décrivent la personne elle-même de façon stable (curatée à la main, même
// esprit que RELATION_PREDICATES dans entites.service.ts). Exclut les rôles
// dans un acte (comparant, témoin...), les relations (père/conjoint...) déjà
// couvertes par l'onglet "Relations & faits", et "age"/"name" qui ne sont
// pas des attributs stables à figer (l'âge varie par acte, le nom se gère
// par le renommage de la fiche canonique).
const ATTRIBUTE_PREDICATES: Record<string, string> = {
  sex: 'Sexe',
  birth_date: 'Date de naissance',
  birth_place: 'Lieu de naissance',
  death_date: 'Date de décès',
  death_place: 'Lieu de décès',
  occupation: 'Profession',
  residence: 'Résidence',
  domicile: 'Domicile',
  nationality: 'Nationalité',
  marital_status: 'Statut matrimonial',
};

type AttributeCandidate = {
  value: string;
  normalizedValue: string;
  factIds: string[];
  documentTitres: string[];
};

type AttributeGroup = {
  code: string;
  label: string;
  candidates: AttributeCandidate[];
};

// Regroupe les faits par attribut d'identité, puis par valeur normalisée —
// un attribut avec plusieurs candidats est un conflit entre actes (ex. deux
// dates de naissance différentes) à trancher manuellement ; un seul
// candidat est simplement à confirmer (synthèse, même sans désaccord).
function analyzeAttributes(facts: EntityFact[]): AttributeGroup[] {
  const byCode = new Map<string, Map<string, AttributeCandidate>>();

  for (const f of facts) {
    const label = ATTRIBUTE_PREDICATES[f.predicateCode];
    if (!label) continue;
    const raw = f.valueDate ?? f.valueText ?? (f.valueNumber != null ? String(f.valueNumber) : null);
    const value = raw?.trim();
    if (!value) continue;

    const normalized = value.toLowerCase();
    const byValue = byCode.get(f.predicateCode) ?? new Map<string, AttributeCandidate>();
    const existing = byValue.get(normalized);
    if (existing) {
      existing.factIds.push(f.id);
      if (!existing.documentTitres.includes(f.documentTitre)) existing.documentTitres.push(f.documentTitre);
    } else {
      byValue.set(normalized, { value, normalizedValue: normalized, factIds: [f.id], documentTitres: [f.documentTitre] });
    }
    byCode.set(f.predicateCode, byValue);
  }

  return [...byCode.entries()]
    .map(([code, byValue]) => ({ code, label: ATTRIBUTE_PREDICATES[code], candidates: [...byValue.values()] }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default function IndividuLayout() {
  const { individuId } = useParams();

  const individus = useIndividuStore((s) => s.individus);
  const fetchIndividus = useIndividuStore((s) => s.fetchIndividus);
  const { fetchIndividuById } = useIndividuStore();

  const [openedTabs, setOpenedTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>(individuId);
  const [activeSection, setActiveSection] = useState<string>(tabs[0].label);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchIndividus();
  }, [fetchIndividus]);

  useEffect(() => {
    if (!individuId) return;

    const found = individus.find((i) => i.id === individuId);
    if (found) {
      setOpenedTabs([found]);
      setActiveTabId(found.id);
      return;
    }

    // Repli : l'id vient du registre canonique du nouveau rebond
    // (rebond.entities), pas de l'ancien modèle (rebond_individus) — ce
    // composant est rapatrié depuis rebond_deprecated mais pas encore
    // reconnecté aux vraies données de cet ancien modèle (demande
    // explicite : le brancher même non câblé). On affiche au moins le nom
    // canonique pour que l'écran ne soit pas vide ; tous les onglets basés
    // sur les RPC de l'ancien modèle resteront vides tant que ce module
    // n'est pas reconnecté à une source de données réelle.
    let cancelled = false;
    supabaseRebond
      .from('entities')
      .select('id, label')
      .eq('id', individuId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const [prenom, ...reste] = data.label.split(' ');
        setOpenedTabs([
          {
            id: data.id,
            prenom: prenom ?? data.label,
            nom: reste.join(' ') || null,
            sexe: null,
            naissance_date: null,
            naissance_lieu: null,
            deces_naissance: null,
            deces_lieu: null,
          },
        ]);
        setActiveTabId(data.id);
      });
    return () => {
      cancelled = true;
    };
  }, [individuId, individus]);

  // Onglet "Relations & faits" : sourcé directement depuis le registre
  // canonique (rebond.entities), pas depuis l'ancien modèle — même service
  // que la fiche Entités (`fetchEntityDetail`), pour ne pas dupliquer le
  // calcul des relations/faits/actes à deux endroits.
  const [entityDetail, setEntityDetail] = useState<EntityDetail | null>(null);
  const [entityDetailLoading, setEntityDetailLoading] = useState(false);

  useEffect(() => {
    if (!individuId) return;
    let cancelled = false;
    setEntityDetailLoading(true);
    fetchEntityDetail(individuId)
      .then((data) => {
        if (!cancelled) setEntityDetail(data);
      })
      .catch((err) => {
        console.error('[IndividuFiche] Erreur fetchEntityDetail', err);
        if (!cancelled) setEntityDetail(null);
      })
      .finally(() => {
        if (!cancelled) setEntityDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [individuId]);

  // Onglet "Informations à valider" : analyse des faits (entityDetail.facts)
  // groupés par attribut d'identité, comparés aux choix déjà validés
  // manuellement (rebond.entity_attributes).
  const [validatedAttributes, setValidatedAttributes] = useState<EntityAttribute[]>([]);
  const [savingAttribute, setSavingAttribute] = useState<string | null>(null);

  useEffect(() => {
    if (!individuId) return;
    let cancelled = false;
    fetchEntityAttributes(individuId)
      .then((data) => {
        if (!cancelled) setValidatedAttributes(data);
      })
      .catch((err) => console.error('[IndividuFiche] Erreur fetchEntityAttributes', err));
    return () => {
      cancelled = true;
    };
  }, [individuId]);

  const attributeGroups = analyzeAttributes(entityDetail?.facts ?? []);

  async function handleValidateAttribute(code: string, candidate: AttributeCandidate) {
    if (!individuId) return;
    setSavingAttribute(code);
    try {
      await upsertEntityAttribute(individuId, code, candidate.value, candidate.factIds);
      const refreshed = await fetchEntityAttributes(individuId);
      setValidatedAttributes(refreshed);
      toast.success('Information validée');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de la validation');
    } finally {
      setSavingAttribute(null);
    }
  }

  const closeTab = (id: string) => {
    setOpenedTabs((prev) => {
      const updated = prev.filter((tab) => tab?.id !== id);
      if (activeTabId === id && updated.length > 0) {
        setActiveTabId(updated[0].id); // active le premier onglet restant
      }
      return updated;
    });
  };

  const openIndividu = (id: string) => {
    const existing = openedTabs.find((t) => t?.id === id);
    if (existing) {
      setActiveTabId(id);
    } else {
      const found = individus.find((t) => t.id === id);
      if (found) {
        setOpenedTabs((prev) => [...prev, found]);
        setActiveTabId(found.id);
      }
    }
  };

  const activeIndividu = openedTabs.find((t) => t?.id === activeTabId);

  const [acteursByIndividu, setActeursByIndividu] = useState<any[] | null>(null);

  const { prenoms, noms } = getTopNomsPrenoms(acteursByIndividu || []);
  const professionsChrono = getChronoProfessions(acteursByIndividu || []);

  const naissance = getNaissance(acteursByIndividu || []);
  const deces = getDeces(acteursByIndividu || []);

  const [parents, setParents] = useState<
    { parent_role: string; parent_acteur_id: string; parent_individu_id: string | null }[]
  >([]);
  const [parentsDetails, setParentsDetails] = useState<any[]>([]);

  const [siblings, setSiblings] = useState<
    {
      sibling_individu_id: string;
      nom: string | null;
      prenom: string | null;
      sexe: 'M' | 'F' | null;
      type_lien: string;
      via_pere: boolean;
      via_mere: boolean;
    }[]
  >([]);

  const [enfants, setEnfants] = useState<any[] | null>(null);

  const [unions, setUnions] = useState<any[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadIndividuData = async (id: string) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchIndividuById(id),
        fetchActeursByIndividu(id),
        fetchParents(id),
        fetchChildren(id),
        fetchUnions(id),
        fetchSiblings(id),
      ]);
    } catch (e) {
      console.error('Erreur chargement données individu', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeIndividu?.id) {
      loadIndividuData(activeIndividu.id);
    }
  }, [activeIndividu?.id]);

  useEffect(() => {
    const parentIds = parents.map((p) => p.parent_acteur_id);
    if (parentIds.length === 0) return;

    supabase
      .from('v_acteurs_enrichis')
      .select('id, nom, prenom')
      .in('id', parentIds)
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur récupération détails parents:', error);
        } else {
          setParentsDetails(data ?? []);
        }
      });
  }, [parents]);

  const fetchActeursByIndividu = async (id: string) => {
    const { data } = await supabase.from('v_acteurs_enrichis').select('*').eq('individu_id', id);

    setActeursByIndividu(data ?? []);
  };

  const fetchParents = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_parents_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
      console.error('Erreur fetchParents:', error);
    } else {
      setParents(data ?? []);
    }
  };

  const fetchChildren = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_enfants_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
    } else {
      setEnfants(data ?? []);
    }
  };

  const fetchUnions = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_unions_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
      console.error('Erreur fetchUnions:', error);
    } else {
      setUnions(data ?? []);
    }
  };

  useEffect(() => {
    if (!enfants) return;

    const enrichirEnfants = async () => {
      const enfantsEnrichis = await Promise.all(
        enfants.map(async (enfant) => {
          if (!enfant.enfant_individu_id) return enfant;

          const { data } = await supabase
            .from('v_acteurs_enrichis')
            .select('*')
            .eq('individu_id', enfant.enfant_individu_id);

          const enrichis = data ?? [];
          return {
            ...enfant,
            enrichis,
            naissance: getNaissance(enrichis),
            deces: getDeces(enrichis),
            professions: getChronoProfessions(enrichis),
          };
        }),
      );

      setEnfants(enfantsEnrichis);
    };

    enrichirEnfants();
  }, [enfants?.length]);

  const fetchSiblings = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_siblings_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
      console.error('Erreur fetchSiblings:', error);
    } else {
      setSiblings(data ?? []);
    }
  };

  const { regroupements: unionsAvecEnfants, enfantsHorsUnion } =
    unions && enfants
      ? grouperEnfantsParUnion(unions, enfants)
      : { regroupements: [], enfantsHorsUnion: [] };

  const parentsPersonnes = {
    pere: (() => {
      const parent = parents.find((p) => p.parent_role === 'père');
      const detail = parent ? parentsDetails.find((d) => d.id === parent.parent_acteur_id) : null;

      if (parent?.parent_individu_id) {
        return individus.find((i) => i.id === parent.parent_individu_id) ?? detail;
      }

      return detail ?? null;
    })(),

    mere: (() => {
      const parent = parents.find((p) => p.parent_role === 'mère');
      const detail = parent ? parentsDetails.find((d) => d.id === parent.parent_acteur_id) : null;

      if (parent?.parent_individu_id) {
        return individus.find((i) => i.id === parent.parent_individu_id) ?? detail;
      }

      return detail ?? null;
    })(),
  };

  return (
    <>
      {isLoading && (
        <div className='flex items-center justify-center h-[60vh]'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        </div>
      )}
      {!isLoading && activeIndividu ? (
        <div className='flex max-h-auto flex-col'>
          <div className='sticky top-0 z-10 bg-white'>
            {openedTabs.length > 1 && (
              <div className='flex items-center space-x-1 bg-gray-100 px-4 py-2 border-b overflow-x-auto'>
                {openedTabs.map((tab) => (
                  <div
                    key={tab?.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-t text-sm cursor-pointer transition ${
                      activeTabId === tab?.id
                        ? 'bg-white border border-b-0 border-gray-300 font-medium'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    onClick={() => setActiveTabId(tab?.id)}
                  >
                    {`${tab?.prenom} ${tab?.nom}`}
                    <X
                      className='w-4 h-4 ml-1 hover:text-red-500'
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab?.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className='flex items-center justify-between px-6 py-3 border-b bg-white'>
              {/* Gauche : infos de l'individu */}
              <div className='flex items-center gap-3'>
                {openedTabs.length == 1 && (
                  <Link to={`/entites`}>
                    <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer'>
                      <title>Retour</title>
                    </ArrowLeft>
                  </Link>
                )}

                {activeIndividu.sexe === 'M' && (
                  <Mars className='w-4 h-4 text-blue-500'>
                    <title>Homme</title>
                  </Mars>
                )}
                {activeIndividu.sexe === 'F' && (
                  <Venus className='w-4 h-4 text-pink-500'>
                    <title>Femme</title>
                  </Venus>
                )}
                {!['M', 'F'].includes(activeIndividu.sexe) && (
                  <Circle className='w-4 h-4 text-gray-400'>
                    <title>Genre non précisé</title>
                  </Circle>
                )}

                <span className='text-base font-semibold text-gray-800'>
                  {displayNom(activeIndividu.prenom, activeIndividu.nom)}
                </span>

                <span className='text-sm text-gray-500'>
                  {[
                    (activeIndividu.sexe === 'F' ? 'née ' : 'né ') + naissance.date,
                    (activeIndividu.sexe === 'F' ? 'décédée ' : 'décédé ') + deces.date,
                  ]
                    .filter(Boolean)
                    .join(' - ')}

                  {unions && unions.length > 0 && (
                    <>
                      {' • ' + (activeIndividu.sexe === 'F' ? 'épouse' : 'époux') + ' de : '}
                      {unions
                        .filter((union) => union.type_union === 'mariage civil')
                        .map((union, index) => {
                          const person = individus.find((i) => i.id === union.conjoint_individu_id);
                          return person ? (
                            <button
                              key={union.conjoint_individu_id}
                              className='text-indigo-800 underline ml-1 hover:text-indigo-600'
                              onClick={() => openIndividu(union.conjoint_individu_id)}
                            >
                              {person.prenom} {person.nom}
                              {index < unions.length - 1 ? ', ' : ''}
                            </button>
                          ) : (
                            <span key={union.conjoint_individu_id}>
                              {union.conjoint_prenom} {union.conjoint_nom}
                              {index < unions.length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                    </>
                  )}
                </span>
              </div>

              {/* Droite : actions */}
              <div className='flex items-center gap-4'>
                <button className='flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
                  <PlusCircle className='w-4 h-4' />
                  Ajouter une source
                </button>
                {activeTabId != individuId && (
                  <Link to={`/individu/${activeTabId}`}>
                    <Button variant='ghost' className='text-sm'>
                      <Navigation className='w-4 h-4 opacity-70 text-indigo-600' />
                    </Button>
                  </Link>
                )}
                <Mail className='w-5 h-5 text-gray-700 cursor-pointer' />
                <Settings className='w-5 h-5 text-gray-700 cursor-pointer' />
              </div>
            </div>

            <div className='flex items-center gap-8 px-6 text-sm border-b bg-white'>
              {tabs.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveSection(label)}
                  className={`py-3 -mb-px border-b-2 flex items-center gap-2 transition-all ${
                    activeSection === label
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span className='flex items-center gap-1'>
                    {label}
                    {label === 'Sources' && acteursByIndividu && (
                      <span className='inline-flex items-center justify-center px-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
                        {acteursByIndividu.length}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className='flex flex-1 overflow-hidden'>
            <section className='flex-1 overflow-y-auto p-6  mb-4 prose prose-sm'>
              <h2 className='text-lg font-semibold mb-4'>{activeSection}</h2>
              {activeSection === 'Ligne de vie' ? (
                <div className='space-y-4'>
                  {historique.map((event) => (
                    <div key={event.date} className='flex gap-4 items-start'>
                      <div className='w-28 text-right text-sm text-gray-500'>
                        {new Date(event.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className='flex-1 text-sm text-gray-800 border-l-2 border-blue-500 pl-4'>
                        {event.label}
                      </div>
                    </div>
                  ))}
                  <Separator />

                  <IndividuLigneDeVieTable enrichis={acteursByIndividu} pageSize={-1} />
                </div>
              ) : activeSection === 'Synthèse' ? (
                <>
                  <div className='space-y-4'>
                    <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-md shadow-sm'>
                      <h2 className='text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2'>
                        <InfoIcon className='w-5 h-5 text-gray-500' /> Informations synthétiques
                      </h2>
                      <dl className='grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm'>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Prénoms</dt>
                          <dd className='mt-1 text-gray-800'>{prenoms}</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Noms</dt>
                          <dd className='mt-1 text-gray-800'>{noms}</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Naissance</dt>
                          <dd className='mt-1 text-gray-800'>
                            {' '}
                            {naissance.date} à {naissance.lieu}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Décès</dt>
                          <dd className='mt-1 text-gray-800'>
                            {' '}
                            {deces.date} à {deces.lieu}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Professions</dt>
                          <dd className='mt-1 text-gray-800'>{professionsChrono}</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>🚧 Statuts</dt>
                          <dd className='mt-1 text-gray-800'>Fille d'engagée, épouse</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Parents</dt>
                          <dd className='mt-1 text-gray-800 flex flex-wrap gap-2'>
                            {['père', 'mère'].map((role) => {
                              const parent = parents.find((p) => p.parent_role === role);
                              const detail = parent
                                ? parentsDetails.find((d) => d.id === parent.parent_acteur_id)
                                : null;
                              const person = parentsPersonnes[role === 'père' ? 'pere' : 'mere'];

                              if (person && parent?.parent_individu_id) {
                                return (
                                  <span key={parent.parent_individu_id}>
                                    <button
                                      className='text-indigo-800 underline hover:text-indigo-600'
                                      onClick={() => openIndividu(parent.parent_individu_id!)}
                                    >
                                      {person.prenom} {person.nom}
                                    </button>{' '}
                                    ({role})
                                  </span>
                                );
                              } else if (detail) {
                                return (
                                  <span key={detail.id}>
                                    {[detail.prenom, detail.nom].filter(Boolean).join(' ')} ({role})
                                  </span>
                                );
                              } else {
                                return (
                                  <span key={role}>
                                    {role} inconnu{role === 'mère' ? 'e' : ''}
                                  </span>
                                );
                              }
                            })}
                          </dd>
                        </div>

                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>🚧 Fratrie</dt>
                          <dd className='mt-1 text-gray-800'>
                            {siblings.filter((s) => s.sexe === 'M').length} frère
                            {siblings.filter((s) => s.sexe === 'M').length > 1 ? 's' : ''} et{' '}
                            {siblings.filter((s) => s.sexe === 'F').length} sœur
                            {siblings.filter((s) => s.sexe === 'F').length > 1 ? 's' : ''} connu
                            {siblings.length > 1 ? 's' : ''}
                          </dd>
                        </div>
                        {unions && unions.length > 0 && (
                          <div>
                            <dt className='text-sm font-semibold text-gray-900'>
                              Union{unions.length > 1 ? 's' : ''}
                            </dt>
                            <dd className='mt-1 text-gray-800'>
                              {unions.length} union{unions.length > 1 ? 's' : ''} connue
                              {unions.length > 1 ? 's' : ''}
                            </dd>
                          </div>
                        )}
                        {enfants && enfants.length > 0 && (
                          <div>
                            <dt className='text-sm font-semibold text-gray-900'>
                              Enfant{enfants.length > 1 ? 's' : ''}
                            </dt>
                            <dd className='mt-1 text-gray-800'>
                              {enfants.length} enfant{enfants.length > 1 ? 's' : ''} connu
                              {enfants.length > 1 ? 's' : ''}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <h1>Contenu suggéré :</h1>

                    <ul>
                      <IndividuBiographie />

                      <li>Statut (source complète, incertitude, hypothèses)</li>
                      <li>Dates clés : naissance, mariage, décès</li>
                      <li>Profils liés (parents, conjoints, enfants)</li>
                      <li>Résumé visuel : chronologie simplifiée, carte rapide, graphe</li>
                    </ul>
                    <p>
                      <strong>But : </strong>offrir une vue d’ensemble immédiate – idéale pour un
                      premier regard.
                    </p>
                  </div>
                </>
              ) : activeSection === 'Relations & faits' ? (
                <div className='space-y-4 not-prose'>
                  {entityDetailLoading && !entityDetail ? (
                    <p className='text-xs text-gray-400 italic flex items-center gap-1.5'>
                      <Loader2 className='w-3.5 h-3.5 animate-spin' />Chargement…
                    </p>
                  ) : (
                    <>
                      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                        <h2 className='text-sm font-semibold text-gray-800 mb-3'>Relations directes</h2>
                        {!entityDetail || entityDetail.relations.length === 0 ? (
                          <p className='text-xs text-gray-400 italic'>Aucune relation connue pour l’instant.</p>
                        ) : (
                          <div className='flex flex-col gap-1.5'>
                            {entityDetail.relations.map((r, i) =>
                              r.targetEntityId ? (
                                <Link
                                  key={i}
                                  to={`/individu/${r.targetEntityId}`}
                                  className='flex items-center justify-between text-sm text-gray-700 hover:text-indigo-700 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors'
                                >
                                  <span><span className='text-gray-400'>{r.predicateLabel} :</span> {r.targetLabel}</span>
                                  <Navigation className='w-3.5 h-3.5 text-gray-300' />
                                </Link>
                              ) : (
                                <div key={i} className='text-sm text-gray-700 py-1.5 px-2'>
                                  <span className='text-gray-400'>{r.predicateLabel} :</span> {r.targetLabel}
                                  <span className='text-[11px] text-gray-300 ml-1.5'>(pas encore une fiche)</span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                        <h2 className='text-sm font-semibold text-gray-800 mb-3'>
                          Faits ({entityDetail?.facts.length ?? 0})
                        </h2>
                        {!entityDetail || entityDetail.facts.length === 0 ? (
                          <p className='text-xs text-gray-400 italic'>Aucun fait validé pour l’instant.</p>
                        ) : (
                          <div className='flex flex-col gap-2.5'>
                            {entityDetail.facts.map((f) => (
                              <div key={f.id} className='rounded-lg border border-gray-100 p-3'>
                                <p className='text-sm text-gray-800'>{f.label}</p>
                                {f.sourceText && (
                                  <p className='text-xs text-gray-400 italic mt-1'>« {f.sourceText} »</p>
                                )}
                                <p className='text-[11px] text-gray-400 mt-1.5 flex items-center gap-1'>
                                  <FileText className='w-3 h-3' />{f.documentTitre}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                        <h2 className='text-sm font-semibold text-gray-800 mb-3'>
                          Mentionné{activeIndividu?.sexe === 'F' ? 'e' : ''} dans {entityDetail?.documents.length ?? 0} acte
                          {(entityDetail?.documents.length ?? 0) > 1 ? 's' : ''}
                        </h2>
                        {!entityDetail || entityDetail.documents.length === 0 ? (
                          <p className='text-xs text-gray-400 italic'>Aucun acte pour l’instant.</p>
                        ) : (
                          <div className='flex flex-col gap-1.5'>
                            {entityDetail.documents.map((d) => (
                              <Link
                                key={d.versionId}
                                to={`/atelier-documentaire/exemplaires/${d.exemplaireId}/versions/${d.versionId}/extraction`}
                                className='flex items-center justify-between text-sm text-gray-700 hover:text-indigo-700 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group'
                              >
                                <span className='flex items-center gap-1.5'>
                                  <FileText className='w-3.5 h-3.5 text-gray-300' />{d.titre}
                                </span>
                                <Navigation className='w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors' />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : activeSection === 'Informations à valider' ? (
                <div className='space-y-4 not-prose'>
                  <p className='text-xs text-gray-500 -mt-2'>
                    Faits regroupés par type d'information. Quand plusieurs actes se contredisent, choisis
                    la valeur à retenir ; sinon, confirme la valeur trouvée. Le choix est mémorisé pour cette
                    fiche.
                  </p>
                  {entityDetailLoading && !entityDetail ? (
                    <p className='text-xs text-gray-400 italic flex items-center gap-1.5'>
                      <Loader2 className='w-3.5 h-3.5 animate-spin' />Chargement…
                    </p>
                  ) : attributeGroups.length === 0 ? (
                    <p className='text-xs text-gray-400 italic'>Aucune information analysable pour l’instant.</p>
                  ) : (
                    attributeGroups.map((group) => {
                      const validated = validatedAttributes.find((a) => a.attributeCode === group.code);
                      return (
                        <div key={group.code} className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                          <div className='flex items-center justify-between mb-3'>
                            <h2 className='text-sm font-semibold text-gray-800'>{group.label}</h2>
                            {group.candidates.length > 1 && (
                              <span className='text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5'>
                                {group.candidates.length} valeurs concurrentes
                              </span>
                            )}
                          </div>

                          {validated && (
                            <div className='flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3'>
                              <CheckCircle2 className='w-3.5 h-3.5 shrink-0' />
                              Validé : {validated.value}
                            </div>
                          )}

                          <div className='flex flex-col gap-1.5'>
                            {group.candidates.map((c) => {
                              const isRetenue = validated?.value.trim().toLowerCase() === c.normalizedValue;
                              return (
                                <div
                                  key={c.normalizedValue}
                                  className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                                    isRetenue ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-100'
                                  }`}
                                >
                                  <div className='min-w-0'>
                                    <p className='text-sm text-gray-800'>{c.value}</p>
                                    <p className='text-[11px] text-gray-400 mt-0.5'>
                                      {c.factIds.length} fait{c.factIds.length > 1 ? 's' : ''} · {c.documentTitres.join(', ')}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleValidateAttribute(group.code, c)}
                                    disabled={savingAttribute === group.code || isRetenue}
                                    className='shrink-0 flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-colors'
                                  >
                                    {savingAttribute === group.code ? (
                                      <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                    ) : isRetenue ? (
                                      <CheckCircle2 className='w-3.5 h-3.5' />
                                    ) : null}
                                    {isRetenue ? 'Retenue' : 'Valider'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : activeSection === 'Détails' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Champs de saisie structurés :</li>
                    <ul>
                      <li>Identité : prénoms, nom, surnoms, sexe</li>
                      <li>Dates : naissance, baptême, décès, inhumation</li>
                      <li>Statuts civils : marital, social, juridique</li>
                      <li>Qualité généalogique : probabilité, hypothèse</li>
                    </ul>
                    <li>Provenance des données (source par champ)</li>
                    <li>Commentaires de recherche</li>
                  </ul>
                  <p>
                    <strong>But :</strong> garantir l’exactitude et la transparence des données
                    individuelles.
                  </p>
                </div>
              ) : activeSection === 'Famille' ? (
                <div className='space-y-4'>
                  <AnalyseFamille
                    activeIndividu={activeIndividu}
                    parents={parents}
                    pere={parentsPersonnes.pere}
                    mere={parentsPersonnes.mere}
                  />
                  <Separator />
                  <section id='union' className='scroll-mt-24 bg-yellow-100'>
                    <h2 className='text-2xl font-semibold flex items-center gap-2'>
                      <UsersIcon className='w-5 h-5' /> 🚧 Union & Enfants
                    </h2>

                    {unionsAvecEnfants.length > 0 && (
                      <div className='space-y-4 mt-2'>
                        {unionsAvecEnfants.map((union: any, index: number) => (
                          <div key={index}>
                            <p>
                              <strong>Conjoint :</strong> {union.conjoint_prenom}{' '}
                              {union.conjoint_nom}
                            </p>
                            {union.type_union && (
                              <p>
                                <strong>Type d’union :</strong> {union.type_union}
                              </p>
                            )}
                            {union.date_mariage && (
                              <p>
                                <strong>Mariage :</strong> {union.date_mariage}
                                {union.lieu_mariage && ` à ${union.lieu_mariage}`}
                              </p>
                            )}

                            {union.enfants && union.enfants.length > 0 ? (
                              <div className='mt-2 ml-4'>
                                <p className='font-semibold'>Enfants :</p>
                                <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                                  {union.enfants.map((enfant: any, i: number) => (
                                    <EnfantCard key={i} enfant={enfant} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className='italic text-sm text-muted-foreground ml-4'>
                                Aucun enfant connu pour cette union.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {enfantsHorsUnion.length > 0 && (
                      <section className='mt-8 bg-yellow-50 p-4 rounded'>
                        <h3 className='text-lg font-semibold mb-2'>
                          Enfants sans union identifiée
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                          {enfantsHorsUnion.map((enfant: any, i: any) => (
                            <EnfantCard key={i} enfant={enfant} />
                          ))}
                        </div>
                      </section>
                    )}
                  </section>
                </div>
              ) : activeSection === 'Appellations' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>A déterminer</li>
                  </ul>
                  <p>
                    <strong>But :</strong> contextualiser la trajectoire géographique de l’individu.
                  </p>
                  {acteursByIndividu && (
                    <AnalyseNomPrenom
                      activeIndividu={activeIndividu}
                      mentions={acteursByIndividu}
                    />
                  )}
                </div>
              ) : activeSection === 'Signature' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>A déterminer</li>
                  </ul>
                  {acteursByIndividu && (
                    <AnalyseSignature
                      activeIndividu={activeIndividu}
                      mentions={acteursByIndividu}
                    />
                  )}
                </div>
              ) : activeSection === 'Lieux' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Liste des lieux de vie, avec dates</li>
                    <li>Carte interactive</li>
                    <li>Corrélation avec les événements de la vie</li>
                  </ul>
                  <p>
                    <strong>But :</strong> contextualiser la trajectoire géographique de l’individu.
                  </p>
                </div>
              ) : activeSection === 'Activités' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Liste chronologique des professions</li>
                    <li>Cartographie sociale : évolution de statut, métiers héréditaires</li>
                  </ul>
                  <p>
                    <strong>But :</strong> éclairer les parcours professionnels dans leur contexte
                    social et familial.
                  </p>
                  <AnalyseProfessionStatutFonction
                    mentions={acteursByIndividu}
                    activeIndividu={activeIndividu}
                  />
                </div>
              ) : activeSection === 'Mentions' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Mentions marginales</li>
                    <li>Apparitions dans d’autres actes (témoins, parrains/marraines, etc.)</li>
                  </ul>
                  <p>
                    <strong>But :</strong> identifier les interactions sociales et présences
                    indirectes.
                  </p>
                </div>
              ) : activeSection === 'Sources' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Liste des sources primaires et secondaires</li>
                    <li>Accès aux images ou transcriptions</li>
                    <li>Niveau de confiance attribué</li>
                  </ul>
                  <p>
                    <strong>But :</strong> garantir la traçabilité et la vérifiabilité de chaque
                    information.
                  </p>
                  <IndividuLigneDeVieTable
                    enrichis={acteursByIndividu}
                    visibleColumns={[
                      'acteLabel',
                      'acteStatut',
                      'acteType',
                      'date',
                      'bureauNom',
                      'notaire',
                      'acteNumero',
                      'role',
                    ]}
                    pageSize={-1}
                  />
                </div>
              ) : activeSection === 'Hypothèses' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Zones d’incertitude ou d’interprétation</li>
                    <li>Scénarios envisagés, pistes en cours</li>
                    <li>Contre-hypothèses</li>
                  </ul>
                  <p>
                    <strong>But :</strong> expliciter les raisonnements derrière les hypothèses
                    généalogiques.
                  </p>
                </div>
              ) : activeSection === 'Réseau relationnel' ? (
                <div className='space-y-4'>
                  {individuId && <RelationsAccordion individuId={individuId}/>}
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Graphes de co-présence dans les actes</li>
                    <li>Groupes sociaux (paroisse, quartier, profession)</li>
                    <li>Visualisation des liens faibles et forts</li>
                  </ul>
                  <p>
                    <strong>But :</strong> comprendre les dynamiques sociales autour de l’individu.
                  </p>
                  <ul>
                    <li>Individus pour lesquels je suis apparu dans l'acte</li>
                    <li>Individus qui sont apparus dans mes actes</li>
                    <li>Individus avec qui j'ai une relation</li>
                    <li>Individus qui ont une relation avec moi</li>
                  </ul>
                </div>
              ) : activeSection === 'Notes de recherche' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Journal de bord des recherches</li>
                    <li>Rappels, blocages, idées à tester</li>
                    <li>Commentaires libres ou collaboratifs</li>
                  </ul>
                  <p>
                    <strong>But :</strong> documenter la progression et les raisonnements du
                    chercheur.
                  </p>
                </div>
              ) : (
                <p className='text-gray-600 italic text-sm'>
                  (Contenu de l’onglet "{activeSection}" pour "{activeIndividu?.prenom}{' '}
                  {activeIndividu?.nom}")
                </p>
              )}
            </section>

            {rightPanelOpen && (
              <aside className='w-80 border-l bg-gray-50 p-4 overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                    Panneau contextuel
                  </h3>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className='text-xs text-gray-500 hover:text-gray-700'
                  >
                    Fermer
                  </button>
                </div>
                <div className='space-y-4 text-sm text-gray-700'>
                  <div>
                    <h4 className='font-semibold mb-1'>Sources liées</h4>
                    <ul className='list-disc list-inside text-gray-600'>
                      <li>Acte de naissance (1832)</li>
                      <li>Recensement (1886)</li>
                      <li>Inventaire après décès</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-1'>Individus liés</h4>
                    <ul className='list-disc list-inside text-gray-600'>
                      <li>Jean RIVIÈRE (époux)</li>
                      <li>Louise RIVIÈRE (fille)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-1'>Hypothèses</h4>
                    <p className='text-gray-600'>
                      Éventuellement née à Basse-Terre, probable lien avec les familles DELORIEUX.
                    </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function grouperEnfantsParUnion(
  unions: any[],
  enfants: any[],
): { regroupements: any[]; enfantsHorsUnion: any[] } {
  if (!unions || !enfants) return { regroupements: [], enfantsHorsUnion: enfants ?? [] };

  const regroupements = unions.map((union) => {
    const enfantsDeCetteUnion = enfants.filter((enfant) => {
      return (
        (union.conjoint_individu_id &&
          enfant.autre_parent_individu_id === union.conjoint_individu_id) ||
        (union.conjoint_acteur_id && enfant.autre_parent_acteur_id === union.conjoint_acteur_id)
      );
    });

    return {
      ...union,
      enfants: enfantsDeCetteUnion,
    };
  });

  // Liste des IDs des enfants déjà assignés à une union
  const enfantsAssignes = new Set(
    regroupements.flatMap((u) =>
      u.enfants.map((e: any) => e.enfant_individu_id ?? e.enfant_acteur_id),
    ),
  );

  // Enfants sans correspondance avec une union
  const enfantsHorsUnion = enfants.filter((e) => {
    const id = e.enfant_individu_id ?? e.enfant_acteur_id;
    return !enfantsAssignes.has(id);
  });

  return { regroupements, enfantsHorsUnion };
}
