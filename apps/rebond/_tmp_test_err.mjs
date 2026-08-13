import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

// Petit texte simple pour vérifier d'abord que la fonction répond du tout
// (pas de crash au déploiement, erreur de syntaxe, etc.)
const text = "Aujourd'hui dix février mil huit cent soixante-quinze, à neuf heures du matin, par-devant nous Valluet (Joseph Dorval), Adjoint au Maire, déléguée aux fonctions d'officier de l'état civil de la commune de Deshayes, est comparu le sieur Némorin (Saint-Julien), domicilié en la commune de Sainte-Rose."

const start = Date.now()
const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/extract-assertions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ text }),
})
console.log('status', res.status, 'elapsed(s)', ((Date.now() - start) / 1000).toFixed(1))
const bodyText = await res.text()
console.log('body:', bodyText.slice(0, 3000))
