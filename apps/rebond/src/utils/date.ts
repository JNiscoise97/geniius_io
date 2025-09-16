// utils/date.ts

/**
 * Normalise une date (au format libre) vers le format ISO "AAAA-MM-DD".
 * Accepte des séparateurs : "/", ".", "-" ou espace.
 * Détecte si l’année est en première ou dernière position.
 */
export function normalizeDateString(raw: string): string | null {
    const input = raw.trim().toLowerCase()
  
    // Gestion du format français long : "10 décembre 1818"
    const frenchLongDateRegex = /^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/
    const mois: Record<string, string> = {
      janvier: "01",
      février: "02",
      fevrier: "02",
      mars: "03",
      avril: "04",
      mai: "05",
      juin: "06",
      juillet: "07",
      août: "08",
      aout: "08",
      septembre: "09",
      octobre: "10",
      novembre: "11",
      décembre: "12",
      decembre: "12",
    }
  
    const matchLong = input.match(frenchLongDateRegex)
    if (matchLong) {
      const [_, jour, moisStr, annee] = matchLong
      const moisNum = mois[moisStr]
      if (!moisNum) return null
      const day = jour.padStart(2, "0")
      return `${annee}-${moisNum}-${day}`
    }
  
    // Gestion des formats numériques
    const separator = ["-", "/", ".", " "].find((s) => input.includes(s))
    if (!separator) return null
  
    const parts = input.split(separator).map((p) => p.trim())
  
    if (parts.length !== 3) return null
  
    const [a, b, c] = parts
  
    // AAAA-MM-JJ
    if (a.length === 4) {
      return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
    }
  
    // JJ-MM-AAAA
    if (c.length === 4) {
      return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`
    }
  
    return null
  }
  
  
  /**
   * Vérifie si une date ISO (YYYY-MM-DD) est valide
   */
  export function isValidDateString(iso: string): boolean {
    try {
        const date = new Date(iso)
        return !isNaN(date.getTime()) && iso === date.toISOString().substring(0, 10)
    } catch {
        return false
    }
  }
  
  /**
   * Formatte une date ISO "YYYY-MM-DD" en "D mois YYYY"
   * Exemple : "2024-10-02" => "2 octobre 2024"
   */
  export function formatDateToFrench(iso: string): string {
    try {
      const date = new Date(iso);
      const parts = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).split(' ');
  
      // Ajoute "er" si le jour est 1
      if (parts[0] === '1') {
        parts[0] = '1er';
      }
  
      return parts.join(' ');
    } catch {
      return iso;
    }
  }
  

  /**
     * Formatte une date ISO "YYYY-MM-DD" en "DD/MM/YYYY"
     * Exemple : "2024-10-02" => "02/10/2024"
     */
    export function formatDateToNumericFrench(iso: string): string {
        try {
        const date = new Date(iso)
        const day = String(date.getDate()).padStart(2, "0")
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
        } catch {
        return iso
        }
    }
  

    export function getYearFromIsoDate(isoDate: string | null | undefined): string | null {
      if (!isoDate) return null;
    
      const date = new Date(isoDate);
      return isNaN(date.getTime()) ? null : String(date.getFullYear());
    }
    