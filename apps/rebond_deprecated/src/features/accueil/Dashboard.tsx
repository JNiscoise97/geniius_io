// Dashboard.tsx

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useRoleStore } from "@/store/useRoleStore"

export default function Dashboard() {
    const { role } = useRoleStore()
  return (
    <><div>
      <h1>Bienvenue</h1>
      {role && <p>Vous êtes {role}.</p>}
    </div><div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Et si les archives vous racontaient l’histoire de votre famille ?</h1>

        <div className="space-x-2">
          <Link to="ac-actes/nouveau/minimal"><Button>Saisir un acte notarié minimal</Button></Link>
          <Link to="ac-actes/nouveau/roulement"><Button>Saisir des actes notariés en roulement</Button></Link>
        </div>

        <div className="space-x-2">
          <Link to="/individus/mention"><Button>Gérer les mentions d'individus</Button></Link>
        </div>

        <div className="space-x-2">
          <Link to="/faq/cycle-de-contribution"><Button>FAQ Cycle de contribution</Button></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Bugs identifiés */}
          <div className="border rounded p-4 bg-red-50">
            <h2 className="text-xl font-semibold mb-4">🐞 Bugs identifiés</h2>
            <table className="w-full text-sm text-red-900">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1">Zone</th>
                  <th className="py-1">Problème</th>
                  <th className="py-1">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TDB erreur</td>
                  <td>requête qui identifie dans une ligne de vie un sexe qui diffère</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Individu</td>
                  <td>update_individus_identite_by_individu_id j'ai créé deux acteurs, je les ai fusionné et le label de l'individu était null</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription - bloc</td>
                  <td>quand j'efface un snippet avec backspace, la surbrillance reste. Problème de synchro de la div surbrillance</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription - bloc</td>
                  <td>ArrowUp ArrowDown permet de changer de div mais bug si bloc multi lignes</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Saisie par roulement</td>
                  <td>réplication par défaut du notaire</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Saisie</td>
                  <td>éviter les doublons d'acte à l'insertion</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Liste des actes</td>
                  <td>largeur des colonnes</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>double insertion d’un bloc à la première visite</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>les flèches haut/bas ignoraient la position colonne</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>quand je suis au milieu d'un bloc et que j'appuie sur Entrée, le bloc doit être coupé en deux</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>menu du bloc (changer de type, dupliquer un bloc, supprimer un bloc, réordonner un bloc)</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>modifier l'ordre d'un bloc par drag and drop</td>
                  <td>Ouvert</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>en BD, problème d'ordre</td>
                  <td>Ouvert</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Évolutions en cours */}
          <div className="border rounded p-4 bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">🚧 Évolutions en cours</h2>
            <table className="w-full text-sm text-blue-900">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1">Zone</th>
                  <th className="py-1">Amélioration</th>
                  <th className="py-1">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ActePreview</td>
                  <td>Résumé - trier dans un ordre donné les acteurs et afficher la bonne info pour les signataires</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Onglet Transcription</td>
                  <td>Adapter le height de AnalyseEditor</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Edit Label</td>
                  <td>je crée une relation (beau-frère) entre deux acteurs (Phoebe et Léo) dans un acte (acte de mariage de Cole et Phoebe) impliquant des tiers individus (Piper) non mentionné, mais, au moment où je crée cette relation implicite, je n'ai pas encore (acte de mariage de Léo et Piper) donc incapable créer le lien avec Piper, comment à posteriori je repasse sur cette relation (Phoebe-Léo) pour créer la relation (Phoebe-Piper) peut-être au moment de la "fusion" d'acteurs en individu</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Edit Label</td>
                  <td>Edit Label pour actes autres de décès</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>IndividuFiche relation</td>
                  <td>Afficher Lien vers les actes</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>IndividuFiche relation</td>
                  <td>champ "relation_déduite" à calculer et dire clairement XX est le "" de YY</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>IndividuFiche relation</td>
                  <td>ambigu et unique</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>IndividuFiche relation</td>
                  <td>mettre en place des filtres par relation_type (parenté, témoin, alliance, voisinage…), par nom, statut</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>IndividuFiche relation</td>
                  <td>Compteur par binôme / relation à afficher dans le header "Relation documentée dans 3 actes"</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Gestion des relations entre deux acteurs</td>
                  <td>remplacer la table staging par une table finale</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Relation implicite</td>
                  <td>Alimenter staging avec les relations implicites</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Gestion du statut d'un acteur</td>
                  <td>Ajouter ce champ dans la table dédié ; gérer le legacy (si acte transcrit, acteurs aussi) ; si modif d'un acteur ou d'un champ de mon acte le statut passe à 'en cours de transcription'</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Suggestion d'acteur</td>
                  <td>afficher si l'acteur courant est déjà lié à un individu, suggestion par défaut à l'ouverture avant toute saisie en fonction du rôle par ex liste des officiers de l'année en cours, suggestion du père en fonction de la mère etc...</td>
                  <td>A faire</td>
                </tr><tr>
                  <td>Transcription</td>
                  <td>Persistance automatique onBlur</td>
                  <td>En cours</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>Réordonnancement des blocs à l’insertion / suppression</td>
                  <td>Stable</td>
                </tr>
                <tr>
                  <td>Transcription</td>
                  <td>Collage multiple transformé en plusieurs blocs</td>
                  <td>Terminé</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Idées */}
          <div className="border rounded p-4 bg-yellow-50">
            <h2 className="text-xl font-semibold mb-4">💡 Idées</h2>
            <table className="w-full text-sm text-yellow-900">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1">Zone</th>
                  <th className="py-1">Proposition</th>
                  <th className="py-1">Priorité</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Blocs</td>
                  <td>Ajout de l’auteur et date de modification</td>
                  <td>📌 Moyenne</td>
                </tr>
                <tr>
                  <td>Interface</td>
                  <td>Drag & drop pour réordonner les blocs</td>
                  <td>📌 Haute</td>
                </tr>
                <tr>
                  <td>Analyse</td>
                  <td>Détection automatique des noms et lieux</td>
                  <td>📌 Basse</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Évolutions à venir */}
          <div className="border rounded p-4 bg-green-50">
            <h2 className="text-xl font-semibold mb-4">📆 Évolutions à venir</h2>
            <table className="w-full text-sm text-green-900">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1">Module</th>
                  <th className="py-1">Évolution</th>
                  <th className="py-1">Prévu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sécurité</td>
                  <td>Gestion multi-utilisateur avec authentification</td>
                  <td>Prochaine version</td>
                </tr>
                <tr>
                  <td>Recherche</td>
                  <td>Recherche plein texte dans les blocs</td>
                  <td>À planifier</td>
                </tr>
                <tr>
                  <td>Historique</td>
                  <td>Historique des modifications (versioning)</td>
                  <td>À étudier</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div></>
  )
}
