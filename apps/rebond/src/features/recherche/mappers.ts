// mappers.ts
import { displayRole } from '@/lib/role';
import { displayNotaireNom } from '@/lib/nom';
import { getRegistreLabel } from '@/features/etat-civil/suivi/BureauRegistres';
import { getIconForLieuType, getLieuTypeFeminin } from '@/features/recherche/searchLieuxIcons';

export const mapIndividu = (x: any) => ({
  ...x,
  label: [x.prenom, x.nom].filter(Boolean).join(' '),
});

export const mapActeur = (x: any) => ({
  ...x,
  label: [x.prenom, x.nom].filter(Boolean).join(' '),
  roleLabel: `mentionné${x.sexe === 'F' ? 'e' : ''} dans l'acte${x.role === 'mention' ? '' : ` en tant que ${displayRole(x.role)}`}`,
});

export const mapNotaire = (x: any) => ({
  ...x,
  label: [x.titre, x.prenom, x.nom].filter(Boolean).join(' '),
  exercice: `ayant exercé à ${x.lieu_exercice}`,
});

export const mapDocument = (x: any) => ({
  ...x,
  documentLabel: x.acte_label ? x.acte_label.charAt(0).toUpperCase() + x.acte_label.slice(1) : '',
  notaireLabel: x.source_table === 'etat_civil_actes'
    ? null
    : `conservé par ${displayNotaireNom(x.notaire_titre, x.notaire_nom, x.notaire_prenom)}`,
  registreLabel: x.source_table === 'etat_civil_actes'
    ? getRegistreLabel(x.registre_type_acte, x.registre_statut_juridique)
    : null,
  bureauLabel: x.source_table === 'etat_civil_actes'
    ? `enregistré à la ${x.bureau_nom} (${x.bureau_departement})`
    : null,
});

export const mapLieu = (x: any) => {
  const Icon = getIconForLieuType(x.lieu_type);
  return {
    ...x,
    lieuIcon: Icon,
    nbMentionsLabel: `${x.lieu_type !== 'autre' ? `${x.lieu_type} ` : ''}mentionné${getLieuTypeFeminin().includes(x.lieu_type) ? 'e' : ''} ${x.mentions_count} fois dans ${x.distinct_acte_source_count} document${x.distinct_acte_source_count > 1 ? 's' : ''}`,
  };
};
