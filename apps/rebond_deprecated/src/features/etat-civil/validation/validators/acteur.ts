// features/etat-civil/validation/validators/acteur.ts
import {
  ROLES_TOUJOURS_ABSENTS,
  ROLES_TOUJOURS_PRES,
  ROLES_PARENTS_COND,
  ROLES_MULTI,
  ROLES_AGE_OBLIG,
  ROLES_FILIATION,
} from '../constants';
import { heureValide, isNullish, labelActeur } from '../helpers';
import type { Acte, Acteur, Incoherence, RelationPreview } from '../types';

export type Ctx = { acte: Acte; entites: Acteur[]; relations: RelationPreview[] };

// 1) Champs texte minimaux
export function vChampsTexteObligatoires(a: Acteur, _ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const must = [
    { key: 'sexe', msg: 'sexe manquant', level: 'error' as const },
    { key: 'role', msg: 'rôle manquant', level: 'error' as const },
    { key: 'nom', msg: 'nom manquant', level: 'warning' as const },
    { key: 'prenom', msg: 'prénom manquant', level: 'warning' as const },
  ];
  for (const m of must) {
    const v = a[m.key as keyof Acteur];
    if (typeof v !== 'string' || v.trim() === '') {
      out.push({ acteurId: a.id, acteurLabel: l, message: m.msg, level: m.level });
    }
  }
  return out;
}

// 2) Multi par rôle
export function vMultiParRole(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const role = a.role ?? '';
  const countSame = ctx.entites.filter(e => e.role === role).length;
  const isMultiRole = ROLES_MULTI.includes(role as any);

  if (!isMultiRole && !isNullish(a.multi)) {
    out.push({
      acteurId: a.id,
      acteurLabel: l,
      message: `Le champ 'multi' ne devrait pas être renseigné pour un rôle de type ${role}`,
      level: 'error',
    });
  }
  if (isMultiRole && countSame > 1 && !a.multi) {
    out.push({
      acteurId: a.id,
      acteurLabel: l,
      message: `Le champ 'multi' est requis car plusieurs acteurs ont le rôle '${role}'`,
      level: 'error',
    });
  }
  if (isMultiRole && countSame === 1 && !isNullish(a.multi)) {
    out.push({
      acteurId: a.id,
      acteurLabel: l,
      message: `Le champ 'multi' ne devrait pas être renseigné car l'acteur est seul avec le rôle '${role}'`,
      level: 'error',
    });
  }
  return out;
}

// 3) Parents cités
export function vParentsCites(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const role = a.role || '';
  const typeActe = ctx.acte.type_acte;

  const rolesCibles = ['enfant', 'enfant légitimé', 'époux', 'épouse', 'défunt'];

  const mappingPere: Record<string, string[]> = {
    enfant: ['père'],
    défunt: ['père'],
    'enfant légitimé': ['époux'],
    époux: ['époux-père'],
    épouse: ['épouse-père'],
  };
  const mappingMere: Record<string, string[]> = {
    enfant: ['mère'],
    défunt: ['mère'],
    'enfant légitimé': ['épouse'],
    époux: ['époux-mère'],
    épouse: ['épouse-mère'],
  };

  const hasPere = mappingPere[role]?.some(r => ctx.entites.some(e => e.role === r)) ?? false;
  const hasMere = mappingMere[role]?.some(r => ctx.entites.some(e => e.role === r)) ?? false;

  // Cas particulier : sujet
  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      if (a.pere_est_cite !== true && a.pere_est_cite !== false) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'père cité' est requis pour un sujet dans un acte de reconnaissance`, level: 'error' });
      }
      if (a.mere_est_citee !== true && a.mere_est_citee !== false) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'mère citée' est requis pour un sujet dans un acte de reconnaissance`, level: 'error' });
      }
    } else {
      if (!isNullish(a.pere_est_cite)) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'père cité' ne doit pas être renseigné pour un sujet dans un acte de type autre que reconnaissance`, level: 'error' });
      }
      if (!isNullish(a.mere_est_citee)) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'mère citée' ne doit pas être renseigné pour un sujet dans un acte de type autre que reconnaissance`, level: 'error' });
      }
    }
    return out;
  }

  // Autres rôles
  if (!rolesCibles.includes(role)) {
    if (!isNullish(a.pere_est_cite)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'père cité' ne devrait pas être renseigné pour ce rôle`, level: 'error' });
    }
    if (!isNullish(a.mere_est_citee)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'mère citée' ne devrait pas être renseigné pour ce rôle`, level: 'error' });
    }
  } else {
    if (a.pere_est_cite !== true && a.pere_est_cite !== false) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'père cité' est requis mais non renseigné`, level: 'error' });
    }
    if (a.pere_est_cite && !hasPere) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Aucun acteur avec le rôle 'père' présent dans l'acte`, level: 'error' });
    }
    if (a.mere_est_citee !== true && a.mere_est_citee !== false) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ 'mère citée' est requis mais non renseigné`, level: 'error' });
    }
    if (a.mere_est_citee && !hasMere) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Aucun acteur avec le rôle 'mère' présent dans l'acte`, level: 'error' });
    }

    if (role === 'enfant' && a.pere_est_cite === false && a.mere_est_citee === false) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Aucun parent n'est renseigné pour cet enfant`, level: 'warning' });
    }
    if (role === 'enfant légitimé' && a.pere_est_cite === false && a.mere_est_citee === false) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Les deux parents devraient être renseignés pour cet enfant`, level: 'warning' });
    }
  }

  return out;
}

// 4) Est déclarant
export function vEstDeclarant(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const rolesDeclarants = ['père', 'mère', 'déclarant'];
  const typeSansDeclarant = ['mariage', 'décès'];
  const role = a.role || '';
  const typeActe = ctx.acte.type_acte;

  if (typeSansDeclarant.includes(typeActe) || !rolesDeclarants.includes(role)) {
    if (!isNullish(a.est_declarant)) {
      out.push({
        acteurId: a.id, acteurLabel: l,
        message: `Le champ "est_declarant" ne devrait pas être renseigné pour un rôle ${role} dans un acte de type ${typeActe}`,
        level: 'error',
      });
    }
  }

  if (rolesDeclarants.includes(role) && !typeSansDeclarant.includes(typeActe)) {
    if (a.est_declarant !== true && a.est_declarant !== false) {
      out.push({
        acteurId: a.id, acteurLabel: l,
        message: `Le champ "est_declarant" doit être renseigné (true ou false) pour le rôle ${role}`,
        level: 'error',
      });
    }
  }

  if (rolesDeclarants.includes(role) && !typeSansDeclarant.includes(typeActe)) {
    const declarants = ctx.entites.filter(e => e.role === 'déclarant');
    if (declarants.length > 0) {
      if ((role === 'père' || role === 'mère') && a.est_declarant === true) {
        out.push({
          acteurId: a.id, acteurLabel: l,
          message: `"est_declarant" doit être false pour ${role} s'il existe déjà un déclarant`,
          level: 'error',
        });
      }
      if (role === 'déclarant' && a.est_declarant !== true) {
        out.push({
          acteurId: a.id, acteurLabel: l,
          message: `"est_declarant" doit être true pour le déclarant principal`,
          level: 'error',
        });
      }
    }
  }

  return out;
}

// 5) Fonction officier
export function vFonctionOfficier(a: Acteur, _ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  if (a.role === 'officier') {
    if (isNullish(a.fonction)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Fonction non renseignée pour l'officier de l'état civil`, level: 'error' });
    }
  } else {
    if (!isNullish(a.fonction)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Fonction renseignée pour un rôle autre qu'officier`, level: 'info' });
    }
  }
  return out;
}

// 6) Consentement (mariage)
export function vConsentement(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const parentalRoles = ['époux-père', 'époux-mère', 'épouse-père', 'épouse-mère'];
  const tutorRoles = ['époux-tuteur', 'épouse-tuteur'];
  const role = a.role || '';
  const consentement = a.est_consentant;

  if (ctx.acte.type_acte === 'mariage') {
    if (parentalRoles.includes(role)) {
      if (a.est_vivant === true) {
        if (consentement !== true && consentement !== false) {
          out.push({ acteurId: a.id, acteurLabel: l, message: `Consentement non renseigné pour ${role} vivant`, level: 'error' });
        }
      } else {
        if (!isNullish(consentement)) {
          out.push({ acteurId: a.id, acteurLabel: l, message: `Consentement ne devrait pas être renseigné pour ${role} décédé`, level: 'error' });
        }
      }
    } else if (tutorRoles.includes(role)) {
      if (consentement !== true && consentement !== false) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Consentement attendu pour ${role}`, level: 'error' });
      }
    } else {
      if (!isNullish(consentement)) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Consentement ne concerne pas le rôle ${role}`, level: 'error' });
      }
    }
  } else {
    if (!isNullish(consentement)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Consentement non attendu pour un acte de type ${ctx.acte.type_acte}`, level: 'error' });
    }
  }
  return out;
}

// 7) Cohérence âge / est_vivant / date_deces
export function vAgeEstVivant(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const { age, est_vivant, date_deces } = a;

  if (age === 'dcd' && est_vivant !== false) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `est_vivant devrait être false si age = "dcd"`, level: 'error' });
  }

  if (ctx.acte.type_acte !== 'décès' && a.role !== 'défunt' && age !== 'dcd' && age != null && est_vivant !== true) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `est_vivant devrait être true si age est renseigné et différent de "dcd" (sauf pour un acte de décès)`, level: 'error' });
  }

  if (est_vivant === null && age != null) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `age devrait être null si est_vivant est null`, level: 'error' });
  }

  if (est_vivant === false && age == null) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `age devrait être "dcd" si est_vivant est false`, level: 'error' });
  }

  if (date_deces != null && est_vivant !== false) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `est_vivant devrait être false si une date_deces est renseignée`, level: 'error' });
  }

  return out;
}

// 8) Qualité
export function vQualite(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const { role, qualite } = a;
  const typeActe = ctx.acte.type_acte;

  if (typeActe === 'naissance' && role === 'enfant' && qualite != null && qualite !== '') {
    out.push({ acteurId: a.id, acteurLabel: l, message: `Un enfant dans un acte de naissance ne doit pas avoir de qualité`, level: 'warning' });
  }

  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      // qualité facultative
    } else {
      if (qualite == null || String(qualite).trim() === '') {
        out.push({ acteurId: a.id, acteurLabel: l, message: `La qualité est requise pour un sujet dans un acte de type ${typeActe}`, level: 'warning' });
      }
    }
    return out;
  }

  if (role === 'enfant légitimé') return out;

  if (role !== 'enfant' && role !== 'officier' && (qualite == null || String(qualite).trim() === '')) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `La qualité devrait être renseignée pour ce rôle`, level: 'warning' });
  }

  return out;
}

// 9) Présence ↔ vie
export function vPresenceEtVie(a: Acteur, _ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  if (a.est_present === true && a.est_vivant !== true) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `"est_vivant" devrait être true si "est_present" est true`, level: 'error' });
  }
  return out;
}

// 10) Présence selon rôle & vie
export function vPresenceSelonRoleEtVie(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const role = a.role;
  const typeActe = ctx.acte.type_acte;

  // sujet (hors reconnaissance) → est_present requis true
  if (role === 'sujet') {
    if (typeActe !== 'reconnaissance' && a.est_present !== true) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"est_present" est requis pour un rôle sujet dans un acte de type ${typeActe}`, level: 'error' });
    }
  }

  if (ROLES_TOUJOURS_ABSENTS.includes(role)) {
    if (!isNullish(a.est_present)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"est_present" doit être null pour un rôle ${role}`, level: 'error' });
    }
  }

  if (ROLES_TOUJOURS_PRES.includes(role)) {
    if (a.est_present !== true) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"est_present" doit être true pour un rôle ${role}`, level: 'error' });
    }
  }

  if (ROLES_PARENTS_COND.includes(role) && a.est_vivant === false) {
    if (!isNullish(a.est_present)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"est_present" doit être null pour un ${role} décédé`, level: 'error' });
    }
  }

  return out;
}

// 11) Signature ↔ présence
export function vSignatureEtPresence(a: Acteur, _ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const { est_present, a_signe, signature, signature_libelle } = a;

  if (est_present === false || est_present === null) {
    if (!isNullish(a_signe)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"a_signe" doit être null si l'acteur n'est pas présent`, level: 'error' });
    }
    if (signature != null && String(signature).trim() !== '') {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"signature" doit être null si l'acteur n'est pas présent`, level: 'error' });
    }
    if (signature_libelle != null && String(signature_libelle).trim() !== '') {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"signature_libelle" doit être null si l'acteur n'est pas présent`, level: 'error' });
    }
    return out;
  }

  if (isNullish(a_signe)) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `"a_signe" doit être renseigné si l'acteur est présent`, level: 'error' });
  }

  if (a_signe === true) {
    if (signature !== 'a signé') {
      out.push({ acteurId: a.id, acteurLabel: l, message: `La valeur de "signature" devrait être "a signé" si "a_signe" est true`, level: 'error' });
    }
    if (signature === 'a signé' && (signature_libelle == null || String(signature_libelle).trim() === '')) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"signature_libelle" devrait être renseigné quand l'acteur a signé`, level: 'warning' });
    }
  }

  if (a_signe === false) {
    if (signature == null || String(signature).trim() === '') {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Une explication est attendue dans "signature" si "a_signe" est false`, level: 'error' });
    }
  }

  if (a_signe === null && signature != null && String(signature).trim() !== '') {
    out.push({ acteurId: a.id, acteurLabel: l, message: `"signature" doit être null si "a_signe" est null`, level: 'error' });
  }

  if (signature_libelle != null && String(signature_libelle).trim() !== '') {
    if (a_signe !== true) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"signature_libelle" ne doit pas être renseigné si "a_signe" n'est pas true`, level: 'error' });
    }
    if (signature !== 'a signé') {
      out.push({ acteurId: a.id, acteurLabel: l, message: `"signature_libelle" ne doit pas être renseigné si "signature" n'est pas "a signé"`, level: 'error' });
    }
  }

  return out;
}

// 12) Heures naissance/décès
export function vHeuresNaissanceDeces(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const typeActe = ctx.acte.type_acte;

  if (typeActe === 'naissance' && a.role === 'enfant') {
    if (isNullish(a.naissance_heure)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `L'heure de naissance doit être renseignée pour l'enfant dans un acte de naissance`, level: 'error' });
    } else if (!heureValide(a.naissance_heure)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `L'heure de naissance doit être au format HH:MM`, level: 'error' });
    }
  }

  if (typeActe === 'décès' && a.role === 'défunt') {
    if (isNullish(a.deces_heure)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `L'heure du décès doit être renseignée pour le défunt dans un acte de décès`, level: 'error' });
    } else if (!heureValide(a.deces_heure)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `L'heure du décès doit être au format HH:MM`, level: 'error' });
    }
  } else {
    if (!isNullish(a.deces_heure)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `L'heure de décès ne doit être renseignée que pour le défunt dans un acte de décès`, level: 'error' });
    }
  }

  return out;
}

// 13) Profession & statut si vivant
export function vProfessionStatutSiVivant(a: Acteur, _ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const rolesCibles = [
    'déclarant','père','mère','épouse','épouse-mère','épouse-père','époux','époux-père','époux-mère',
    'défunt','témoin 1','témoin 2','témoin 3','témoin 4',
  ];
  const role = a.role || '';
  if (rolesCibles.includes(role) && a.est_vivant === true && a.profession_brut == null && a.statut_brut == null) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `Profession et statut non renseignés pour ${role} vivant`, level: 'info' });
  }
  return out;
}

// 14) Filiation
export function vFiliation(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const typeActe = ctx.acte.type_acte;
  const role = a.role || '';
  const filiation = a.filiation;

  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      if (filiation !== 'reconnu') {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ "filiation" doit être "reconnu" pour un sujet dans un acte de reconnaissance`, level: 'error' });
      }
    } else {
      if (!isNullish(filiation)) {
        out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ "filiation" ne doit pas être renseigné pour un rôle sujet dans un acte de type ${typeActe}`, level: 'error' });
      }
    }
    return out;
  }

  if (!ROLES_FILIATION.includes(role as any) && role !== 'sujet') {
    if (!isNullish(filiation)) {
      out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ "filiation" ne doit pas être renseigné pour un rôle ${role}`, level: 'error' });
    }
  }

  if (role === 'enfant légitimé' && filiation !== 'légitimé') {
    out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ "filiation" doit être "légitimé" pour un enfant légitimé`, level: 'error' });
  }

  if (ROLES_FILIATION.includes(role as any) && filiation == null) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `Le champ "filiation" doit être renseigné pour le rôle ${role}`, level: 'error' });
  }

  return out;
}

// 15) Age obligatoire par rôle
export function vAgeObligatoire(a: Acteur, _ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const role = a.role || '';
  if (ROLES_AGE_OBLIG.includes(role as any) && (a.age === '' || a.age === null || a.age === undefined)) {
    out.push({ acteurId: a.id, acteurLabel: l, message: `L'âge devrait être renseigné pour le rôle ${role}`, level: 'info' });
  }
  return out;
}

// 16) Relations (statut)
export function vRelations(a: Acteur, ctx: Ctx): Incoherence[] {
  const l = labelActeur(a);
  const out: Incoherence[] = [];
  const mauvaises = (ctx.relations || []).filter(
    (r: any) => r.acteur_source_id === a.id && r.statut !== 'unique'
  );
  for (const r of mauvaises) {
    out.push({
      acteurId: a.id,
      acteurLabel: l,
      message: `Un acteur est ${r.statut} pour la relation "${r.source_mention}"`,
      level: 'warning',
    });
  }
  return out;
}

// 17) Registre exporté (ordre modulable)
export const ACTEUR_VALIDATORS: Array<(a: Acteur, ctx: Ctx) => Incoherence[]> = [
  vChampsTexteObligatoires,
  vQualite,
  vAgeObligatoire,
  vProfessionStatutSiVivant,
  vFonctionOfficier,
  vFiliation,
  vAgeEstVivant,
  vPresenceEtVie,
  vPresenceSelonRoleEtVie,
  vHeuresNaissanceDeces,
  vConsentement,
  vEstDeclarant,
  vSignatureEtPresence,
  vParentsCites,
  vMultiParRole,
  vRelations,
];
