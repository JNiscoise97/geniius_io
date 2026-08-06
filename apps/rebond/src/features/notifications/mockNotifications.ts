import type { Notification } from './types'

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    kind: 'task',
    title: 'Nouvelle source à qualifier',
    description: 'Un acte de mariage de 1861 a été importé et attend une qualification.',
    createdAt: minutesAgo(12),
    read: false,
    to: '/patrimoine-documentaire',
  },
  {
    id: '2',
    kind: 'success',
    title: 'Transcription terminée',
    description: 'La transcription de « Acte de vente, 1872 » est prête à être relue.',
    createdAt: minutesAgo(50),
    read: false,
  },
  {
    id: '3',
    kind: 'warning',
    title: 'Incohérence détectée',
    description: 'Deux dates de naissance différentes pour Marguerite Fresnais.',
    createdAt: minutesAgo(180),
    read: false,
  },
  {
    id: '4',
    kind: 'info',
    title: 'Corpus mis à jour',
    description: '« Familles du Trégor » compte désormais 42 documents.',
    createdAt: minutesAgo(60 * 24),
    read: true,
  },
  {
    id: '5',
    kind: 'task',
    title: 'Proposition de réconciliation',
    description: 'Deux fiches « Yves Le Gallo » pourraient être fusionnées.',
    createdAt: minutesAgo(60 * 24 * 2),
    read: true,
  },
]
