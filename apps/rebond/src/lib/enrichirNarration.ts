// enrichirNarration.tsx

import type { ActeursParActe } from "@/features/rebond/analyse-famille/AnalyseFamileParents";
import { getYearFromIsoDate } from "@/utils/date";
import React, { type JSX } from 'react';

interface NarrationOptions {
  withIntro?: boolean;
  withVariabilite?: boolean;
  withPrenomsStables?: boolean;
  withBornesChrono?: boolean;
  withNomAbsent?: boolean;
  withSurnoms?: boolean;
  withVariationsNomPrenom?: boolean;
  withAssociationsStables?: boolean;
}

export function getNarration(
  individu: any,
  mentions: any[],
  options: NarrationOptions = {},
): string {
  const {
    withIntro = true,
    withVariabilite = true,
    withBornesChrono = true,
    withPrenomsStables = true,
    withNomAbsent = true,
    withSurnoms = true,
    withVariationsNomPrenom = true,
    withAssociationsStables = true,
  } = options;

  const parts: string[] = [];

  if (withIntro) parts.push(getNarrationIntro(individu, mentions));
  if (withVariabilite) parts.push(getNarrationVariabilite(individu, mentions));
  if (withPrenomsStables) parts.push(getNarrationPrenomsStables(mentions));
  if (withBornesChrono) parts.push(getNarrationBornesChrono(mentions));
  if (withNomAbsent) parts.push(getNarrationPresenceNom(mentions));
  if (withSurnoms) parts.push(getNarrationSurnoms(mentions));
  if (withVariationsNomPrenom) parts.push(getNarrationVariationsPrenomNom(mentions));
  if (withAssociationsStables) parts.push(getNarrationAssociationsFusionnees(mentions));

  return parts.filter(Boolean).join('\n\n');
}

// 1. Introduction
export function getNarrationIntro(individu: any, mentions: any[]): string {
  const prenom = individu.prenom || '—';
  const nom = individu.nom || '—';
  const nbMentions = mentions.length;
  return `${prenom} ${nom} apparaît dans ${nbMentions} mention${nbMentions > 1 ? 's' : ''} dans les archives.`;
}

// 2. Variabilité des formes
export function getNarrationVariabilite(individu: any, mentions: any[]): string {
  const formes = new Set(
    mentions.map((m) => `${m.prenom?.trim() || '?'} ${m.nom?.trim() || '?'}`.trim()),
  );
  const exemples = Array.from(formes)
    .slice(0, 3)
    .map((f) => `« ${f.replace('? SANS NOM', '')} »`);
  if (formes.size > 1) {
    const accords =
      individu.sexe == 'F'
        ? 'Elle est désignée'
        : individu.sexe == 'M'
          ? 'Il est désigné'
          : 'Il ou elle est désigné·e';
    return `${accords} sous ${formes.size} formes différentes, telles que ${exemples.join(', ')}.`;
  } else {
    const accords =
      individu.sexe == 'F'
        ? 'Elle est toujours mentionnée'
        : individu.sexe == 'M'
          ? 'Il est toujours mentionné'
          : 'Il ou elle est toujours mentionné·e';
    return `${accords} sous la même forme : ${exemples[0]}.`;
  }
}

// 3. Période couverte
export function getNarrationBornesChrono(mentions: any[]): string {
  const dates = mentions
    .map((m) => m.acte_date && new Date(m.acte_date))
    .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  if (!dates.length) return '';
  const years = dates.map((d) => d.getFullYear());
  const min = Math.min(...years);
  const max = Math.max(...years);
  return `Les actes couvrent une période allant de ${min} à ${max}.`;
}

function getPrenomsStables(mentions: any[]) {
  const totalMentions = mentions.length;
  const prenomFreq: Record<string, number> = {};

  mentions.forEach((mention) => {
    const prenoms =
      mention.prenom?.split(/\s+/).filter((p: any) => Boolean(p) && !/^dit(?:e)?$/i.test(p)) || [];

    prenoms.forEach((p: string) => {
      const key = p.trim();
      if (!key) return;
      prenomFreq[key] = (prenomFreq[key] || 0) + 1;
    });
  });

  const result = Object.entries(prenomFreq)
    .map(([prenom, count]) => ({
      prenom,
      count,
      proportion: count / totalMentions,
    }))
    .sort((a, b) => b.count - a.count);

  return result;
}

export function getNarrationPrenomsStables(mentions: any[]): string {
  const prenoms = getPrenomsStables(mentions);

  if (!prenoms.length) return '';

  const importants = prenoms.filter((p) => p.proportion >= 0.5);
  const marginaux = prenoms.filter((p) => p.proportion < 0.3);

  const phrases: string[] = [];

  if (importants.length > 0) {
    phrases.push(
      `${importants.map((p) => `"${p.prenom}"`).join(', ')} ${importants.length > 1 ? 'sont' : 'est'} présent${importants.length > 1 ? 's' : ''} dans la majorité des actes.`,
    );
  }

  if (marginaux.length > 0) {
    phrases.push(
      `${marginaux.map((p) => `"${p.prenom}"`).join(', ')} apparaissent de manière plus marginale.`,
    );
  }

  return phrases.join(' ');
}

export function getNarrationPresenceNom(mentions: any[]): string {
  const avecNom = mentions.filter((m) => isNomValide(m.nom));
  const sansNom = mentions.filter((m) => !isNomValide(m.nom));

  if (sansNom.length === 0) {
    return 'Le nom de famille est mentionné dans tous les actes disponibles.';
  }

  // Regrouper les rôles pour les actes sans nom
  const rolesSansNom = new Set(sansNom.map((m) => (m.role || 'inconnu').toLowerCase()));

  const rolesAvecNom = new Set(avecNom.map((m) => (m.role || 'inconnu').toLowerCase()));

  // Identifier si certains rôles apparaissent surtout dans les actes sans nom
  const rolesSpécifiques = Array.from(rolesSansNom).filter((r) => !rolesAvecNom.has(r));

  if (rolesSpécifiques.length > 0) {
    return `Le nom de famille est absent dans certains actes, en particulier lorsque la personne est mentionnée comme ${rolesSpécifiques.join(', ')}.`;
  }

  return `Le nom de famille est absent dans ${sansNom.length} acte${sansNom.length > 1 ? 's' : ''}, sans lien évident avec le rôle mentionné.`;
}

function isNomValide(nom: string | null | undefined): boolean {
  return !!nom && nom.trim().toUpperCase() !== '? SANS NOM';
}

export function getNarrationSurnoms(mentions: any[]): string {
  const surnoms: Record<string, number> = {};

  mentions.forEach((m) => {
    const match = m.prenom.match(/\b(?:dit|dite)\s+([\w\-]+)/i);
    if (match) {
      const surnom = match[1].trim();
      if (surnom) {
        surnoms[surnom] = (surnoms[surnom] || 0) + 1;
      }
    }
  });

  const total = mentions.length;
  const surnomEntries = Object.entries(surnoms).sort((a, b) => b[1] - a[1]);

  if (surnomEntries.length === 0) return '';

  const [topSurnom, topCount] = surnomEntries[0];
  const topPercentage = (topCount / total) * 100;

  if (surnomEntries.length === 1) {
    return `Le surnom "${topSurnom}" apparaît dans ${topCount} mention${topCount > 1 ? 's' : ''}, soit ${Math.round(topPercentage)} % des cas. Cela suggère qu’il était fréquemment utilisé dans les actes.`;
  }

  const significantSurnoms = surnomEntries.filter(([_, count]) => count / total >= 0.15);

  if (significantSurnoms.length > 1) {
    const list = significantSurnoms.map(([s, c]) => `"${s}" (${c}×)`).join(', ');
    return `Plusieurs surnoms sont employés de manière notable dans les actes : ${list}. Aucun ne semble dominer largement.`;
  }

  return `Des surnoms comme ${surnomEntries
    .map(([s, c]) => `"${s}" (${c}×)`)
    .join(', ')} apparaissent, mais restent utilisés de manière marginale.`;
}

export function getNarrationVariationsPrenomNom(mentions: any[]): string {
  const composantMap: Record<string, { asPrenom: number; asNom: number }> = {};

  mentions.forEach((mention) => {
    const rawPrenoms =
      mention.prenom?.split(/\s+/).filter((p: any) => p && !/^dit(?:e)?$/i.test(p)) || [];
    const rawNoms =
      mention.nom
        ?.replace(/^\?\s*SANS\s+NOM$/i, '') // remplace la fausse valeur par vide
        .split(/\s+/)
        .filter((n: any) => n && !/^\?$/.test(n)) || [];

    const prenoms = rawPrenoms.map((p: string) => p.trim().toLowerCase());
    const noms = rawNoms.map((n: string) => n.trim().toLowerCase());

    const uniqueTokens = new Set([...prenoms, ...noms]);

    uniqueTokens.forEach((token) => {
      if (!composantMap[token]) {
        composantMap[token] = { asPrenom: 0, asNom: 0 };
      }
      if (prenoms.includes(token)) composantMap[token].asPrenom += 1;
      if (noms.includes(token)) composantMap[token].asNom += 1;
    });
  });

  const variations = Object.entries(composantMap)
    .filter(([_, counts]) => counts.asPrenom > 0 && counts.asNom > 0)
    .sort((a, b) => b[1].asPrenom + b[1].asNom - (a[1].asPrenom + a[1].asNom));

  if (variations.length === 0) {
    return '';
  }

  const exemples = variations.slice(0, 3).map(([mot, { asPrenom, asNom }]) => {
    const total = asPrenom + asNom;
    return `"${mot}" (${asPrenom}× comme prénom, ${asNom}× comme nom)`;
  });

  return `Certains éléments apparaissent tantôt comme prénoms, tantôt comme noms de famille selon les actes, par exemple : ${exemples.join(', ')}. Cela témoigne d’une flexibilité dans l’usage de ces composants selon les contextes archivistiques.`;
}

export function getNarrationAssociationsFusionnees(mentions: any[]): string {
  const pairCounts: Record<string, number> = {};
  const tokenCounts: Record<string, number> = {};
  const coOccurCounts: Record<string, Record<string, number>> = {};

  // Fonction de nettoyage et séparation
  function extractTokens(prenom: string, nom: string): string[] {
    const cleanedPrenom = prenom || '';
    const cleanedNom = nom?.replace(/^\?\s*SANS\s+NOM$/i, '') || '';

    const rawTokens = `${cleanedPrenom} ${cleanedNom}`
      .replace(/-/g, ' ') // remplace les traits d’union
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !/^dit(?:e)?$/.test(t)); // on ignore les "dit"

    return Array.from(new Set(rawTokens));
  }

  // Analyse de toutes les mentions
  for (const mention of mentions) {
    const tokens = extractTokens(mention.prenom, mention.nom);

    tokens.forEach((t) => {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    });

    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        const a = tokens[i];
        const b = tokens[j];

        // Enregistre les deux ordres
        const pair1 = `${a}__${b}`;
        const pair2 = `${b}__${a}`;

        pairCounts[pair1] = (pairCounts[pair1] || 0) + 1;

        if (!coOccurCounts[a]) coOccurCounts[a] = {};
        if (!coOccurCounts[b]) coOccurCounts[b] = {};
        coOccurCounts[a][b] = (coOccurCounts[a][b] || 0) + 1;
        coOccurCounts[b][a] = (coOccurCounts[b][a] || 0) + 1;
      }
    }
  }

  // Identifier les associations stables
  const stablePairs: { a: string; b: string; count: number }[] = [];

  for (const key in pairCounts) {
    const [a, b] = key.split('__');
    const count = pairCounts[key];
    const ratioA = count / tokenCounts[a];
    const ratioB = count / tokenCounts[b];

    if (count >= 2 && ratioA > 0.7 && ratioB > 0.7) {
      // Choisir l’ordre majoritaire
      const forward = coOccurCounts[a]?.[b] || 0;
      const backward = coOccurCounts[b]?.[a] || 0;

      if (forward >= backward) {
        stablePairs.push({ a, b, count });
      } else {
        stablePairs.push({ a: b, b: a, count });
      }
    }
  }

  if (stablePairs.length === 0) return '';

  // Limiter à deux exemples
  const exemples = stablePairs
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map(
      ({ a, b, count }) =>
        `"${capitalize(a)}" et "${capitalize(b)}" (associés dans ${count} mentions)`,
    );

  return `Certaines combinaisons de noms et prénoms apparaissent systématiquement ensemble dans les actes, comme ${exemples.join(', ')}.`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type FiliationRow = {
  role: string;
  filiation: string | null;
  acte_id: string | null;
};

export function getFiliationPhrases(
  rawData: FiliationRow[],
  sexe: 'M' | 'F',
  actes?: ActeursParActe[],
): string {
  if (!rawData || rawData.length === 0) return '';

  // Étape 1 : garantir un début avec 'enfant'
  const data = [...rawData];
  const first = data[0];
  if (!first || first.role.toLowerCase() !== 'enfant') {
    data.unshift({ role: 'enfant', filiation: null, acte_id:null });
  }

  // Étape 2 : filtrer les changements
  const result: FiliationRow[] = [];
  let lastFiliation: string | null = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const currentFiliation = row.filiation ?? null;
    const currentRole = row.role.toLowerCase();

    const isSujetReconnu = currentRole === 'sujet' && currentFiliation === 'reconnu';
    const isNewFiliation = currentFiliation !== lastFiliation || isSujetReconnu;

    if (isNewFiliation) {
      result.push(row);
      lastFiliation = currentFiliation;
    }
  }

  // Étape 3 : séparation par groupe
  const narration: string[] = [];
  const enfantsEtSujets: FiliationRow[] = [];
  const autres: FiliationRow[] = [];

  for (const row of result) {
    const r = row.role.toLowerCase();
    if (r === 'enfant' || r === 'sujet') {
      enfantsEtSujets.push(row);
    } else {
      autres.push(row);
    }
  }

  // Étape 4 : construire la phrase groupée pour enfant + sujet
  const fragments = enfantsEtSujets.map((row, index) => {
    const acteAssocie = actes?.find((a) => a.acteId === row.acte_id) ?? { acteId: null, acteurs: [] };
    let base = getFiliationPhraseFromRow(row, sexe, acteAssocie).trim();
    const pronom = sexe === 'F' ? 'elle' : 'il';
  
    // Supprimer majuscule initiale
    base = base.charAt(0).toLowerCase() + base.slice(1);
  
    if (index === 0) {
      // Premier fragment = participe passé + pronom sujet
      return capitalize(base);
    } else {
      // Si le fragment ne contient pas déjà le pronom sujet, on le rajoute
      const needsPronom =
        !base.startsWith(pronom) && !base.startsWith(`${pronom} `) && !base.includes(`, ${pronom}`);
  
      return needsPronom ? `${capitalize(pronom)} ${base}` : capitalize(base);
    }
  });
  
  if (fragments.length > 0) {
    const paragraph = fragments.map(ensurePeriod).join(' ');
    narration.push(paragraph);
  }
  

  // Étape 5 : ajouter les autres phrases, séparément
  for (const row of autres) {
    const acteAssocie = actes?.find((a) => a.acteId === row.acte_id) ?? { acteId: null, acteurs: [] };
    const phrase = getFiliationPhraseFromRow(row, sexe, acteAssocie);
    narration.push(capitalize(ensurePeriod(phrase)));
  }

  return narration.join(' ');
}

function ensurePeriod(text: string): string {
  return text.trim().endsWith('.') ? text.trim() : text.trim() + '.';
}


export function getFiliationPhraseFromRow(row: FiliationRow, sexe: 'M' | 'F', acteAssocie: any): string {
  console.log('acteAssocie', acteAssocie)
  const pronom = sexe === 'F' ? 'elle' : 'il';
  const déclaré = sexe === 'F' ? 'déclarée' : 'déclaré';
  const reconnu = sexe === 'F' ? 'reconnue' : 'reconnu';
  const légitimé = sexe === 'F' ? 'légitimée' : 'légitimé';
  const naturel = sexe === 'F' ? 'naturelle' : 'naturel';
  const présenté = sexe === 'F' ? 'présentée' : 'présenté';
  const role = row.role?.toLowerCase().trim();
  const filiation = row.filiation?.toLowerCase().trim() ?? null;

  // ENFANT
  if (role === 'enfant') {
    switch (filiation) {
      case 'naturel':
        const nDeclarant = acteAssocie?.acteurs?.find((a:any) => a.est_declarant);
        const nDeclarantNom = [nDeclarant.prenom, nDeclarant.nom].filter(Boolean).join(' ');
        const nDeclarantLien = nDeclarant.lien;
        const nDeclarantDéclaré = nDeclarant.sexe === 'F'? 'déclarée':'déclaré';
        const nDeclarantIntitule = nDeclarantNom + (nDeclarantLien ? " qui s'est "+nDeclarantDéclaré+" « "+nDeclarantLien+" »" : '')

        const nPere = (acteAssocie?.acteurs?.find((a:any) => a.role == 'enfant')?.pere_est_cite ? 'son père': '');
        const nMere = (acteAssocie?.acteurs?.find((a:any) => a.role == 'enfant')?.mere_est_citee ? 'sa mère': '');
        const nParent = (nPere && nMere)? (nMere + " et de " +nPere) : (nPere ? nPere : nMere ? nMere :'');

        return `${pronom} a été ${déclaré} comme enfant ${naturel} de ${nParent} par ${nDeclarantIntitule}`;
      case 'reconnu':
        const rDeclarant = acteAssocie?.acteurs?.find((a:any) => a.est_declarant);
        const rDeclarantSexe = rDeclarant.sexe === 'F' ? 'sa' : 'son';
        const rDeclarantRole = rDeclarant.role;
        return `${pronom} a été ${déclaré}, à sa naissance, par ${rDeclarantSexe} ${rDeclarantRole} qui l'a reconnu`;
      case 'légitime':
        return `à sa naissance, ses parents étaient mariés, ${pronom} fut donc légalement ${déclaré} comme leur enfant légitime.`;
      default:
        return 'Les documents disponibles ne permettent pas de déterminer avec certitude sa filiation à sa naissance';
    }
  }

  // SUJET
  if (role === 'sujet') {
    switch (filiation) {
      case 'reconnu':
        const sDeclarant = acteAssocie?.acteurs?.find((a:any) => a.est_declarant);
        const sDeclarantRole = sDeclarant.role == "père"? "son père": (sDeclarant.role == "mère"? "sa mère": '');
        const sActeDate = sDeclarant.acte_date
        return `${pronom} a été ${reconnu} par ${sDeclarantRole} en ${getYearFromIsoDate(sActeDate)}`;
      default:
        return `Filiation précisée comme « ${row.filiation} ».`;
    }
  }
  
  // ENFANT LÉGITIMÉ
  if (role === 'enfant légitimé') {
    if (filiation === 'légitimé') {
      const elActeDate = acteAssocie?.acteurs?.find((a:any) => a.role == 'officier').acte_date;
      return `${pronom} a été ${légitimé} par le mariage de ses parents célébré en  ${getYearFromIsoDate(elActeDate)}`;
    }
    return `Légitimé selon une modalité spécifique : « ${row.filiation} ».`;
  }

  // ÉPOUX / ÉPOUSE
  if (role === 'époux' || role === 'épouse') {
    switch (filiation) {
      case 'naturel':
        const lePere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.pere_est_cite ? 'son père': '');
        const leMere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.mere_est_citee ? 'sa mère': '');
        const leParent = (lePere && leMere)? (lePere + " et de " +leMere) : (lePere ? lePere : leMere ? leMere :'');
        
        return `à son mariage, ${pronom} s'est ${présenté} comme enfant ${naturel} de ${leParent}`;
      case 'reconnu':
        const liPere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.pere_est_cite ? 'son père': '');
        const liMere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.mere_est_citee ? 'sa mère': '');
        const liParent = (liPere && liMere)? (liPere + " et de " +liMere) : (liPere ? liPere : liMere ? liMere :'');
        
        return `à son mariage, ${pronom} s'est ${présenté} comme enfant ${reconnu} de ${liParent}`;
      case 'légitime':
        return `à son mariage, ${pronom} s'est ${présenté} comme enfant légitime de ses parents`;
      case 'légitimé':
        return `à son mariage, ${pronom} s'est ${présenté} comme enfant légitimé de ses parents`;
      case 'inconnu':
        return `à son mariage, ${pronom} s'est ${présenté} comme enfant né de parents inconnus`;
      default:
        return `Filiation indiquée comme « ${row.filiation} » dans l’acte de mariage.`;
    }
  }

  // DÉFUNT
  if (role === 'défunt') {
    switch (filiation) {
      case 'naturel':
        const dnPere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.pere_est_cite ? 'son père': '');
        const dnMere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.mere_est_citee ? 'sa mère': '');
        const dnParent = (dnPere && dnMere)? (dnPere + " et de " +dnMere) : (dnPere ? dnPere : dnMere ? dnMere :'');
        
        return `à son décès, les déclarants l'ont déclaré enfant ${naturel} de de ${dnParent}`;
      case 'reconnu':
        const drPere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.pere_est_cite ? 'son père': '');
        const drMere = (acteAssocie?.acteurs?.find((a:any) => a.role == role)?.mere_est_citee ? 'sa mère': '');
        const drParent = (drPere && drMere)? (drPere + " et de " +drMere) : (drPere ? drPere : drMere ? drMere :'');
        
        return `à son décès, les déclarants l'ont déclaré enfant ${reconnu} de ${drParent}`;
      case 'légitime':
        return `à son décès, les déclarants l'ont déclaré enfant légitime de ses parents`;
      case 'légitimé':
        return `à son décès, les déclarants l'ont déclaré enfant légitimé de ses parents`;
      case 'inconnu':
        return `à son décès, les déclarants ont déclaré ne pas connaître l'identité de ses parents`;
      default:
        return `Filiation spécifiée comme « ${row.filiation} » dans l’acte de décès.`;
    }
  }

  // AUTRES RÔLES OU CAS NON PRÉVUS
  return `Rôle ${row.role} avec filiation ${row.filiation ?? 'non précisée'}.`;
}

export function getAnalysePatronyme(mentions: any[], individu: any): string {
  const totalMentions = mentions.length;

  // Noms normalisés
  const nomsUtilises = mentions
    .map((m) => m.nom?.trim().toUpperCase() || '? SANS NOM');

  const nomsSansNom = nomsUtilises.filter((n) => n === '? SANS NOM');
  const partSansNom = Math.round((nomsSansNom.length / totalMentions) * 100);

  // Liste unique des noms (hors "? SANS NOM")
  const nomsUniques = Array.from(new Set(nomsUtilises.filter((n) => n !== '? SANS NOM')));

  // Détection de variantes
  const variantes: string[] = [];
  for (let i = 0; i < nomsUniques.length; i++) {
    for (let j = i + 1; j < nomsUniques.length; j++) {
      const a = nomsUniques[i];
      const b = nomsUniques[j];
      if (
        a.length > 2 &&
        b.length > 2 &&
        (a.includes(b) || b.includes(a)) &&
        a !== b
      ) {
        variantes.push(`${a} / ${b}`);
      }
    }
  }

  // Transitions de nom, triées chronologiquement
  const mentionsTriees = [...mentions]
    .filter((m) => m.acte_date)
    .sort((a, b) => new Date(a.acte_date).getTime() - new Date(b.acte_date).getTime());

  const transitions: string[] = [];
  for (let i = 1; i < mentionsTriees.length; i++) {
    const prevNom = mentionsTriees[i - 1].nom?.trim().toUpperCase() || '? SANS NOM';
    const currNom = mentionsTriees[i].nom?.trim().toUpperCase() || '? SANS NOM';
    const prevDate = mentionsTriees[i - 1].acte_date?.slice(0, 10) || '?';
    const currDate = mentionsTriees[i].acte_date?.slice(0, 10) || '?';

    if (prevNom !== currNom) {
      transitions.push(
        `Entre le ${prevDate} et le ${currDate}, le nom passe de « ${prevNom} » à « ${currNom} »`
      );
    }
  }

  // Origine familiale du nom (père, mère, fratrie, enfants)
  const liensDetectes = new Set<string>();
  mentions.forEach((m) => {
    const nomActuel = m.nom?.trim().toUpperCase();
    if (!nomActuel || nomActuel === '? SANS NOM') return;

    if (m.pere_nom?.trim().toUpperCase() === nomActuel) liensDetectes.add('père');
    if (m.mere_nom?.trim().toUpperCase() === nomActuel) liensDetectes.add('mère');
    if (m.fratrie_ids?.length) liensDetectes.add('frères/sœurs');
    if (m.enfants_ids?.length) liensDetectes.add('enfants');
  });

  // Construction du texte final
  const phrases: string[] = [];

  if (nomsUniques.length === 0 && nomsSansNom.length === totalMentions) {
    phrases.push(`Aucun patronyme n’est mentionné dans les actes disponibles.`);
    return phrases.join('\n\n');
  }

  phrases.push(
    `Le nom de famille est mentionné dans ${totalMentions - nomsSansNom.length} mention${totalMentions - nomsSansNom.length > 1 ? 's' : ''} sur ${totalMentions}.`
  );

  if (nomsUniques.length > 0) {
    phrases.push(`Voici les noms portés : ${nomsUniques.map((n) => `« ${n} »`).join(', ')}.`);
  }

  if (partSansNom > 0) {
    phrases.push(`Le nom est absent dans ${nomsSansNom.length} mention${nomsSansNom.length > 1 ? 's' : ''}, soit environ ${partSansNom} % des cas.`);
  }

  if (variantes.length > 0) {
    phrases.push(`Certaines formes sont proches et peuvent être des variantes : ${variantes.join(', ')}.`);
  }

  if (transitions.length > 0) {
    phrases.push(`On observe des changements de nom au fil du temps :\n- ${transitions.join('\n- ')}`);
  }

  if (liensDetectes.size > 0) {
    phrases.push(`Le patronyme est également porté par d’autres membres de la famille : ${Array.from(liensDetectes).join(', ')}.`);
  }

  return phrases.join('\n\n');
}

export function getNarrationSignature(individu: any, mentionsSignables: any[]): string {

  if (mentionsSignables.length === 0) return '';

  const total = mentionsSignables.length;
  const signées = mentionsSignables.filter((m) => m.signature === 'a signé');
  const nonSignées = mentionsSignables.filter((m) => m.signature !== 'a signé');
  const inconnues = mentionsSignables.filter((m) => m.signature === null || m.signature === undefined);
  const pronom = individu.sexe === 'F' ? 'elle' : 'il';

  // Dates utiles
  const premièreSignature = signées
    .map((m) => m.acte_date)
    .filter(Boolean)
    .sort()[0];

  const dernièreSignature = signées
    .map((m) => m.acte_date)
    .filter(Boolean)
    .sort()
    .at(-1);

  const dernièreNonSignature = nonSignées
    .map((m) => m.acte_date)
    .filter(Boolean)
    .sort()
    .at(-1);

  const libelles = new Set(
    signées
      .map((m) => m.signature_libelle?.trim())
      .filter((l) => l && l.length > 1)
  );

  const phrases: string[] = [];

  phrases.push(
    `${individu.prenom} apparaît dans ${total} mention${
      total > 1 ? 's' : ''
    } où une signature était attendue.`
  );

  if (signées.length > 0) {
    phrases.push(
      `${pronom} a signé ${signées.length} fois, entre ${getYearFromIsoDate(premièreSignature)} et ${getYearFromIsoDate(dernièreSignature)}.`
    );
  }

  if (nonSignées.length > 0 && premièreSignature) {
    const avant = nonSignées.filter((m) => m.acte_date && m.acte_date < premièreSignature).length;
    if (avant > 0) {
      phrases.push(`Avant ${getYearFromIsoDate(premièreSignature)}, ${pronom} ne savait sans doute pas signer.`);
    }
  }

  if (libelles.size > 0) {
    phrases.push(
      `${pronom} signait sous la forme ${Array.from(libelles)
        .map((s) => `« ${s} »`)
        .join(', ')}.`
    );
  }

  return phrases.join(' ');
}
