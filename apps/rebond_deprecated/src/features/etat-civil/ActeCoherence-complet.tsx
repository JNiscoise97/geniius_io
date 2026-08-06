// ActeCoherence.tsx
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import type { RelationPreview } from '@/types/relations-acteurs';
import { useEffect, useMemo, useRef, useState } from 'react';

export type Incoherence = {
  acteurId: string;
  acteurLabel: string;
  message: string;
  level: 'info' | 'warning' | 'error';
};

type Props = {
  acteId: string;
  erreurs?: Incoherence[];
  relations?: RelationPreview[];
};

const EMPTY_INCOHERENCES: Readonly<Incoherence[]> = Object.freeze([]);
const EMPTY_RELATIONS: Readonly<RelationPreview[]> = Object.freeze([]);

export function ActeCoherence({ acteId, erreurs, relations }: Props) {
  const [loading, setLoading] = useState(true);
  const { fetchActeDetail, entites, acte } = useEtatCivilActesStore();

  // Stabilise la fonction de fetch
  const fetchRef = useRef(fetchActeDetail);
  useEffect(() => {
    fetchRef.current(acteId);
  }, [acteId]);

  // Fallbacks stables
  const inputErreurs = erreurs ?? EMPTY_INCOHERENCES;
  const inputRelations = relations ?? EMPTY_RELATIONS;

  // Calcul des erreurs (pas de setState -> pas de boucle)
  const erreursCalculees = useMemo(() => {
    if (!acte) return EMPTY_INCOHERENCES;
    if (inputErreurs.length > 0) return inputErreurs;
    return getErrorsForActe(acte, entites, inputRelations as RelationPreview[]);
  }, [acte, entites, inputErreurs, inputRelations]);

  // ⚠️ HOIST ICI: toujours appeler les hooks avant tout return conditionnel
  const grouped = useMemo(() => {
    return erreursCalculees.reduce<Record<string, Incoherence[]>>((acc, err) => {
      (acc[err.acteurId] ||= []).push(err);
      return acc;
    }, {});
  }, [erreursCalculees]);

  // Fin du "loading" quand l'acte arrive
  useEffect(() => {
    if (loading && acte) setLoading(false);
  }, [loading, acte]);

  if (loading) {
    return <p className='text-muted-foreground text-sm'>Analyse en cours…</p>;
  }

  return (
    <div className='rounded-md border p-4 mt-4 bg-muted/10'>
      <h2 className='font-semibold mb-2 text-base'>Incohérences détectées</h2>
      {Object.keys(grouped).length === 0 ? (
        <p className='text-sm text-green-700'>✅ Pas d'incohérence détectée.</p>
      ) : (
        Object.entries(grouped).map(([acteurId, actorErrors]) => (
          <div key={acteurId} className='mb-3'>
            <h3 className='text-sm font-medium mb-1'>👤 {actorErrors[0].acteurLabel}</h3>
            <ul className='list-disc list-inside text-sm space-y-1'>
              {actorErrors.map((err, i) => (
                <li
                  key={i}
                  className={
                    err.level === 'error'
                      ? 'text-red-700'
                      : err.level === 'warning'
                      ? 'text-orange-600'
                      : 'text-blue-600'
                  }
                >
                  {err.message}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}



function verifierMultiParRole(acteur: any, entites: any[], label: string): Incoherence[] {
  const newErrors: Incoherence[] = [];
  const rolesAvecMulti = ['enfant', 'enfant légitimé', 'sujet'];
  const role = acteur.role || '';
  const isMultiRole = rolesAvecMulti.includes(role);
  const sameRoleCount = entites.filter((a) => a.role === role).length;

  // 1. Si le rôle ne fait pas partie des rôles autorisés, multi doit être null
  if (!isMultiRole && acteur.multi !== null && acteur.multi !== undefined) {
    newErrors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Le champ 'multi' ne devrait pas être renseigné pour un rôle de type ${role}`,
      level: 'error',
    });
  }

  // 2. Si le rôle est concerné et qu’il y a plusieurs acteurs, multi est requis
  if (isMultiRole && sameRoleCount > 1 && !acteur.multi) {
    newErrors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Le champ 'multi' est requis car plusieurs acteurs ont le rôle '${role}'`,
      level: 'error',
    });
  }

  // 3. Si le rôle est concerné et unique, multi ne doit pas être renseigné
  if (isMultiRole && sameRoleCount === 1 && acteur.multi !== null && acteur.multi !== undefined) {
    newErrors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Le champ 'multi' ne devrait pas être renseigné car l'acteur est seul avec le rôle '${role}'`,
      level: 'error',
    });
  }

  return newErrors;
}

function verifierParentsCites(
  acte: any,
  acteur: any,
  entites: any[],
  label: string,
): Incoherence[] {
  const newErrors: Incoherence[] = [];
  const typeActe = acte.type_acte;
  const rolesCibles = ['enfant', 'enfant légitimé', 'époux', 'épouse', 'défunt'];
  const role = acteur.role || '';

  // Mappings pour vérifier la présence d'un parent correspondant
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

  const hasPere = mappingPere[role]?.some((r) => entites.some((e) => e.role === r)) ?? false;
  const hasMere = mappingMere[role]?.some((r) => entites.some((e) => e.role === r)) ?? false;

  // Cas particulier : rôle = sujet
  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      if (acteur.pere_est_cite !== true && acteur.pere_est_cite !== false) {
        newErrors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: "Le champ 'père cité' est requis pour un sujet dans un acte de reconnaissance",
          level: 'error',
        });
      }
      if (acteur.mere_est_citee !== true && acteur.mere_est_citee !== false) {
        newErrors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: "Le champ 'mère citée' est requis pour un sujet dans un acte de reconnaissance",
          level: 'error',
        });
      }
    } else {
      if (acteur.pere_est_cite !== null && acteur.pere_est_cite !== undefined) {
        newErrors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message:
            "Le champ 'père cité' ne doit pas être renseigné pour un sujet dans un acte de type autre que reconnaissance",
          level: 'error',
        });
      }
      if (acteur.mere_est_citee !== null && acteur.mere_est_citee !== undefined) {
        newErrors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message:
            "Le champ 'mère citée' ne doit pas être renseigné pour un sujet dans un acte de type autre que reconnaissance",
          level: 'error',
        });
      }
    }

    return newErrors; // Le cas "sujet" est traité, on sort ici
  }

  // Autres rôles
  if (!rolesCibles.includes(role)) {
    if (acteur.pere_est_cite !== null && acteur.pere_est_cite !== undefined) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Le champ 'père cité' ne devrait pas être renseigné pour ce rôle",
        level: 'error',
      });
    }
    if (acteur.mere_est_citee !== null && acteur.mere_est_citee !== undefined) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Le champ 'mère citée' ne devrait pas être renseigné pour ce rôle",
        level: 'error',
      });
    }
  } else {
    if (acteur.pere_est_cite !== true && acteur.pere_est_cite !== false) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Le champ 'père cité' est requis mais non renseigné",
        level: 'error',
      });
    }
    if (acteur.pere_est_cite && !hasPere) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Aucun acteur avec le rôle 'père' présent dans l'acte",
        level: 'error',
      });
    }

    if (acteur.mere_est_citee !== true && acteur.mere_est_citee !== false) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Le champ 'mère citée' est requis mais non renseigné",
        level: 'error',
      });
    }
    if (acteur.mere_est_citee && !hasMere) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Aucun acteur avec le rôle 'mère' présent dans l'acte",
        level: 'error',
      });
    }

    if (role === 'enfant' && acteur.pere_est_cite === false && acteur.mere_est_citee === false) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: "Aucun parent n'est renseigné pour cet enfant",
        level: 'warning',
      });
    }

    if (
      role === 'enfant légitimé' &&
      acteur.pere_est_cite === false &&
      acteur.mere_est_citee === false
    ) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: 'Les deux parents devraient être renseignés pour cet enfant',
        level: 'warning',
      });
    }
  }

  return newErrors;
}

function verifierEstDeclarant(
  acteur: any,
  acte: any,
  entites: any[],
  label: string,
): Incoherence[] {
  const newErrors: Incoherence[] = [];
  const rolesDéclarants = ['père', 'mère', 'déclarant'];
  const typeSansDéclarant = ['mariage', 'décès'];
  const role = acteur.role || '';
  const typeActe = acte.type_acte;

  // Règle 1 & 2 : certains types d'actes ou rôles n'autorisent pas est_declarant
  if (typeSansDéclarant.includes(typeActe) || !rolesDéclarants.includes(role)) {
    if (acteur.est_declarant !== null && acteur.est_declarant !== undefined) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: `Le champ "est_declarant" ne devrait pas être renseigné pour un rôle ${role} dans un acte de type ${typeActe}`,
        level: 'error',
      });
    }
  }

  // Règle 3 : rôle autorisé et type d'acte autorisé => champ requis
  if (rolesDéclarants.includes(role) && !typeSansDéclarant.includes(typeActe)) {
    if (acteur.est_declarant !== true && acteur.est_declarant !== false) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: `Le champ "est_declarant" doit être renseigné (true ou false) pour le rôle ${role}`,
        level: 'error',
      });
    }
  }

  // Règle 4 : si un acteur est déclarant, alors il doit être unique
  if (rolesDéclarants.includes(role) && !typeSansDéclarant.includes(typeActe)) {
    const declarants = entites.filter((a) => a.role === 'déclarant');
    if (declarants.length > 0) {
      if ((role === 'père' || role === 'mère') && acteur.est_declarant === true) {
        newErrors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `"est_declarant" doit être false pour ${role} s'il existe déjà un déclarant`,
          level: 'error',
        });
      }
      if (role === 'déclarant' && acteur.est_declarant !== true) {
        newErrors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `"est_declarant" doit être true pour le déclarant principal`,
          level: 'error',
        });
      }
    }
  }

  return newErrors;
}

function verifierFonctionOfficier(acteur: any, label: string): Incoherence[] {
  const newErrors: Incoherence[] = [];

  if (acteur.role === 'officier') {
    if (acteur.fonction === null || acteur.fonction === undefined) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: `Fonction non renseignée pour l'officier de l'état civil`,
        level: 'error',
      });
    }
  } else {
    if (acteur.fonction !== null && acteur.fonction !== undefined) {
      newErrors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: `Fonction renseignée pour un rôle autre qu'officier`,
        level: 'info',
      });
    }
  }

  return newErrors;
}

function verifierChampsTexteObligatoires(acteur: any, label: string): Incoherence[] {
  const erreurs: Incoherence[] = [];

  const champs: {
    cle: keyof typeof acteur;
    message: string;
    level: 'warning' | 'error';
  }[] = [
    { cle: 'nom', message: 'nom manquant', level: 'warning' },
    { cle: 'prenom', message: 'prénom manquant', level: 'warning' },
    { cle: 'sexe', message: 'sexe manquant', level: 'error' },
    { cle: 'role', message: 'rôle manquant', level: 'error' },
  ];

  for (const champ of champs) {
    const valeur = acteur[champ.cle];
    if (typeof valeur !== 'string' || valeur.trim() === '') {
      erreurs.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: champ.message,
        level: champ.level,
      });
    }
  }
  return erreurs;
}

function verifierConsentement(
  acteur: any,
  label: string,
  acte: { type_acte: string },
): Incoherence[] {
  const erreurs: Incoherence[] = [];

  const parentalRoles = ['époux-père', 'époux-mère', 'épouse-père', 'épouse-mère'];
  const tutorRoles = ['époux-tuteur', 'épouse-tuteur'];

  const role = acteur.role || '';
  const consentement = acteur.est_consentant;

  if (acte.type_acte === 'mariage') {
    if (parentalRoles.includes(role)) {
      if (acteur.est_vivant === true) {
        if (consentement !== true && consentement !== false) {
          erreurs.push({
            acteurId: acteur.id,
            acteurLabel: label,
            message: `Consentement non renseigné pour ${role} vivant`,
            level: 'error',
          });
        }
      } else {
        if (consentement !== null && consentement !== undefined) {
          erreurs.push({
            acteurId: acteur.id,
            acteurLabel: label,
            message: `Consentement ne devrait pas être renseigné pour ${role} décédé`,
            level: 'error',
          });
        }
      }
    } else if (tutorRoles.includes(role)) {
      if (consentement !== true && consentement !== false) {
        erreurs.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `Consentement attendu pour ${role}`,
          level: 'error',
        });
      }
    } else {
      if (consentement !== null && consentement !== undefined) {
        erreurs.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `Consentement ne concerne pas le rôle ${role}`,
          level: 'error',
        });
      }
    }
  } else {
    if (consentement !== null && consentement !== undefined) {
      erreurs.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: `Consentement non attendu pour un acte de type ${acte.type_acte}`,
        level: 'error',
      });
    }
  }

  return erreurs;
}

function checkAgeEstVivantCoherence(acte: any, acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];

  const { id, age, est_vivant, date_deces } = acteur;

  // Règle 1 : age = 'dcd' ⇒ est_vivant = false
  if (age === 'dcd' && est_vivant !== false) {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `est_vivant devrait être false si age = "dcd"`,
      level: 'error',
    });
  }

  // Règle 2 : age ≠ 'dcd' et ≠ null ⇒ est_vivant = true
  if (
    acte.type_acte !== 'décès' &&
    acteur.role !== 'défunt' &&
    age !== 'dcd' &&
    age != null &&
    est_vivant !== true
  ) {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `est_vivant devrait être true si age est renseigné et différent de "dcd" (sauf pour un acte de décès)`,
      level: 'error',
    });
  }

  // Règle 3 : est_vivant = null ⇒ age = null
  if (est_vivant === null && age != null) {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `age devrait être null si est_vivant est null`,
      level: 'error',
    });
  }

  // Réciproque : est_vivant = false ⇒ age = 'dcd'
  if (est_vivant === false && age == null) {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `age devrait être "dcd" si est_vivant est false`,
      level: 'error',
    });
  }

  // Nouvelle règle : date_deces non null ⇒ est_vivant = false
  if (date_deces != null && est_vivant !== false) {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `est_vivant devrait être false si une date_deces est renseignée`,
      level: 'error',
    });
  }

  return errors;
}

function checkQualité(acte: any, acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];
  const typeActe = acte.type_acte;
  const { role, qualite } = acteur;

  // Cas 1 : enfant dans un acte de naissance → pas de qualité
  if (typeActe === 'naissance' && role === 'enfant' && qualite != null && qualite !== '') {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Un enfant dans un acte de naissance ne doit pas avoir de qualité`,
      level: 'warning',
    });
  }

  // Cas particulier 1 : sujet dans acte de reconnaissance → qualité facultative
  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      // rien à faire
    } else {
      if (qualite == null || qualite.toString().trim() === '') {
        errors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `La qualité est requise pour un sujet dans un acte de type ${typeActe}`,
          level: 'warning',
        });
      }
    }
    return errors; // sujet traité, on sort
  }

  // Cas particulier 2 : enfant légitimé → qualité facultative
  if (role === 'enfant légitimé') {
    return errors;
  }

  // Cas 2 : tout autre rôle sauf enfant et officier → qualité requise
  if (
    role !== 'enfant' &&
    role !== 'officier' &&
    (qualite == null || qualite.toString().trim() === '')
  ) {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `La qualité devrait être renseignée pour ce rôle`,
      level: 'warning',
    });
  }

  return errors;
}

function checkPresenceEtVie(acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];

  if (acteur.est_present === true && acteur.est_vivant !== true) {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `"est_vivant" devrait être true si "est_present" est true`,
      level: 'error',
    });
  }

  return errors;
}

function verifierRelations(acteur: any, relations:any[], label: string): Incoherence[] {
  const errors: Incoherence[] = [];

  if (relations) {
  const mauvaisesRelations = relations.filter(
    (r:any) => r.acteur_source_id === acteur.id && r.statut !== 'unique',
  );

  for (const r of mauvaisesRelations) {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Un acteur est ${r.statut} pour la relation "${r.source_mention}"`,
      level: 'warning',
    });
  }
}

  return errors;
}

function verifierProfessionEtStatutSiVivant(acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];

  const rolesCibles = [
    'déclarant',
    'père',
    'mère',
    'épouse',
    'épouse-mère',
    'épouse-père',
    'époux',
    'époux-père',
    'époux-mère',
    'défunt',
    'témoin 1',
    'témoin 2',
    'témoin 3',
    'témoin 4',
  ];

  const role = acteur.role || '';

  if (
    rolesCibles.includes(role) &&
    acteur.est_vivant === true &&
    acteur.profession_brut == null &&
    acteur.statut_brut == null
  ) {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Profession et statut non renseignés pour ${role} vivant`,
      level: 'info',
    });
  }

  return errors;
}

function verifierFiliationActeur(acte: any, acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];
  const typeActe = acte.type_acte;
  const rolesAvecFiliation = ['enfant', 'épouse', 'époux', 'enfant légitimé', 'défunt'];
  const role = acteur.role || '';
  const filiation = acteur.filiation;

  // Cas particulier : rôle = sujet
  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      if (filiation !== 'reconnu') {
        errors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `Le champ "filiation" doit être "reconnu" pour un sujet dans un acte de reconnaissance`,
          level: 'error',
        });
      }
    } else {
      if (filiation !== null && filiation !== undefined) {
        errors.push({
          acteurId: acteur.id,
          acteurLabel: label,
          message: `Le champ "filiation" ne doit pas être renseigné pour un rôle sujet dans un acte de type ${typeActe}`,
          level: 'error',
        });
      }
    }
  }

  // Règle 1 : Si rôle ne fait pas partie de la liste → filiation doit être null
  if (!rolesAvecFiliation.includes(role) && role !== 'sujet') {
    if (filiation !== null && filiation !== undefined) {
      errors.push({
        acteurId: acteur.id,
        acteurLabel: label,
        message: `Le champ "filiation" ne doit pas être renseigné pour un rôle ${role}`,
        level: 'error',
      });
    }
  }

  // Règle 2 : Si rôle = 'enfant légitimé' → filiation doit être exactement 'légitimé'
  if (role === 'enfant légitimé' && filiation !== 'légitimé') {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Le champ "filiation" doit être "légitimé" pour un enfant légitimé`,
      level: 'error',
    });
  }

  // Règle 3 : Pour tous les rôles attendus, filiation ne doit pas être null
  if (rolesAvecFiliation.includes(role) && filiation == null) {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `Le champ "filiation" doit être renseigné pour le rôle ${role}`,
      level: 'error',
    });
  }

  return errors;
}

function verifierAge(acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];

  const rolesAvecAgeObligatoire = [
    'déclarant',
    'sujet',
    'père',
    'mère',
    'épouse',
    'époux',
    'enfant légitimé',
    'défunt',
    'témoin 1',
    'témoin 2',
    'témoin 3',
    'témoin 4',
  ];

  const role = acteur.role || '';

  if (
    rolesAvecAgeObligatoire.includes(role) &&
    (acteur.age === '' || acteur.age === null || acteur.age === undefined)
  ) {
    errors.push({
      acteurId: acteur.id,
      acteurLabel: label,
      message: `L'âge devrait être renseigné pour le rôle ${role}`,
      level: 'info',
    });
  }

  return errors;
}

function verifierPresenceSelonRoleEtVie(acte: any, acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];
  const { id, role, est_present, est_vivant } = acteur;
  const typeActe = acte.type_acte;

  const rolesToujoursAbsents = ['mention', 'défunt'];
  const rolesToujoursPresents = [
    'officier',
    'témoin 1',
    'témoin 2',
    'témoin 3',
    'témoin 4',
    'déclarant',
    'épouse',
    'époux',
  ];
  const rolesParentsConditionnels = [
    'père',
    'mère',
    'époux-père',
    'époux-mère',
    'épouse-père',
    'épouse-mère',
  ];

  // 🎯 Cas particulier : rôle = sujet
  if (role === 'sujet') {
    if (typeActe === 'reconnaissance') {
      // Aucun contrôle requis
    } else {
      if (est_present !== true) {
        errors.push({
          acteurId: id,
          acteurLabel: label,
          message: `"est_present" est requis pour un rôle sujet dans un acte de type ${typeActe}`,
          level: 'error',
        });
      }
    }
  }

  // Cas : toujours absents
  if (rolesToujoursAbsents.includes(role)) {
    if (est_present !== null && est_present !== undefined) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"est_present" doit être null pour un rôle ${role}`,
        level: 'error',
      });
    }
  }

  // Cas : toujours présents
  if (rolesToujoursPresents.includes(role)) {
    if (est_present !== true) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"est_present" doit être true pour un rôle ${role}`,
        level: 'error',
      });
    }
  }

  // Cas : parents conditionnels
  if (rolesParentsConditionnels.includes(role) && est_vivant === false) {
    if (est_present !== null && est_present !== undefined) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"est_present" doit être null pour un ${role} décédé`,
        level: 'error',
      });
    }
  }

  return errors;
}

function verifierSignatureEtPresence(acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];
  const { id, est_present, a_signe, signature, signature_libelle } = acteur;

  // Cas 1 : pas présent ou non renseigné → a_signe, signature et signature_libelle doivent être null
  if (est_present === false || est_present === null) {
    if (a_signe !== null && a_signe !== undefined) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"a_signe" doit être null si l'acteur n'est pas présent`,
        level: 'error',
      });
    }

    if (signature != null && signature.trim() !== '') {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"signature" doit être null si l'acteur n'est pas présent`,
        level: 'error',
      });
    }

    if (signature_libelle != null && signature_libelle.trim() !== '') {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"signature_libelle" doit être null si l'acteur n'est pas présent`,
        level: 'error',
      });
    }

    return errors;
  }

  // Cas 2 : est_present === true → a_signe doit être renseigné
  if (a_signe === null || a_signe === undefined) {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `"a_signe" doit être renseigné si l'acteur est présent`,
      level: 'error',
    });
  }

  // Cas 3 : a_signe === true
  if (a_signe === true) {
    if (signature !== 'a signé') {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `La valeur de "signature" devrait être "a signé" si "a_signe" est true`,
        level: 'error',
      });
    }

    if (signature === 'a signé' && (signature_libelle == null || signature_libelle.trim() === '')) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"signature_libelle" devrait être renseigné quand l'acteur a signé`,
        level: 'warning',
      });
    }
  }

  // Cas 4 : a_signe === false
  if (a_signe === false) {
    if (signature == null || signature.trim() === '') {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `Une explication est attendue dans "signature" si "a_signe" est false`,
        level: 'error',
      });
    }
  }

  // Cas 5 : a_signe === null → signature doit être null
  if (a_signe === null && signature != null && signature.trim() !== '') {
    errors.push({
      acteurId: id,
      acteurLabel: label,
      message: `"signature" doit être null si "a_signe" est null`,
      level: 'error',
    });
  }

  // ❌ Cas 6 : incohérences sur signature_libelle
  if (signature_libelle != null && signature_libelle.trim() !== '') {
    if (a_signe !== true) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"signature_libelle" ne doit pas être renseigné si "a_signe" n'est pas true`,
        level: 'error',
      });
    }

    if (signature !== 'a signé') {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `"signature_libelle" ne doit pas être renseigné si "signature" n'est pas "a signé"`,
        level: 'error',
      });
    }
  }

  return errors;
}

function verifierHeuresNaissanceEtDeces(acte: any, acteur: any, label: string): Incoherence[] {
  const errors: Incoherence[] = [];
  const { id, role, naissance_heure, deces_heure } = acteur;
  const typeActe = acte.type_acte;

  const heureValide = (val: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(val);

  // Cas acte de naissance et rôle enfant
  if (typeActe === 'naissance' && role === 'enfant') {
    if (naissance_heure == null) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `L'heure de naissance doit être renseignée pour l'enfant dans un acte de naissance`,
        level: 'error',
      });
    } else if (!heureValide(naissance_heure)) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `L'heure de naissance doit être au format HH:MM`,
        level: 'error',
      });
    }
  }

  // Cas acte de décès et rôle défunt
  if (typeActe === 'décès' && role === 'défunt') {
    if (deces_heure == null) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `L'heure du décès doit être renseignée pour le défunt dans un acte de décès`,
        level: 'error',
      });
    } else if (!heureValide(deces_heure)) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `L'heure du décès doit être au format HH:MM`,
        level: 'error',
      });
    }
  } else {
    // Tous les autres cas : deces_heure ne doit pas être renseigné
    if (deces_heure != null) {
      errors.push({
        acteurId: id,
        acteurLabel: label,
        message: `L'heure de décès ne doit être renseignée que pour le défunt dans un acte de décès`,
        level: 'error',
      });
    }
  }

  return errors;
}
export function getErrorsForActeur(acteur: any, acte: any, entites: any[], relations:any[]) {
  let newErrors = [];
  const label = [acteur.prenom, acteur.nom].filter(Boolean).join(' ') || 'Acteur sans nom';

  // déclarant
  // sujet, enfant
  // père, mère
  // épouse, épouse-mère, épouse-père, époux, époux-père, époux-mère
  // enfant légitimé
  // défunt
  // officier, témoin 1, témoin 2, témoin 3, témoin 4, mention

  // acteur.nom, acteur.prenom, acteur.sexe, acteur.role
  newErrors.push(...verifierChampsTexteObligatoires(acteur, label));

  // acteur.qualite
  newErrors.push(...checkQualité(acte, acteur, label));
  // acteur.age
  newErrors.push(...verifierAge(acteur, label));

  // acteur.profession_brut et acteur.statut_brut
  newErrors.push(...verifierProfessionEtStatutSiVivant(acteur, label));

  // acteur.fonction
  newErrors.push(...verifierFonctionOfficier(acteur, label));

  // acteur.filiation
  newErrors.push(...verifierFiliationActeur(acte, acteur, label));

  // acteur.domicile
  // acteur.origine

  // acteur.naissance_date
  // acteur.naissance_lieux
  // acteur.naissance_lieu_commune
  // acteur.naissance_lieu_section
  // acteur.naissance_lieu_hameau
  // acteur.naissance_lieu_précisions
  // acteur.deces_date
  // acteur.deces_lieux
  // acteur.deces_lieu_commune
  // acteur.deces_lieu_section
  // acteur.deces_lieu_hameau
  // acteur.deces_lieu_précisions

  // acteur.est_vivant et acteur.age
  newErrors.push(...checkAgeEstVivantCoherence(acte, acteur, label));
  newErrors.push(...checkPresenceEtVie(acteur, label));

  // acteur.est_present
  newErrors.push(...verifierPresenceSelonRoleEtVie(acte, acteur, label));

  if (acte) {
    // acteur.naissance_heure, acteur.deces_heure
    newErrors.push(...verifierHeuresNaissanceEtDeces(acte, acteur, label));

    // acteur.est_consentant
    newErrors.push(...verifierConsentement(acteur, label, acte));

    // acteur.est_declarant
    newErrors.push(...verifierEstDeclarant(acteur, acte, entites, label));
  }

  // acteur.a_signe et acteur.signature
  newErrors.push(...verifierSignatureEtPresence(acteur, label));

  // acteur.lien
  // acteur.note

  // acteur.pere_est_cite et acteur.mere_est_citee
  newErrors.push(...verifierParentsCites(acte, acteur, entites, label));
  // acteur.multi
  newErrors.push(...verifierMultiParRole(acteur, entites, label));

  newErrors.push(...verifierRelations(acteur, relations, label));

  return newErrors;
}


export function getErrorsForActe(acte: any, entites: any[], relations: any[]) {
  const newErrors: Incoherence[] = [];

    // 🔍 Vérification globale : il doit exister un officier
    const hasOfficier = entites.some((a) => a.role === 'officier');
    if (!hasOfficier && acte) {
      newErrors.push({
        acteurId: acte.id,
        acteurLabel: '(acte)',
        message: `Un acteur avec le rôle "officier" est requis`,
        level: 'error',
      });
    }

    // 🔍 Vérification globale : il doit exister un défunt pour acte de décès
    const hasDefunt = entites.some((a) => a.role === 'défunt');
    if (!hasDefunt && acte?.type_acte == 'décès') {
      newErrors.push({
        acteurId: acte.id,
        acteurLabel: '(acte)',
        message: `Un acteur avec le rôle "défunt" est requis dans cet acte de décès`,
        level: 'error',
      });
    }

    for (const acteur of entites) {
      newErrors.push(...getErrorsForActeur(acteur, acte, entites, relations));
    }
    return newErrors;
    
}