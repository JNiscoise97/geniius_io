// enrichirActeurs.ts
import type { ActeurEnrichiFields } from '@/types/analyse';
import { parseISO } from 'date-fns';
import { subMonths } from 'date-fns';

export function enrichirLien(
    acteur: ActeurEnrichiFields,
    acteursDuMêmeActe: ActeurEnrichiFields[],
  ): string | undefined {
    const role = acteur.role?.toLowerCase();
  
    const trouverNomPrenom = (r: string): string | undefined => {
      const cible = acteursDuMêmeActe.find((a) => a.role?.toLowerCase() === r);
      if (!cible) return;
      const nom = cible.nom?.trim();
      const prenom = cible.prenom?.trim();
      if (nom || prenom) return [prenom, nom].filter(Boolean).join(' ');
    };
  
    const pere = trouverNomPrenom('père');
    const mere = trouverNomPrenom('mère');
    const epouxPere = trouverNomPrenom('époux-père');
    const epouxMere = trouverNomPrenom('époux-mère');
    const epousePere = trouverNomPrenom('épouse-père');
    const epouseMere = trouverNomPrenom('épouse-mère');
  
    const lienParFiliation = (p?: string, m?: string) => {
      if (p || m) {
        const parts = [];
        if (p) parts.push(`de ${p}`);
        if (p && m) parts.push(`et `);
        if (m) parts.push(`de ${m}`);
        return `enfant ${parts.join(' ')}`;
      }
    };
  
    const lienParConjoint = (partenaire?: string, sexe?: 'M' | 'F') => {
      if (partenaire) {
        return sexe === 'M' ? `conjoint de ${partenaire}` : `conjointe de ${partenaire}`;
      }
    };
  
    switch (role) {
      case 'enfant':
      case 'défunt':
        return lienParFiliation(acteur.pere_est_cite ? pere : undefined, acteur.mere_est_citee ? mere : undefined);
  
      case 'époux':
        return lienParFiliation(acteur.pere_est_cite ? epouxPere : undefined, acteur.mere_est_citee ? epouxMere : undefined);
  
      case 'épouse':
        return lienParFiliation(acteur.pere_est_cite ? epousePere : undefined, acteur.mere_est_citee ? epouseMere : undefined);
  
      case 'père':
        return lienParConjoint(mere, 'M');
  
      case 'mère':
        return lienParConjoint(pere, 'F');
  
      case 'époux-père':
        return lienParConjoint(epouxMere, 'M');
  
      case 'époux-mère':
        return lienParConjoint(epouxPere, 'F');
  
      case 'épouse-père':
        return lienParConjoint(epouseMere, 'M');
  
      case 'épouse-mère':
        return lienParConjoint(epousePere, 'F');
  
      default:
        return undefined;
    }
  }
  


export function enrichirDateNaissanceEstimee(acteur: ActeurEnrichiFields): string | null {
    const rolesAvecDateNaissance = ['enfant', 'époux', 'épouse', 'enfant légitimé', 'défunt'];
  
    const hasNaissanceDate = acteur.naissance_date?.trim();
    const acteDate = acteur.acte_date?.trim() ?? null;
    const acteAnnee = acteDate?.slice(0, 4);
    const ageStr = acteur.age?.trim() ?? '';
    const isAgeInMonths = ageStr.match(/^(\d+)m$/);
    const ageInYears = ageStr.match(/^\d+$/) ? parseInt(ageStr, 10) : null;
  
    const role = acteur.role?.toLowerCase() ?? '';
    const estVivant = acteur.est_vivant;
  
    let date_naissance_estimee: string | null = null;
  
    // Règle 1 : Naissance déclarée
    if (rolesAvecDateNaissance.includes(role) && hasNaissanceDate) {
      date_naissance_estimee = acteur.naissance_date!;
    }
  
    // Règle 2 : Âge en mois (type "3m") => calcul depuis la date de l'acte
    else if (acteDate && isAgeInMonths) {
      const nbMois = parseInt(isAgeInMonths[1], 10);
      try {
        const estimatedDate = subMonths(parseISO(acteDate), nbMois);
        date_naissance_estimee = `vers ${estimatedDate.getFullYear()}`;
      } catch {
        date_naissance_estimee = null;
      }
    }
  
    // Règle 3 : Âge en années
    else if (
      acteAnnee &&
      ageInYears !== null &&
      (estVivant !== false || role.includes('défunt'))
    ) {
      date_naissance_estimee = `vers ${parseInt(acteAnnee) - ageInYears}`;
    }
  
    return date_naissance_estimee;
  }
  