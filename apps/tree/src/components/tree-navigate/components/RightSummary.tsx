import { Compass, Home } from 'lucide-react'
import { MiniNav } from './ui/MiniNav'
import { PanelTitle } from './ui/PanelTitle'
import { SummarySection } from './ui/SummarySection'

export function RightSummary() {
  return (
    <aside className="hidden h-[calc(100vh-94px)] overflow-auto bg-white lg:block">
      <PanelTitle title="Navigation" />

      <div className="flex justify-center gap-3 border-b border-slate-200 p-4">
        <MiniNav label="Famille" icon={Compass} />
        <MiniNav label="Lignée Sosa" icon={Home} />
      </div>

      <PanelTitle title="Lecture Geniius" />

      <div className="border-b border-slate-200 px-3 py-3">
        <h2 className="font-black">(MAMMOSA) Pierre “Gédéon”</h2>
        <p className="mt-2 text-[12px] leading-5">
          Personne pivot d’une branche réunionnaise issue de l’émancipation.
          Sa trajectoire relie état civil, abolition, recensements et transmissions familiales.
        </p>
      </div>

      <SummarySection title="Fiabilité">
        <p className="text-cyan-700">Source directe pour l’union et les enfants.</p>
        <p className="text-amber-700">Filiation paternelle à consolider.</p>
        <p>1 acte prioritaire à transcrire.</p>
      </SummarySection>

      <SummarySection title="Hypothèses ouvertes">
        <p>Identifier le père biologique.</p>
        <p>Vérifier le lien avec JULIENNE Pierre Louis.</p>
        <p>Confirmer les témoins récurrents autour de la famille.</p>
      </SummarySection>

      <SummarySection title="Pistes de recherche">
        <p>Acte de mariage de 1849.</p>
        <p>Registres des nouveaux libres.</p>
        <p>Recensements de Saint-Paul.</p>
        <p>Hypothèques / successions liées.</p>
      </SummarySection>

      <SummarySection title="Relations immédiates">
        <p className="text-fuchsia-700">♀ (MAMMOSA) Julie (1807–1855)</p>
        <p className="text-fuchsia-700">♀ (AUNEILLE) Louise (1835–1899)</p>
        <p className="text-blue-700">♂ MAMMOSA Pierre Gédéon (1851–1899)</p>
        <p className="text-fuchsia-700">♀ MAMMOSA Marie (1855–1894)</p>
      </SummarySection>

      <SummarySection title="Contexte historique">
        <p>Émancipation par le décret d’abolition de l’esclavage : 1848 · Saint-Paul.</p>
        <p>Statut social : ancien esclave, cultivateur et charretier.</p>
      </SummarySection>
    </aside>
  )
}