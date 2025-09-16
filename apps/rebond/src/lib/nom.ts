// nom.ts

export function displayNom(prenom?: string | null, nom?: string | null): string {
  const safePrenom = prenom?.trim() || '';
  const safeNom = nom?.trim() || '';

  const label = [safePrenom, safeNom].filter(part => part.length > 0).join(' ');
  return label || 'Sans nom';
}

  export function displayNotaireNom(titre?: string | null, nom?: string | null, prenom?: string | null): string {
    const safeTitre = titre?.trim() || '';

    const safePrenom = prenom?.trim() || '';
  const safeNom = nom?.trim() || '';

  const label = [safeTitre, safeNom, safePrenom].filter(part => part.length > 0).join(' ');
  return label || 'Sans nom';
}

  