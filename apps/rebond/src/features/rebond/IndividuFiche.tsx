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
} from 'lucide-react';
import IndividuLigneDeVieTable from './IndividuLigneDeVieTable';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

const tabs = [
  { label: 'Synthèse', icon: User },
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

export default function IndividuLayout() {
  const { individuId } = useParams();

  const individus = useIndividuStore((s) => s.individus);
  const fetchIndividus = useIndividuStore((s) => s.fetchIndividus);
  const { individu, fetchIndividuById } = useIndividuStore();

  const [openedTabs, setOpenedTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>(individuId);
  const [activeSection, setActiveSection] = useState<string>(tabs[0].label);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchIndividus();
  }, [fetchIndividus]);

  useEffect(() => {
    if (individuId && individus.length > 0) {
      const found = individus.find((i) => i.id === individuId);
      if (found) {
        setOpenedTabs([found]);
        setActiveTabId(found.id);
      }
    }
  }, [individuId, individus]);

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
                  <Link to={`/individus/liste`}>
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
