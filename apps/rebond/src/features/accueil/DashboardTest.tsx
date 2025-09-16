import { useState, type JSX } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MapPin, User, BookOpen } from 'lucide-react';

export default function RebondHomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    window.location.href = `/recherche?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-white to-slate-50 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-20">
          <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            Redonnez vie à votre histoire familiale
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Rebond vous aide à explorer les archives d’état civil et à reconstruire les parcours de vos ancêtres.
          </p>
        </header>

        <section className="relative mb-20">
          <div className="bg-white border border-blue-100 shadow-lg rounded-2xl px-8 py-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <Input
              placeholder="Nom, prénom, lieu ou année…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-lg"
            />
            <Button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 text-lg rounded-md hover:bg-blue-700 flex items-center"
            >
              <Search className="w-5 h-5 mr-2" /> Rechercher
            </Button>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Commencez par une recherche pour voir si des archives mentionnent un membre de votre famille.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">Par où commencer ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              title="Rechercher un ancêtre"
              icon={<User className="w-5 h-5 text-blue-500" />}
              description="Entrez un nom, une date ou un lieu pour explorer les actes indexés."
              link="/recherche"
            />
            <Card
              title="Explorer les lieux"
              icon={<MapPin className="w-5 h-5 text-green-500" />}
              description="Découvrez les archives disponibles dans les communes et sections."
              link="/lieux"
            />
            <Card
              title="Suivre un parcours de vie"
              icon={<BookOpen className="w-5 h-5 text-purple-500" />}
              description="Reconstituez les grandes étapes de vie d’un individu."
              link="/parcours"
            />
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-xl font-semibold text-slate-700 mb-4 text-center">En vedette</h2>
          <p className="text-center text-slate-500 mb-8 text-sm">
            Actes récemment indexés par la communauté
          </p>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-slate-500 text-sm text-center">
            (section à venir)
          </div>
        </section>

        <footer className="mt-20 text-center text-sm text-slate-400">
          Données collaboratives et open source • Rebond, par la communauté
        </footer>
      </div>
    </div>
  );
}

function Card({ title, icon, description, link }: { title: string; icon: JSX.Element; description: string; link: string }) {
  return (
    <Link
      to={link}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 font-semibold text-slate-800">
        {icon}
        {title}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
