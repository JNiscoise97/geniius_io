import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Home, MapPin, UserIcon, Users, Waves } from "lucide-react"

export default function PageIndividu() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8 space-y-10">
      {/* Header immersif */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">Jean-Baptiste Lacour</h1>
        <p className="text-gray-600 italic">Un homme de Bisdary, entre actes et héritages (1842–1847)</p>
      </motion.div>

      {/* Narrateur de trajectoires de vie */}
      <div className="bg-white p-6 rounded-lg border shadow">
        <h2 className="text-xl font-semibold mb-2">📘 Trajectoire de vie (synthèse narrative)</h2>
        <p className="text-sm text-gray-800">
          Jean-Baptiste Lacour est mentionné pour la première fois en 1842, vendeur à Bisdary. Il signe l’acte, ce qui indique qu’il sait écrire. En 1845, il transmet un bien à son épouse Marie-Anne, peut-être dans un souci de protection familiale. Enfin, en 1847, il est désigné comme défunt dans un acte de succession, signalant la fin de sa présence dans les sources. Entre ces dates, il est impliqué dans des transactions foncières et semble entouré de proches actifs dans son quartier.
        </p>
      </div>

      {/* Carte orbitale enrichie de l’environnement spatial */}
      <div className="bg-white p-6 rounded-lg border shadow">
        <h2 className="text-xl font-semibold mb-4">🌍 Environnement spatial – Vue orbitale</h2>
        <div className="relative w-full h-[650px] flex items-center justify-center">
          {/* Centre : individu */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-600">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center text-sm mt-2 font-semibold">Jean-Baptiste</div>
          </div>

          {/* Cercle 1 – Habitations */}
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border border-dashed border-blue-200 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-[50%] top-0 transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <Home className="w-4 h-4 text-blue-700 mx-auto" />
              <strong className="text-blue-700">Habitation Morin</strong><br />
              <span className="text-gray-500">présence confirmée</span><br />
              <Users className="inline w-4 h-4 text-blue-500" /> 2
            </div>
            <div className="absolute left-[85%] top-[60%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <Home className="w-4 h-4 text-green-700 mx-auto" />
              <strong className="text-green-700">Maison Lafitte</strong><br />
              <span className="text-gray-500">voisin direct</span><br />
              <Users className="inline w-4 h-4 text-green-500" /> 1
            </div>
            <div className="absolute left-[15%] top-[70%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <Waves className="w-4 h-4 text-cyan-700 mx-auto" />
              <strong className="text-cyan-700">Rivière Ti Trou</strong><br />
              <span className="text-gray-500">limite sud</span>
            </div>
          </div>

          {/* Cercle 2 – Hameaux */}
          <div className="absolute top-1/2 left-1/2 w-[460px] h-[460px] border border-dashed border-purple-300 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-[25%] top-[10%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <MapPin className="w-4 h-4 text-purple-600 mx-auto" />
              <strong className="text-purple-600">St-Jean</strong><br />
              <Users className="inline w-4 h-4 text-purple-500" /> 3
            </div>
            <div className="absolute left-[80%] top-[75%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <MapPin className="w-4 h-4 text-purple-400 mx-auto" />
              <strong className="text-purple-400">Cadet</strong><br />
              <Users className="inline w-4 h-4 text-purple-300" /> 0
            </div>
          </div>

          {/* Cercle 3 – Quartier et commune */}
          <div className="absolute top-1/2 left-1/2 w-[620px] h-[620px] border border-dashed border-orange-300 rounded-full transform -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-[10%] top-[50%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <MapPin className="w-4 h-4 text-orange-600 mx-auto" />
              <strong className="text-orange-600">Quartier Rifflet</strong><br />
              <Users className="inline w-4 h-4 text-orange-500" /> 7
            </div>
            <div className="absolute left-[90%] top-[20%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <MapPin className="w-4 h-4 text-orange-400 mx-auto" />
              <strong className="text-orange-400">Commune Deshaies</strong><br />
              <Users className="inline w-4 h-4 text-orange-300" /> 18
            </div>
            <div className="absolute left-[50%] top-[100%] transform -translate-x-1/2 -translate-y-1/2 text-center text-xs">
              <Waves className="w-4 h-4 text-cyan-500 mx-auto" />
              <strong className="text-cyan-500">Mer des Caraïbes</strong><br />
              <span className="text-gray-500">limite ouest</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-center mt-4 text-gray-500 italic max-w-3xl mx-auto">
          Cette carte orbitale structure l’espace vécu autour de Jean-Baptiste. Les couleurs indiquent le type d’entité (habitation, hameau, cours d’eau, quartier, commune). Le nombre d’individus permet de visualiser l’intensité de présence autour de lui à différents niveaux. Cliquez pour explorer plus de détails (à venir).
        </p>
      </div>


      {/* Timeline visuelle avec avatars */}
      <div className="overflow-x-auto py-6">
        <h2 className="text-xl font-semibold mb-4">🧬 Ligne de vie familiale</h2>
        <div className="flex gap-10 items-center">
          {/* Jean-Baptiste */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm mt-2 font-semibold">Jean-Baptiste</span>
            <span className="text-xs text-gray-500">1842 – 1847</span>
          </div>

          {/* Épouse */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-sm mt-2 font-semibold">Marie-Anne</span>
            <span className="text-xs text-gray-500">1838 – 1854</span>
          </div>

          {/* Fils */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm mt-2 font-semibold">Louis</span>
            <span className="text-xs text-gray-500">~1835 – après 1855</span>
          </div>
        </div>
      </div>

      {/* Timeline horizontale */}
      <div className="overflow-x-auto whitespace-nowrap py-4">
        <div className="inline-flex gap-6">
          <div className="bg-white border shadow rounded p-4 min-w-[250px]">
            <p className="text-sm">📍 <strong>1842</strong> – Vendeur à Bisdary<br/>Signature → sait écrire</p>
          </div>
          <div className="bg-white border shadow rounded p-4 min-w-[250px]">
            <p className="text-sm">📍 <strong>1845</strong> – Donation à sa femme</p>
          </div>
          <div className="bg-white border shadow rounded p-4 min-w-[250px]">
            <p className="text-sm">📍 <strong>1847</strong> – Mentionné comme défunt dans une succession</p>
          </div>
        </div>
      </div>

      {/* Ligne de vie géographique */}
      <div className="bg-white rounded-lg p-6 border shadow">
        <h2 className="text-xl font-semibold mb-2">🧭 Ligne de vie géographique</h2>
        <ul className="text-sm list-disc ml-5">
          <li>🗺️ 1842 : Bisdary (Habitation Dolé) – Vente d’un terrain hérité</li>
          <li>🗺️ 1845 : Dolé – Donation d’un bien à son épouse</li>
          <li>🗺️ 1847 : Dolé – Acte de succession (décès présumé)</li>
        </ul>
      </div>

      {/* Historique des biens */}
      <div className="bg-gray-50 rounded-lg p-6 border shadow">
        <h2 className="text-xl font-semibold mb-2">🏠 Biens associés & transmission</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th>Bien</th>
              <th>Acquisition</th>
              <th>Année</th>
              <th>Source</th>
              <th>Destin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Terrain à Dolé</td>
              <td>Héritage</td>
              <td>1842</td>
              <td>Succession</td>
              <td>Vendu en 1845</td>
            </tr>
            <tr>
              <td>Case en ville</td>
              <td>Achat</td>
              <td>1840 ?</td>
              <td>Vente (non retrouvée)</td>
              <td>Non retrouvé</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Constellation familiale */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded shadow">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">👥 Famille connue</h2>
        <ul className="text-sm text-blue-900 list-disc ml-6">
          <li>Épouse : Marie-Anne Dupuis (connue de 1838 à 1854)</li>
          <li>Fils : Louis Lacour (né ~1835, témoin en 1855)</li>
          <li>Mère : inconnue (non mentionnée dans les actes retrouvés)</li>
        </ul>
      </div>

      {/* Graphe relationnel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 rounded-lg p-6 border"
      >
        <h2 className="text-2xl font-semibold mb-2">🕸️ Réseau social & interactions</h2>
        <ul className="text-sm list-disc ml-5">
          <li>Notaire Louis Dupont — rédacteur des actes</li>
          <li>Marie Lafitte — voisine citée dans deux actes</li>
          <li>Pierre Martin — associé dans une transaction foncière</li>
        </ul>
      </motion.div>

      {/* Corrélations multi-actes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded border shadow"
      >
        <h2 className="text-xl font-semibold mb-2">🧠 Corrélations détectées</h2>
        <p className="text-sm">
          Le cycle <strong>héritage → donation → vente</strong> se répète dans cette lignée. Les enfants de Jean-Baptiste vendent un bien hérité moins de 2 ans après sa mort.
        </p>
      </motion.div>

      {/* Anomalies & Signaux faibles */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
        <h2 className="text-xl font-semibold text-red-700 mb-2">🔍 Anomalies détectées</h2>
        <ul className="text-sm text-red-900 list-disc ml-6">
          <li>Présence dans deux lieux éloignés en 1845</li>
          <li>Absence de signature dans un acte (inhabituel)</li>
        </ul>
      </div>

      {/* Documents & Mentions */}
      <div className="bg-gray-100 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-2">📜 Mentions et sources</h2>
        <ul className="text-sm list-disc ml-5">
          <li>Acte de vente, 1842 — Bisdary</li>
          <li>Acte de donation, 1845 — Dolé</li>
          <li>Acte de succession, 1847 — Dolé</li>
        </ul>
        <Button className="mt-4" variant="outline">Voir les extraits liés</Button>
      </div>

      {/* Notes et hypothèses */}
      <div className="bg-yellow-50 p-6 rounded border">
        <h2 className="text-xl font-semibold mb-2">✍️ Notes et hypothèses</h2>
        <p className="text-sm text-gray-800">
          Il est probable que Jean-Baptiste ait hérité de son père, bien que l’acte source soit manquant. La vente de 1845 par sa veuve pourrait impliquer une stratégie familiale pour préserver un autre bien transmis aux enfants. À creuser : sa possible fratrie, jamais citée.
        </p>
      </div>
    </div>
  )
}
