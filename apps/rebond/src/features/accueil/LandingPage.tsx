// src/pages/LandingPage.tsx
import { useRoleStore } from '@/store/useRoleStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, User, BookOpen } from 'lucide-react';

export function LandingPage() {
  const { role } = useRoleStore();

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto space-y-10">
      
      {/* Bannière */}
      <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg shadow text-center">
        <h1 className="text-3xl font-bold">
          {role === 'visiteur' && 'Bienvenue sur Rebond'}
          {role === 'utilisateur' && 'Votre généalogie évolue'}
          {role === 'admin' && 'Espace d’administration'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {role === 'visiteur' && 'Explorez les archives pour retrouver vos ancêtres.'}
          {role === 'utilisateur' && 'Reprenez vos recherches, complétez vos données et explorez de nouvelles pistes.'}
          {role === 'admin' && 'Supervisez les contributions et la qualité des données.'}
        </p>
      </div>

      {/* Zone d'action rapide */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {role === 'visiteur' && (
          <>
            <Button>Créer un compte</Button>
            <Button variant="outline">Découvrir des exemples</Button>
            <Button variant="ghost">En savoir plus</Button>
          </>
        )}
        {role === 'utilisateur' && (
          <>
            <Button>Mes individus</Button>
            <Button variant="outline">Ajouter un acte</Button>
            <Button variant="ghost">Rechercher</Button>
          </>
        )}
        {role === 'admin' && (
          <>
            <Button>Modérer les transcriptions</Button>
            <Button variant="outline">Voir les statistiques</Button>
            <Button variant="ghost">Gérer les utilisateurs</Button>
          </>
        )}
      </div>

      {/* Encarts dynamiques */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">🔔 Actualités & Ajouts récents</h2>
        <p className="text-muted-foreground">Cette section pourrait afficher les nouveautés du projet, les derniers actes indexés, ou les statistiques mises à jour.</p>
      </div>

      {/* Contenu spécifique au rôle */}
      {role === 'visiteur' && <VisiteurLanding />}
      {role === 'utilisateur' && <UtilisateurLanding />}
      {role === 'admin' && <AdminLanding />}
      
    </div>
  );
}

export function VisiteurLanding() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 pt-10">
      {/* Titre et accroche */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Bienvenue sur Rebond</h1>
        <p className="text-lg text-muted-foreground">
          Et si les archives vous racontaient l’histoire de votre famille ?
        </p>
        <Button size="lg" className="mt-4">Créer un compte</Button>
      </div>

      {/* Recherche simple */}
      <section className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">🔍 Recherche rapide</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <Input placeholder="Nom de famille" />
          <Input placeholder="Commune" />
          <Input placeholder="Période (ex : 1850-1900)" />
          <Button className="md:w-auto w-full">Rechercher</Button>
        </div>
      </section>

      {/* Exemples de fiches */}
      <section>
        <h2 className="text-xl font-semibold mb-4">📄 Exemples de fiches</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle><User className="inline mr-2" />Individu</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Jean Baptiste LEBON (1824-1897)</p>
              <p className="text-sm text-muted-foreground">Saint-Claude, Guadeloupe</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle><BookOpen className="inline mr-2" />Acte de naissance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Marie-Émilie BAPTISTE - 1804</p>
              <p className="text-sm text-muted-foreground">Île Bourbon (La Réunion)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle><User className="inline mr-2" />Fiche libre</CardTitle>
            </CardHeader>
            <CardContent>
              <p>André Stanislas LEBRETON</p>
              <p className="text-sm text-muted-foreground">Libre de couleur - Île de La Réunion</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Encart découverte */}
      <section className="bg-blue-50 dark:bg-blue-950 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">💡 Découvrir Rebond</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle><Video className="inline mr-2" />Tutoriel vidéo</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Une courte vidéo pour comprendre comment Rebond fonctionne.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle><User className="inline mr-2" />Témoignages</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Des utilisateurs racontent leurs découvertes grâce à Rebond.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle><BookOpen className="inline mr-2" />À propos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>La genèse du projet, ses objectifs, et ses perspectives.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}


// Section Utilisateur
function UtilisateurLanding() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Bonjour [prénom], reprenons vos recherches</h1>
            <p className="text-gray-700">Reprenez vos recherches où vous les aviez laissées.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <Button variant="outline">Mes individus</Button>
                <Button variant="outline">Ajouter un acte</Button>
                <Button variant="outline">Mes transcriptions</Button>
                <Button variant="outline">Rechercher</Button>
            </div>
            <section>
                <p>Accès rapide</p>
                <p>Mes individus favoris</p>
                <p>Mes actes favoris</p>
                <p>Mes lieux favoris</p>
            </section>
            <section>
                <p>Encart “Actualité du projet” (zoom sur des mises à jour ou focus éditoriaux)</p>
                <p>Notifications</p>
            </section>
            <section>
                <p>Encart communautaire : derniers ajouts de la communauté, appels à l’aide (crowdsourcing)</p>
            </section>
            {/* Suggestions ou stats personnalisées */}
        </div>
    );
}

// Section Admin
function AdminLanding() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Tableau de bord admin</h1>
            <p className="text-gray-700">Gérez les contributions, les utilisateurs et la qualité des données.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <Button variant="destructive">Modérer les transcriptions</Button>
                <Button>Voir les statistiques</Button>
                <Button>Gérer les utilisateurs</Button>
                <Button>Vérifier les doublons</Button>
            </div>
            <section>
                <p>Vue synthétique</p>
                <p>Nouveaux utilisateurs / dernière connexion</p>
                <p>Volume d’indexations par jour / semaine / mois / an</p>
                <p>Taux de couverture des communes</p>
                <p>Contributions non relues / à valider</p>
            </section>
            
            <section>
                <p>Actions rapides</p>
                <p>Gérer les utilisateurs</p>
                <p>Superviser les validations</p>
                <p>Modifier la taxonomie des lieux / rôles / sources</p>
                <p>Consulter les erreurs système / logs</p>
            </section>
            
            <section>
                <p>Alertes : données incohérentes, actes sans géolocalisation, acteurs sans actes, doublons</p>
            </section>
        </div>
    );
}
