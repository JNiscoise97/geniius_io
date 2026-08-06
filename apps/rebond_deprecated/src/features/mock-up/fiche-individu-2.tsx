import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  User,
  ScrollText,
  FileText,
  Info,
  Globe2,
  BrainCog,
  BookOpenCheck,
  NotebookPen,
} from 'lucide-react';
import GenealogyTree from './GenealogyTree';

export default function ProfilIndividu() {
  const [individu] = useState({
    nom: 'Olive ITALIE',
    dates: '1834 — 1874',
    bio: 'Né esclave en 1834 à Sainte-Suzanne, Olive ITALIE est devenu cultivateur libre après l’abolition.',
    statut: 'Affranchi',
    etatCivil: {
      prenomNom: 'Olive ITALIE',
      dates: '1834 – 1874',
      lieux: 'Sainte-Suzanne, Sainte-Marie (La Réunion)',
      professions: 'Cocher, cultivateur, commandeur, bazardier',
      statuts: 'Esclave → Affranchi (1848), Marié',
      parents: 'Mère connue, père inconnu',
      fratrie: 'Prosper ITALIE (frère)',
      enfants: '8 enfants dont un fils'
    },
    ligneDeVie: [
      { date: '1834', event: 'Naissance à Sainte-Suzanne (esclave de MOREL)' },
      { date: '1840', event: 'Décès de sa mère' },
      { date: '1848', event: 'Émancipation par décret' },
      { date: '1856', event: 'Mariage avec Fébronie' },
      { date: '1858–1870', event: 'Naissances des enfants' },
      { date: '1874', event: 'Décès à Sainte-Marie' },
    ],
    entourage: [
      { role: 'Conjointe', nom: 'Fébronie' },
      { role: 'Frère', nom: 'Prosper ITALIE' },
      { role: 'Mère', nom: 'Inconnue' },
      { role: 'Père', nom: 'Inconnu' },
      { role: 'Témoin', nom: 'Non identifié' },
      { role: 'Marraine', nom: 'Non identifiée' },
    ],
    documents: [
      { titre: 'Acte de naissance 1834', type: 'Naissance' },
      { titre: 'Acte de mariage 1856', type: 'Mariage' }
    ]
  });

  return (
    <div className="min-h-screen py-10 px-6 md:px-12 xl:px-32 space-y-14 text-neutral-800 max-w-7xl mx-auto">
      {/* En-tête narratif */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight leading-snug">{individu.nom}</h1>
          <p className="text-muted-foreground italic">{individu.dates}</p>
          <p className="mt-4 text-base max-w-xl leading-relaxed text-neutral-700">{individu.bio}</p>
          <Badge className="mt-4 bg-green-600 text-white shadow">{individu.statut}</Badge>
        </div>
      </div>

      {/* Fiche identité */}
      <Card className="rounded-2xl shadow-md hover:shadow-lg transition p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.entries(individu.etatCivil).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label.replace(/([a-z])([A-Z])/g, '$1 $2')}</p>
            <p className="text-base font-medium mt-1 text-neutral-900 leading-snug">{value}</p>
          </div>
        ))}
      </Card>

      {/* Ligne de vie */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" /> Ligne de vie
        </h2>
        <ol className="border-l-2 border-primary/60 pl-6 space-y-4">
          {individu.ligneDeVie.map(({ date, event }) => (
            <li key={date} className="relative group cursor-pointer hover:bg-muted/20 rounded-md p-2 transition">
              <div className="absolute -left-[1.15rem] top-2 w-4 h-4 rounded-full bg-primary shadow"></div>
              <p className="font-semibold text-primary text-sm">{date}</p>
              <p className="ml-1 text-sm text-muted-foreground group-hover:text-foreground transition">{event}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Réseau relationnel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-primary" /> Réseau relationnel
        </h2>
        <div className="bg-white rounded-xl p-6 shadow-md">
          <p className="text-sm text-muted-foreground">Visualisation interactive à venir : parents, enfants, conjoints, parrains, témoins…</p>
        </div>
        <GenealogyTree />
      </section>

      {/* Carte géohistorique */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Carte géohistorique
        </h2>
        <div className="rounded-xl overflow-hidden shadow-md">
          <img src="/mock-map.jpg" alt="Carte des lieux de vie d'Olive" className="w-full h-64 object-cover" />
        </div>
      </section>

      {/* Documents liés */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Documents liés
        </h2>
        <div className="space-y-3">
          {individu.documents.map((doc, idx) => (
            <Card key={idx} className="px-6 py-4 flex justify-between items-center rounded-xl shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-neutral-900">{doc.titre}</span>
              </div>
              <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground">{doc.type}</Badge>
            </Card>
          ))}
        </div>
      </section>

      {/* Faits remarquables & hypothèses */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-primary" /> Faits & hypothèses
        </h2>
        <ul className="space-y-2 pl-4 list-disc text-sm text-neutral-700">
          <li>Olive a probablement travaillé pour son ancien maître après l’abolition.</li>
          <li>L’origine du nom ITALIE reste inconnue, mais d’autres esclaves affranchis portaient des noms géographiques.</li>
        </ul>
      </section>

      {/* Analyse IA */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BrainCog className="w-5 h-5 text-primary" /> Analyse IA
        </h2>
        <div className="bg-muted rounded-xl p-4 text-sm leading-relaxed text-muted-foreground">
          Olive ITALIE a été affranchi à 14 ans, un âge jeune comparé à la moyenne. Il est devenu commandeur puis propriétaire de son activité, ce qui suggère une trajectoire sociale ascendante rare dans son environnement.
        </div>
      </section>

      {/* Notes personnelles */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <NotebookPen className="w-5 h-5 text-primary" /> Journal de recherche
        </h2>
        <div className="bg-white rounded-xl shadow p-4 space-y-2 text-sm">
          <p>✔️ Relecture des actes notariés prévue (cf. dossier Dolé)</p>
          <p>📝 À creuser : origine du prénom Fébronie + filiation de Prosper</p>
          <p>📩 Mail envoyé à un cousin potentiel via Geneanet (en attente de réponse)</p>
        </div>
      </section>
    </div>
  );
}
