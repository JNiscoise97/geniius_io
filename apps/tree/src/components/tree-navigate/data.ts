import {
  Archive,
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Database,
  FileText,
  Home,
  Info,
  Library,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  TreePine,
} from 'lucide-react'

import type { FamilyView, MainTab } from './types'

export const mainTabs: { key: MainTab; label: string }[] = [
  { key: 'famille', label: 'Famille' },
  { key: 'saisie', label: 'Saisie' },
  { key: 'histoire', label: 'Histoire' },
  { key: 'recherches', label: 'Recherches' },
  { key: 'graphiques', label: 'Graphiques' },
]

export const familyViews: { key: FamilyView; label: string }[] = [
  { key: 'noyau', label: 'Noyau familial' },
  { key: 'ascendance', label: 'Ascendance' },
  { key: 'descendance', label: 'Descendance' },
]

export const toolbar = [
  { icon: Cloud, label: 'Nouveautés' },
  { icon: Database, label: 'Online' },
  { icon: Share2, label: 'Publier' },
  { icon: Bell, label: 'Alertes' },
  { icon: ArrowLeft, label: 'Précédent' },
  { icon: ChevronRight, label: 'Suivant' },
  { icon: Home, label: 'Accueil' },
  { icon: Plus, label: 'Ajouter' },
  { icon: Pencil, label: 'Saisir' },
  { icon: Trash2, label: 'Supprimer' },
  { icon: CheckCircle2, label: 'Cohérence' },
  { icon: Search, label: 'Rechercher' },
  { icon: Archive, label: 'Archives' },
  { icon: Library, label: 'Dictionnaires' },
  { icon: TreePine, label: 'Arbres' },
  { icon: FileText, label: 'Fiches' },
  { icon: BookOpen, label: 'Livres' },
  { icon: Info, label: 'Infos' },
]

export const people = [
  ['TOURANGE Elina', '1844–1845', '♀'],
  ['ARMEL Marie Eugénie', '1844–', '♀'],
  ['ROBERT Marie Désirée Soulange', '1844–1878', '♀'],
  ['BERNIER Privat Léonce', '1844–1847', '♂'],
  ['TÉCHER Étienne', '1844–1899', '♂'],
  ['PAYET Louis Alfred', '1844–1915', '♂'],
  ['MAMMOSA Vincent', '1845–1869', '♂'],
  ['MAMMOSA Pierre Gédéon', '1851–1899', '♂'],
  ['MAMMOSA Marie', '1855–1894', '♀'],
  ['AUNEILLE Louise', '1835–1899', '♀'],
  ['JULIENNE Pierre Louis', '1776–1853', '♂'],
  ['? SANS NOM Esther', '1775–1827', '♀'],
]

export const descendants = [
  ['MAMMOSA Pierre Gédéon', 'N : 1833 · D : 1862'],
  ['MAMMOSA Pierre Gédéon', '1851–1899'],
  ['MAMMOSA Philippe Eugène', '1871–1881'],
  ['MAMMOSA Aline', '1874–'],
  ['BOURGOGNE Pierre Augustin', '1907–1958'],
  ['DORVAL Joseph', '1932–2017'],
  ['DORVAL Jean Hugues', '1964–'],
  ['DORVAL Mathias', '1966–'],
]

export const searchResults = [
  ['HADAMAR', 'Félix', '07.02.1875', 'Saint-Paul (Réunion)', '> 1927', ''],
  ['BOISDUR', 'Joseph Léonel', '16.04.1875', 'Le Gosier (Guadeloupe)', '', ''],
  ['HIPPOLYTE', 'Auguste', '06.01.1877', 'Saint-Paul (Réunion)', '> 1902', ''],
  ['MAMMOSA', 'Joséphine', '17.11.1878', 'Saint-Leu (Réunion)', '> 1931', ''],
]

export const events = [
  ['Naissance', '1833', '', 'Saint-Paul'],
  ['Émancipation par décret d’abolition', '1848', '15', 'Saint-Paul'],
  ['Mariage', '1849', '16', 'Saint-Paul'],
  ['Décès', '1862', '29', 'Saint-Paul'],
]