// icons.ts
import {
  BedDouble,
  Home,
  Route,
  Milestone,
  Signpost,
  Factory,
  Warehouse,
  LayoutGrid,
  MapPinned,
  Trees,
  Church,
  Building2,
  Landmark,
  MapPin,
  Mountain,
  Layers,
  Map,
  Globe2,
  Flag,
  CircleDashed,
  HelpCircle,
} from 'lucide-react';

export const LIEU_TYPE_ICON: Record<string, any> = {
  chambre: BedDouble,
  maison: Home,
  route: Route,
  rue: Milestone,
  chemin: Signpost,
  établissement: Factory,
  habitation: Warehouse,
  section: LayoutGrid,
  quartier: MapPinned,
  hameau: Trees,
  paroisse: Church,
  ville: Building2,
  commune: Landmark,
  'lieu-dit': MapPin,
  propriete: Warehouse,
  entite_naturelle: Mountain,
  canton: Layers,
  département: Map,
  région: MapPinned,
  province: MapPinned,
  état: Landmark,
  pays: Flag,
  continent: Globe2,
  zone_informelle: CircleDashed,
  autre: HelpCircle,
};

export function getIconForLieuType(type?: string) {
  if (!type) return HelpCircle;
  const key = type.toLowerCase();
  return LIEU_TYPE_ICON[key] ?? HelpCircle;
}

export function getLieuTypeFeminin() {
  return [
    'chambre',
    'maison',
    'route',
    'rue',
    'habitation',
    'section',
    'paroisse',
    'ville',
    'commune',
    'propriete',
    'entite_naturelle',
    'région',
    'province',
    'zone_informelle',
  ];
}
