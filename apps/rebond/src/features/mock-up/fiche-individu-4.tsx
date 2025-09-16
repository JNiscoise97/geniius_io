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
  CheckCircle,
  X,
  Share2,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import IndividuBiographie from './composants/IndividuBiographie';
import GenealogyTree from './GenealogieTree2';

const tabs = [
  { label: 'Synthèse', icon: User },
  { label: 'Détails', icon: ListTree },
  { label: 'Ligne de vie', icon: Layers3 },
  { label: 'Famille', icon: Users },
  { label: 'Lieux', icon: MapPin },
  { label: 'Métiers', icon: Briefcase },
  { label: 'Mentions', icon: Archive },
  { label: 'Sources', icon: BookOpen },
  { label: 'Hypothèses', icon: AlertCircle },
  { label: 'Réseau relationnel', icon: Share2 },
  { label: 'Notes de recherche', icon: FileText },
];

const sampleIndividus = [
  {
    id: 'elise',
    prenom: 'Élise',
    nom: 'RIVIÈRE',
    lifespan: 'ca. 1832 – après 1891',
    epoux: ['jean', 'matheo'],
  },
  {
    id: 'jean',
    prenom: 'Jean',
    nom: 'RIVIÈRE',
    lifespan: '1828 – 1878',
    epoux: ['elise'],
  },
  {
    id: 'matheo',
    prenom: 'Mathéo',
    nom: 'MONTOYA',
    lifespan: '1832 – 1898',
    epoux: ['elise'],
  },
];

const individus = {
    IND1: { id: 'IND1', prenom: 'Jordan', nom: 'NISÇOISE', sexe: 'M', pereId: 'IND2', mereId: 'IND3' }, // sujet

    IND2: { id: 'IND2', prenom: 'Georges', nom: 'NISÇOISE', sexe: 'M', pereId: 'IND4', mereId: 'IND5' }, // P
    IND3: { id: 'IND3', prenom: 'Corine', nom: 'BLUKER', sexe: 'F', pereId: 'IND6', mereId: 'IND7' }, // M

    IND4: { id: 'IND4', prenom: 'Rhulvert', nom: 'NIÇOISE', sexe: 'M', pereId: 'IND8', mereId: 'IND9' }, // PP
    IND5: { id: 'IND5', prenom: 'Raymonde', nom: 'LOLLIA', sexe: 'F', pereId: 'IND10', mereId: 'IND11' }, // PM
    IND6: { id: 'IND6', prenom: 'Mariot', nom: 'BLUKER', sexe: 'M', pereId: 'IND12', mereId: 'IND13' }, // MP
    IND7: { id: 'IND7', prenom: 'Yolande', nom: 'HYPPOLITE', sexe: 'F', pereId: 'IND14', mereId: 'IND15' }, // MM

    IND8: { id: 'IND8', prenom: 'Henri', nom: 'NISÇOISE', sexe: 'M', pereId: null, mereId: null }, // PPP
    IND9: { id: 'IND9', prenom: 'Hortensia', nom: 'NÉMORIN', sexe: 'F', pereId: null, mereId: null }, // PPM
    IND10: { id: 'IND10', prenom: 'Ernest', nom: 'LOLLIA', sexe: 'M', pereId: null, mereId: null }, // PMP
    IND11: { id: 'IND11', prenom: 'Elisabeth', nom: 'FAVIÈRES', sexe: 'F', pereId: null, mereId: null }, // PMM
    IND12: { id: 'IND12', prenom: 'Michel', nom: 'BLUKER', sexe: 'M', pereId: null, mereId: null }, // MPP
    IND13: { id: 'IND13', prenom: 'Valérie', nom: 'MAMMOSA', sexe: 'F', pereId: null, mereId: null }, // MPM
    IND14: { id: 'IND14', prenom: 'Ludovic', nom: 'HYPPOLITE', sexe: 'M', pereId: null, mereId: null }, // MMP
    IND15: { id: 'IND15', prenom: 'Rolande', nom: 'SERTIER', sexe: 'F', pereId: null, mereId: null }, // MMM
  } as const;  

const historique = [
  { date: '1832-04-12', label: 'Naissance à Basse-Terre' },
  { date: '1851-07-03', label: 'Mariage avec Jean RIVIÈRE' },
  { date: '1862-09-15', label: 'Naissance de Louise RIVIÈRE' },
  { date: '1886-01-01', label: 'Mention dans le recensement de Basse-Terre' },
  { date: '1891-05-22', label: 'Mention dans une donation chez Me DURAND' },
];

export default function IndividuLayout() {
  const [openedTabs, setOpenedTabs] = useState([sampleIndividus[0]]);
  const [activeTabId, setActiveTabId] = useState(sampleIndividus[0].id);
  const [activeSection, setActiveSection] = useState(tabs[0].label);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const closeTab = (id: string) => {
    setOpenedTabs((prev) => prev.filter((tab) => tab.id !== id));
    if (activeTabId === id && openedTabs.length > 1) {
      const newActive = openedTabs.find((tab) => tab.id !== id);
      if (newActive) setActiveTabId(newActive.id);
    }
  };

  const activeIndividu = openedTabs.find((t) => t.id === activeTabId);
  const openIndividu = (id: string) => {
    const existing = openedTabs.find((t) => t.id === id);
    if (existing) {
      setActiveTabId(id);
    } else {
      const found = sampleIndividus.find((t) => t.id === id);
      if (found) {
        setOpenedTabs((prev) => [...prev, found]);
        setActiveTabId(found.id);
      }
    }
  };

  return (
    <div className='flex h-screen flex-col'>
      {openedTabs.length > 1 && (
        <div className='flex items-center space-x-1 bg-gray-100 px-4 py-2 border-b overflow-x-auto'>
          {openedTabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-t text-sm cursor-pointer transition ${
                activeTabId === tab.id
                  ? 'bg-white border border-b-0 border-gray-300 font-medium'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {`${tab.prenom} ${tab.nom}`}
              <X
                className='w-4 h-4 ml-1 hover:text-red-500'
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className='flex items-center justify-between px-6 py-3 border-b bg-white'>
        <div className='flex items-center gap-3'>
          <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer' />
          <CheckCircle className='w-4 h-4 text-green-600' />
          <span className='text-base font-semibold text-gray-800'>
            {activeIndividu?.prenom?.charAt(0).toUpperCase() +
              activeIndividu?.prenom?.slice(1).toLowerCase()}{' '}
            {activeIndividu?.nom}
          </span>
          <span className='text-sm text-gray-500'>
            , {activeIndividu?.lifespan}
            {activeIndividu?.epoux?.length > 0 && (
              <>
                {' '}
                — Époux :{' '}
                {activeIndividu.epoux.map((id, index) => {
                  const person = sampleIndividus.find((i) => i.id === id);
                  return person ? (
                    <button
                      key={id}
                      className='text-blue-600 underline ml-1 hover:text-blue-800'
                      onClick={() => openIndividu(id)}
                    >
                      {person.prenom} {person.nom}
                      {index < activeIndividu.epoux.length - 1 ? ',' : ''}
                    </button>
                  ) : null;
                })}
              </>
            )}
          </span>
        </div>
        <div className='flex items-center gap-4'>
          <button className='flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
            <PlusCircle className='w-4 h-4' /> Ajouter une source
          </button>
          <Mail className='w-5 h-5 text-gray-700 cursor-pointer' />
          <Settings className='w-5 h-5 text-gray-700 cursor-pointer' />
        </div>
      </div>

      <div className='flex items-center gap-8 px-6 text-sm border-b overflow-x-auto bg-white'>
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
            {label}
          </button>
        ))}
      </div>

      <div className='flex flex-1 overflow-hidden'>
        <section className='flex-1 overflow-y-auto p-6 prose prose-sm'>
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
            </div>
          ) : activeSection === 'Synthèse' ? (
            <>
              <div className='space-y-4'>
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
              <h1>Contenu suggéré :</h1>
              <ul>
                <li>Arbre généalogique simplifié</li>
                <li>Liste des membres de la famille avec rôle (parent, enfant, conjoint, etc.)</li>
                <li>Liaisons entre individus, fratrie, alliances</li>
              </ul>
              <p>
                <strong>But :</strong> visualiser rapidement les liens familiaux directs et
                indirects.
              </p>
              <div className='min-h-screen bg-gray-100 flex items-start justify-center p-4'>
                <GenealogyTree individu={individus['IND1']} individus={individus} />
              </div>
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
          ) : activeSection === 'Métiers' ? (
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
            </div>
          ) : activeSection === 'Mentions' ? (
            <div className='space-y-4'>
              <h1>Contenu suggéré :</h1>
              <ul>
                <li>Mentions marginales</li>
                <li>Apparitions dans d’autres actes (témoins, parrains/marraines, etc.)</li>
              </ul>
              <p>
                <strong>But :</strong> identifier les interactions sociales et présences indirectes.
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
              <h1>Contenu suggéré :</h1>
              <ul>
                <li>Graphes de co-présence dans les actes</li>
                <li>Groupes sociaux (paroisse, quartier, profession)</li>
                <li>Visualisation des liens faibles et forts</li>
              </ul>
              <p>
                <strong>But :</strong> comprendre les dynamiques sociales autour de l’individu.
              </p>
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
                <strong>But :</strong> documenter la progression et les raisonnements du chercheur.
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
  );
}
