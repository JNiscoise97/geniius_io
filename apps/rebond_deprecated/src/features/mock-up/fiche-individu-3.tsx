import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  UsersIcon,
  FileTextIcon,
  ListTreeIcon,
  UserIcon,
  UserPlusIcon,
  LayoutGridIcon,
  BarChart2Icon,
  InfoIcon,
} from 'lucide-react';

export default function FamilleDeSang() {
  return (
    <div className='relative'>
      {/* Table des matières */}
      <aside className='hidden lg:block fixed top-24 left-10 w-64 text-sm space-y-2'>
        <h3 className='text-lg font-semibold mb-2 flex items-center gap-1'>
          <ListTreeIcon className='w-4 h-4' /> Sommaire
        </h3>
        <ul className='space-y-1 text-muted-foreground'>
          <li>
            <a href='#identite-synthese' className='hover:underline'>
              <UserIcon className='inline w-4 h-4 mr-1' /> Synthèse
            </a>
          </li>
          <li>
            <a href='#identite-detail' className='hover:underline'>
              <InfoIcon className='inline w-4 h-4 mr-1' /> Détails
            </a>
          </li>
          <li>
            <a href='#parents' className='hover:underline'>
              <UserPlusIcon className='inline w-4 h-4 mr-1' /> Parents
            </a>
          </li>
          <li>
            <a href='#union' className='hover:underline'>
              <UsersIcon className='inline w-4 h-4 mr-1' /> Union & Enfants
            </a>
          </li>
          <li>
            <a href='#fratrie' className='hover:underline'>
              <LayoutGridIcon className='inline w-4 h-4 mr-1' /> Fratrie
            </a>
          </li>
          <li>
            <a href='#presences' className='hover:underline'>
              <FileTextIcon className='inline w-4 h-4 mr-1' /> Présences documentées
            </a>
          </li>
        </ul>
      </aside>

      <div className='lg:ml-72 max-w-[90%] mx-auto px-6 py-12 space-y-12 text-base leading-relaxed text-foreground'>
        {/* Identité */}
        <section id='identite-synthese' className='space-y-4 scroll-mt-24'>
          <h1 className='text-4xl font-bold tracking-tight flex items-center gap-2'>
            <UserIcon className='w-6 h-6' /> Coundéaman TANJAMA
          </h1>
          <p className='text-muted-foreground'>
            Dossier individuel • Données extraites des actes d’état civil et des recensements
          </p>
          <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-md shadow-sm'>
            <h2 className='text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2'>
              <InfoIcon className='w-5 h-5 text-gray-500' /> Informations synthétiques
            </h2>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm'>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Prénoms</dt>
                <dd className='mt-1 text-gray-800'>Coundéaman, Marie Thérèse</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Noms</dt>
                <dd className='mt-1 text-gray-800'>TANJAMA, TANDIEMAIN (forme ancienne)</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Naissance</dt>
                <dd className='mt-1 text-gray-800'>24 mars 1891 à Saint-Leu</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Décès</dt>
                <dd className='mt-1 text-gray-800'>1er novembre 1975 à Trois-Bassins</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Professions</dt>
                <dd className='mt-1 text-gray-800'>Sans profession</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Statuts</dt>
                <dd className='mt-1 text-gray-800'>Fille d'engagée, épouse</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Parents</dt>
                <dd className='mt-1 text-gray-800'>Covindou TANDIEMAIN (mère), père inconnu</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Fratrie</dt>
                <dd className='mt-1 text-gray-800'>5 frères et sœurs connus</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Union</dt>
                <dd className='mt-1 text-gray-800'>1 union</dd>
              </div>
              <div>
                <dt className='text-sm font-semibold text-gray-900'>Enfants</dt>
                <dd className='mt-1 text-gray-800'>9 enfants connus</dd>
              </div>
            </dl>
          </div>
        </section>

        <Separator />

        {/* Détails Identité */}
        <section id='identite-detail' className='space-y-4 scroll-mt-24'>
          <h2 className='text-2xl font-semibold flex items-center gap-2'>
            <BarChart2Icon className='w-5 h-5' /> Détails sur l'identité
          </h2>
          <ul className='list-disc list-inside space-y-2'>
            <li>
              <strong>Durée de vie :</strong> 84 ans
            </li>
            <li>
              <strong>Âge au mariage :</strong> 20 ans
            </li>
            <li>
              <strong>Durée entre baptême et naissance :</strong> 17 ans — conversion tardive
            </li>
            <li>
              <strong>Lieu principal de vie :</strong> Grande Ravine, Trois-Bassins
            </li>
            <li>
              <strong>Événements notables :</strong> baptême à l’âge adulte, mariage en 1911, 9
              enfants
            </li>
          </ul>
        </section>

        <Separator />

        {/* Parents */}
        <section id='parents' className='scroll-mt-24'>
          <h2 className='text-2xl font-semibold flex items-center gap-2'>
            <UserPlusIcon className='w-5 h-5' /> Parents
          </h2>
          <ul className='list-disc list-inside mt-2 space-y-1'>
            <li>
              <strong>Mère :</strong> Covindou TANDIEMAIN (1868–1955), engagée à Grande Ravine
            </li>
            <li>
              <strong>Père :</strong> Inconnu
            </li>
          </ul>
        </section>

        <Separator />

        {/* Union & enfants */}
        <section id='union' className='scroll-mt-24'>
          <h2 className='text-2xl font-semibold flex items-center gap-2'>
            <UsersIcon className='w-5 h-5' /> Union & Enfants
          </h2>
          <div className='mt-2'>
            <p>
              <strong>Époux :</strong> Antoine Emmanuel Likèr BLUKER (1888–1986)
            </p>
            <p>
              <strong>Mariage :</strong> 24 octobre 1911 à Trois-Bassins
            </p>
          </div>

          <div className='mt-4'>
            <p className='font-medium mb-2'>👶 Enfants :</p>
            <ul className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 list-disc list-inside'>
              <li>Antoine Joseph "Célestin" BLUKER (1913–1943)</li>
              <li>Michel BLUKER (1915–1995)</li>
              <li>Antoine BLUKER (1917–1932)</li>
              <li>Marie Léoncia BLUKER (1920–1932)</li>
              <li>Gaston BLUKER (1923–2013)</li>
              <li>René BLUKER (1925–2001)</li>
              <li>Elianne BLUKER (1928–2019)</li>
              <li>Marie "Paula" BLUKER (1931–2005)</li>
              <li>Noël "Maurice" BLUKER (1933–2002)</li>
            </ul>
          </div>
        </section>

        <Separator />

        {/* Fratrie */}
        <section id='fratrie' className='scroll-mt-24'>
          <h2 className='text-2xl font-semibold flex items-center gap-2'>
            <UsersIcon className='w-5 h-5' /> Fratrie
          </h2>
          <ul className='list-disc list-inside mt-2 space-y-1'>
            <li>Candassamy TANJAMA (1885–1945, demi-frère)</li>
            <li>Barlama Manicon TANJAMA (1889–1967)</li>
            <li>Tévané Canou TANJAMA (1893–1982)</li>
            <li>Savoupaquiom Parkiome Chipek TANJAMA (1895–1992)</li>
            <li>Virassamy ARIAPOUTRY (1897–1897)</li>
          </ul>
        </section>

        <Separator />

        {/* Présences documentées */}
        <section id='presences' className='scroll-mt-24'>
          <h2 className='text-2xl font-semibold flex items-center gap-2'>
            <FileTextIcon className='w-5 h-5' /> Présences documentées
          </h2>
          <ul className='list-disc list-inside mt-2 space-y-1'>
            <li>1907 : Témoin — Recensement de sa mère Covindou</li>
            <li>1908 : Marraine — Baptême de Joseph Étienne "Raphaël" TANJAMA</li>
            <li>1920–1931 : Témoin — Recensements de son mari Antoine BLUKER</li>
            <li>1928 : Marraine — Baptême d’Augustine TANJAMA</li>
            <li>1943 : Témoin — Décès de son fils Antoine Joseph "Célestin"</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
