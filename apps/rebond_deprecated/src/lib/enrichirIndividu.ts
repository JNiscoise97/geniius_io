// enrichirIndividu.tsx

import { formatDateToFrench } from '@/utils/date';
import { enrichirDateNaissanceEstimee } from './enrichirActeur';

export function getTopNomsPrenoms(acteurs: any[]) {
    const mapCount = (arr: string[]) =>
      arr.reduce((acc, val) => {
        const cleanVal = val?.trim();
        if (cleanVal) acc[cleanVal] = (acc[cleanVal] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  
    const prenomsList = acteurs.map((a) => a.prenom).filter(Boolean);
    const nomsList = acteurs.map((a) => a.nom).filter(Boolean);
  
    const prenomsCount = mapCount(prenomsList);
    const nomsCount = mapCount(nomsList);
  
    const sortedPrenoms = Object.entries(prenomsCount)
      .sort((a, b) => b[1] - a[1])
      .map(([prenom]) => prenom);
  
    const sortedNoms = Object.entries(nomsCount)
      .sort((a, b) => b[1] - a[1])
      .map(([nom]) => nom);
  
    return {
      prenoms: sortedPrenoms.join(', '),
      noms: sortedNoms.join(', '),
    };
  }

  export function getChronoProfessions(acteurs: any[]) {
    const uniqueProfessions: string[] = [];
  
    // On trie les acteurs par date d'acte croissante
    const sorted = [...acteurs]
      .filter((a) => !!a.profession_brut && !!a.acte_date)
      .sort((a, b) => new Date(a.acte_date).getTime() - new Date(b.acte_date).getTime());
  
    for (const acteur of sorted) {
      const prof = acteur.profession_brut.trim();
      if (prof && !uniqueProfessions.includes(prof)) {
        uniqueProfessions.push(prof);
      }
    }
  
    return uniqueProfessions.join(', ');
  }


  export function getNaissance(acteurs: any[]): { date: string; lieu: string } {
    const rolesParPriorite = ['enfant', 'époux', 'épouse', 'défunt'];
  
    const normaliser = (val?: string | null) => val?.trim() || null;
  
    // 🔎 Trouver la première date de naissance disponible selon priorité des rôles
    let date: string | null = null;
    for (const role of rolesParPriorite) {
      const a = acteurs.find((x) => (x.role?.toLowerCase() ?? '') === role);
      if (a?.naissance_date) {
        date = formatDateToFrench(normaliser(a.naissance_date)!);
        break;
      }
    }
  
    // ⏱️ Sinon, estimer à partir des âges
    if (!date) {
      const estimations: Record<string, number> = {};
      for (const a of acteurs) {
        const est = enrichirDateNaissanceEstimee(a);
        if (est) estimations[est] = (estimations[est] || 0) + 1;
      }
  
      const estiméeBrute = Object.entries(estimations)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
  
      date = estiméeBrute ?? 'date indéterminée';
    }
  
    // 📍 Trouver le premier lieu de naissance selon priorité des rôles et sources (domicile > origine)
    let lieu: string | null = null;
    for (const role of rolesParPriorite) {
      const a = acteurs.find((x) => (x.role?.toLowerCase() ?? '') === role);
      if (a) {
        lieu = normaliser(a.naissance_lieux) || normaliser(a.origine);
        if (lieu) break;
      }
    }
  
    return {
      date,
      lieu: lieu || 'lieu indéterminé',
    };
  }
  

export function getDeces(acteurs: any[]): { date: string; lieu: string } {
    // Cas 1 : un défunt est identifié
    const defunt = acteurs.find((a) => (a.role?.toLowerCase() ?? '') === 'défunt');
    if (defunt) {
      const date = formatDateToFrench(defunt.deces_date?.trim()) || 'date indéterminée';
      const lieu = defunt.deces_lieux?.trim() || 'lieu indéterminé';
      return { date, lieu };
    }
  
    // Cas 2 : pas de défunt, mais personnes marquées mortes
    const morts = acteurs
      .filter((a) => a.age === 'dcd' || a.est_vivant === false)
      .filter((a) => !!a.acte_date);
  
    if (morts.length > 0) {
      const plusAncien = morts.sort(
        (a, b) =>
          new Date(a.acte_date).getTime() - new Date(b.acte_date).getTime()
      )[0];
      const acteDate = plusAncien?.acte_date?.slice(0, 10);
      return {
        date: acteDate ? `avant le ${formatDateToFrench(acteDate)}` : 'date indéterminée',
        lieu: 'lieu indéterminé',
      };
    }
  
    // Cas 3 : aucune info
    return {
      date: 'date indéterminée',
      lieu: 'lieu indéterminé',
    };
  }