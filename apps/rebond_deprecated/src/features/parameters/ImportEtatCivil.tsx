// pages/admin/ImportEtatCivil.tsx

import { useState } from 'react';
import { read, utils } from 'xlsx';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';

export function parseExcelDate(raw: any): string | null {
  try {
    if (raw instanceof Date) {
      return raw.toISOString().slice(0, 10);
    }

    if (typeof raw === 'string') {
      const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        const [_, dd, mm, yyyy] = match;
        const parsed = Date.parse(`${yyyy}-${mm}-${dd}`);
        return isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
      }

      const parsed = Date.parse(raw);
      return isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
    }

    if (typeof raw === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const parsed = new Date(excelEpoch.getTime() + raw * 86400000);
      return parsed.toISOString().slice(0, 10);
    }

    return null;
  } catch {
    return null;
  }
}

export async function insertBatch<T>(
  supabase: SupabaseClient,
  table: string,
  rows: T[],
  batchSize = 100,
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    console.log(`✅ Insertion ${table} : batch ${i / batchSize + 1} (${batch.length} éléments)`);
    if (error) {
      console.error(
        `❌ Erreur lors de l'insertion dans ${table} (batch ${i / batchSize + 1})`,
        error,
      );
      toast.error(`Erreur à l'insertion dans ${table}`);
      throw error;
    }
  }
}

export default function ImportEtatCivil() {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const formatNomComplet = (p: string, n: string) => (p && n ? `${p} ${n}` : p || n);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer, { type: 'array' });
      const sheetNames = ['Naissance', 'Mariage', 'Décès'];

      const bureauMap: Record<string, string> = {
        Deshaies: 'Mairie de Deshaies',
        Gourbeyre: 'Mairie de Gourbeyre',
      };

      const { data: bureaux } = await supabase.from('etat_civil_bureaux').select('id, nom');
      const nomToBureauId: Record<string, string> = {};
      bureaux?.forEach((b) => {
        nomToBureauId[b.nom] = b.id;
      });

      const actes: any[] = [];
      const entites: any[] = [];
      const acteurs: any[] = [];
      const mappings: any[] = [];

      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json(worksheet, { defval: '' }) as any[];

        const multiTotals: Record<string, number> = {};
        const multiNomsliste: Record<string, string[]> = {};
        json.forEach((row) => {
          const type = row['type_acte'];
          const commune = (row['commune'] || '').trim();
          const bureauNom = bureauMap[commune];
          const bureauId = nomToBureauId[bureauNom];
          if (!bureauId) return;

          const annee = parseInt(row['année'], 10);
          const isMulti = !!row['multi'];
          const multiKey = isMulti ? `${type}-${bureauId}-${annee}-${row['acte']}` : null;

          if (multiKey) {
            multiTotals[multiKey] = (multiTotals[multiKey] || 0) + 1;
          }

          const prenom = (r: string) => row[`[${r}] prenom`] || '';
          const nom = (r: string) => row[`[${r}] nom`] || '';

          if (multiKey && ['N', 'A', 'R'].includes(type)) {
            const typeKey = type as 'N' | 'A' | 'R';
            const personne = {
              N: formatNomComplet(prenom('enfant'), nom('enfant')),
              A: formatNomComplet(prenom('sujet'), nom('sujet')),
              R: formatNomComplet(prenom('sujet'), nom('sujet')),
            }[typeKey];

            if (personne) {
              if (!multiNomsliste[multiKey]) multiNomsliste[multiKey] = [];
              multiNomsliste[multiKey].push(personne);
            }
          }
        });

        const formatNomsliste = (noms: string[]) => {
          if (noms.length === 0) return '';
          if (noms.length === 1) return noms[0];
          return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
        };
        const multiKeyToActeId: Record<string, string> = {};
        for (const row of json) {
          // 🔐 Cast explicite en type connu (ou filtrer dynamiquement avec une guard)
          const type = row['type_acte'] as 'A' | 'R' | 'N' | 'M' | 'D';

          const commune = (row['commune'] || '').trim();
          const bureauNom = bureauMap[commune];
          const bureauId = nomToBureauId[bureauNom];
          if (!bureauId) continue;

          const annee = parseInt(row['année'], 10);

          const isMulti = !!row['multi'];
          const multiKey = isMulti ? `${type}-${bureauId}-${annee}-${row['acte']}` : null;
          const isFirstMulti = isMulti && row['multi'] === 'A';

          let acteId: string;
          if (multiKey) {
            if (!multiKeyToActeId[multiKey]) {
              multiKeyToActeId[multiKey] = uuidv4();
            }
            acteId = multiKeyToActeId[multiKey];
          } else {
            acteId = uuidv4();
          }

          const date = parseExcelDate(row['date']);

          const comparutionMairie =
            (row['lieu comparution_maison communale'] || '').toLowerCase() !== 'non';

          // Préparation de l'entité principale (label personnalisé selon type)
          const prenom = (r: string) => row[`[${r}] prenom`] || '';
          const nom = (r: string) => row[`[${r}] nom`] || '';

          const labelMap: Record<'N' | 'A' | 'R' | 'M' | 'D', string> = {
            N: `acte de naissance de {nomsliste}`,
            A: `acte d'affranchissement de {nomsliste}`,
            R: `acte de reconnaissance de ${isMulti ? '{compteur} enfants ({nomsliste})' : '{nomsliste}'} par ${
              row['[déclarant] lien'] === "père de l'enfant"
                ? formatNomComplet(prenom('père'), nom('père'))
                : formatNomComplet(prenom('mère'), nom('mère'))
            }`,
            M: `acte de mariage de ${formatNomComplet(prenom('époux'), nom('époux'))} et de ${formatNomComplet(prenom('épouse'), nom('épouse'))}`,
            D: `acte de décès de ${formatNomComplet(prenom('défunt'), nom('défunt'))}`,
          };

          if (!isMulti || isFirstMulti) {
            const nomsliste =
              isMulti && multiKey && multiNomsliste[multiKey]
                ? formatNomsliste(multiNomsliste[multiKey])
                : (() => {
                    if (['N', 'A', 'R'].includes(type)) {
                      const typeKey = type as 'N' | 'A' | 'R';
                      return {
                        N: formatNomComplet(prenom('enfant'), nom('enfant')),
                        A: formatNomComplet(prenom('sujet'), nom('sujet')),
                        R: formatNomComplet(prenom('sujet'), nom('sujet')),
                      }[typeKey];
                    }
                    return '';
                  })();

            actes.push({
              id: acteId,
              bureau_id: bureauId,
              annee,
              transcription: row['transcription'],
              source: row['source'],
              reference: row['référence'],
              numero_acte: row['acte'],
              multi: isMulti ? 'oui' : 'non',
              type_acte: {
                A: 'affranchissement',
                R: 'reconnaissance',
                N: 'naissance',
                M: 'mariage',
                D: 'décès',
              }[type],
              date,
              mentions_marginales: row['mentions marginales'],
              comparution_mairie: comparutionMairie,
              comparution_observations: row['lieu comparution_observations'],
              contrat_mariage: row['contrat de mariage_a eu lieu'],
              enfants_legitimes: row['enfants_légitimés'],
              enfants_nombre: row['enfants_nombre'] ? parseInt(row['enfants_nombre'], 10) : null,
              label: labelMap[type]
                .replace('{nomsliste}', nomsliste)
                .replace('{compteur}', isMulti ? `${multiTotals[multiKey!]}` : ''),
              statut:
                row['transcription'] === 'oui'
                  ? 'IN_PROGRESS'
                  : !row['[officier] nom']
                    ? 'TO_TRANSCRIBE'
                    : 'DRAFT',
            });
          }
          const lienDeclarant =
            row['[déclarant] lien'] === "père de l'enfant"
              ? 'père'
              : row['[déclarant] lien'] === "mère de l'enfant"
                ? 'mère'
                : 'autre';

          // Construction de l'objet de citation des rôles selon le type d’acte
          const citations: Record<string, boolean | null> = {};
          const roleKeys = Object.keys(row).filter((k) => /\[.+\]/.test(k));
          const roles = [
            ...new Set(
              roleKeys
                .map((k) => {
                  const match = k.match(/\[([^\]]+)\]/);
                  return match ? match[1] : null;
                })
                .filter((r): r is string => typeof r === 'string'),
            ),
          ];

          roles.forEach((role) => {
            const estCite = row[`[${role}] est cité`];
            if (
              ['père', 'mère', 'époux-père', 'époux-mère', 'épouse-père', 'épouse-mère'].includes(
                role,
              )
            ) {
              citations[role] = estCite === '' ? null : estCite === 'oui';
            } else if ((type == 'A' || type == 'R') && ['sujet'].includes(role)) {
              citations[role] = true;
            } else if (type == 'N' && ['enfant'].includes(role)) {
              citations[role] = true;
            } else if (type == 'M' && ['époux', 'épouse'].includes(role)) {
              citations[role] = true;
            } else if (type == 'D' && ['défunt'].includes(role)) {
              citations[role] = true;
            }
          });

          // Nettoyage des rôles inutiles selon le type
          const filterRoles = (base: string[]) =>
            base.filter((r) => {
              if (!row[`[${r}] nom`] && !['père', 'mère'].includes(r)) return false;
              if (
                ['père', 'mère', 'époux-père', 'époux-mère', 'épouse-père', 'épouse-mère'].includes(
                  r,
                )
              ) {
                return citations[r] === true || (!!row[`[${r}] nom`] && citations[r] == null);
              }
              return true;
            });

          const filteredRoles = (() => {
            if (['N'].includes(type)) {
              return filterRoles([
                'officier',
                'déclarant',
                'enfant',
                'père',
                'mère',
                'témoin 1',
                'témoin 2',
              ]);
            }
            if (['A', 'R'].includes(type)) {
              return filterRoles([
                'officier',
                'déclarant',
                'sujet',
                'père',
                'mère',
                'témoin 1',
                'témoin 2',
              ]);
            }
            if (type === 'M') {
              return filterRoles([
                'officier',
                'époux',
                'époux-père',
                'époux-mère',
                'épouse',
                'épouse-père',
                'épouse-mère',
                'témoin 1',
                'témoin 2',
                'témoin 3',
                'témoin 4',
              ]);
            }
            if (type === 'D') {
              return filterRoles([
                'officier',
                'défunt',
                'père',
                'mère',
                'témoin 1',
                'témoin 2',
                'témoin 3',
              ]);
            }
            return [];
          })();

          for (const role of filteredRoles) {
            if (isMulti && !isFirstMulti) {
              if (
                (type === 'N' && role !== 'enfant') ||
                ((type === 'A' || type === 'R') && role !== 'sujet')
              ) {
                continue; // ⛔ on ignore ce rôle
              }
            }
            let rawSignature;
            if(lienDeclarant == "père" || lienDeclarant == "mère"){
              rawSignature = row[`[déclarant] signature`]?.toLowerCase();
            } else {
              rawSignature = row[`[${role}] signature`]?.toLowerCase();
            }
            const rawAge = row[`[${role}] age`];
            const estVivant = rawAge !== 'dcd';
            const age = estVivant ? row[`[${role}] age`] : null;
            let estPresent: boolean | null;

            const rawEstPresent = row[`[${role}] est présent`]?.toLowerCase();
            if (rawEstPresent === 'oui') {
              estPresent = true;
            } else if (rawEstPresent === 'non') {
              estPresent = false;
            } else {
              estPresent = false;
              if (['officier', 'témoin 1', 'témoin 2', 'témoin 3', 'témoin 4', 'époux', 'épouse'].includes(role)) {
                estPresent = true;
              } else if (role === 'père' && lienDeclarant === 'père') {
                estPresent = true;
              } else if (role === 'mère' && lienDeclarant === 'mère') {
                estPresent = true;
              } else if (role === 'déclarant' && row[`[déclarant] nom`]) {
                estPresent = true;
              }
            }

            let sexe: string | null;
            const rawSexe = row[`[${role}] sexe`]?.toUpperCase();
            if (rawSexe === 'F') {
              sexe = 'F';
            } else if (rawSexe === 'M') {
              sexe = 'M';
            } else {
              sexe = null;
              if (['père', 'époux-père', 'épouse-père'].includes(role)) {
                sexe = 'M';
              } else if (['mère', 'époux-mère', 'épouse-mère'].includes(role)) {
                sexe = 'F';
              }
            }

            let estDeclarant: boolean = false;
            if (role === 'déclarant') {
              estDeclarant = true;
            } else if (role === 'père' && lienDeclarant === 'père') {
              estDeclarant = true;
            } else if (role === 'mère' && lienDeclarant === 'mère') {
              estDeclarant = true;
            }

            let pereEstCite: boolean | null;
            let mereEstCitee: boolean | null;
            if(type === 'M' && role === 'époux'){
              const rawPereEstCite = row[`[époux-père] est cité`]?.toLowerCase();
              const rawMereEstCitee = row[`[époux-mère] est cité`]?.toLowerCase();
              pereEstCite = rawPereEstCite === '' ? null : rawPereEstCite === 'oui'
              mereEstCitee = rawMereEstCitee === '' ? null : rawMereEstCitee === 'oui'
            } else if (type === 'M' && role === 'épouse'){
              const rawPereEstCite = row[`[épouse-père] est cité`]?.toLowerCase();
              const rawMereEstCitee = row[`[épouse-mère] est cité`]?.toLowerCase();
              pereEstCite = rawPereEstCite === '' ? null : rawPereEstCite === 'oui'
              mereEstCitee = rawMereEstCitee === '' ? null : rawMereEstCitee === 'oui'
            } else {
              const rawPereEstCite = row[`[père] est cité`]?.toLowerCase();
              const rawMereEstCitee = row[`[mère] est cité`]?.toLowerCase();
              pereEstCite = rawPereEstCite === '' ? null : rawPereEstCite === 'oui'
              mereEstCitee = rawMereEstCitee === '' ? null : rawMereEstCitee === 'oui'
            }

            const acteurId = uuidv4();
            const naissanceDate = parseExcelDate(row[`[${role}] naissance date`]);
            const decesDate = parseExcelDate(row[`[${role}] décès date`]);
            acteurs.push({
              id: acteurId,
              nom: nom(role),
              prenom: prenom(role),
              role,
              sexe,
              age,
              est_vivant: estVivant,
              profession: row[`[${role}] profession`] || null,
              statut: row[`[${role}] statut`] || null,
              fonction: row[`[${role}] fonction`] || null,
              filiation: row[`[${role}] filiation`] || null,
              origine: row[`[${role}] origine`] || null,
              domicile: row[`[${role}] domicile`] || null,
              naissance_date: naissanceDate || null,
              naissance_heure: row[`[${role}] naissance heure`] || null,
              naissance_lieu_commune: row[`[${role}] naissance lieu commune`] || null,
              naissance_lieu_section: row[`[${role}] naissance lieu section`] || null,
              naissance_lieu_hameau: row[`[${role}] naissance lieu hameau`] || null,
              naissance_lieu_précisions: row[`[${role}] naissance lieu précisions`] || null,
              deces_date: decesDate || null,
              deces_heure: row[`[${role}] décès heure`] || null,
              deces_lieu_commune: row[`[${role}] deces lieu commune`] || null,
              deces_lieu_section: row[`[${role}] deces lieu section`] || null,
              deces_lieu_hameau: row[`[${role}] deces lieu hameau`] || null,
              deces_lieu_précisions: row[`[${role}] deces lieu précisions`] || null,
              lien: row[`[${role}] lien`] || null,
              est_present: estPresent,
              est_consentant:
                row[`[${role}] est consentant`] === 'oui'
                  ? true
                  : row[`[${role}] est consentant`] === 'non'
                    ? false
                    : null,
              est_declarant: estDeclarant,
              a_signe: rawSignature === 'oui' ? true : rawSignature === 'non' ? false : null,
              signature:
                rawSignature === 'oui'
                  ? 'a signé'
                  : rawSignature === "n'a pas signé"
                    ? 'ne sait pas signer'
                    : null,
              pere_est_cite: pereEstCite,
              mere_est_citee: mereEstCitee,
              note: row[`[${role}] observations`] || null,
              multi: row['multi'] || null
            });

            const entiteId = uuidv4();
            const nomVal = nom(role);
            const prenomVal = prenom(role);
            const hasLabel = !!(nomVal || prenomVal);

            entites.push({
              id: entiteId,
              acte_id: acteId,
              label: hasLabel ? formatNomComplet(prenomVal, nomVal) : null,
              type: 'acteur',
              source_table: 'etat_civil_actes',
            });
            mappings.push({
              entite_id: entiteId,
              cible_type: 'etat_civil_actes',
              cible_id: acteurId,
            });
          }
        }
      }
      const marriageWorksheet = workbook.Sheets['Mariage-enfants'];
      if (marriageWorksheet) {
        const json = utils.sheet_to_json(marriageWorksheet, { defval: '' }) as any[];
        for (const row of json) {
          const commune = (row['commune'] || '').trim();
          const bureauNom = bureauMap[commune];
          const bureauId = nomToBureauId[bureauNom];
          if (!bureauId) continue;

          const annee = parseInt(row['année'], 10);
          if (isNaN(annee)) continue;

          const numeroActe = row['acte'];

          // Retrouver l'acte déjà créé
          const acte = actes.find(
            (a) =>
              a.bureau_id === bureauId &&
              a.annee === annee &&
              a.numero_acte === numeroActe &&
              a.type_acte === 'mariage',
          );
          if (!acte) continue;

          const enfantPrenom = row['[enfant] prenom'];
          const enfantNom = row['[enfant] nom'];
          const enfantId = uuidv4();

          const naissanceDate = parseExcelDate(row['[enfant] naissance date']);

          acteurs.push({
            id: enfantId,
            nom: enfantNom || null,
            prenom: enfantPrenom || null,
            role: 'enfant légitimé',
            sexe: row['[enfant] sexe'] || null,
            age: row['[enfant] age'] || null,
            naissance_date: naissanceDate,
            naissance_lieu_commune: row['[enfant] naissance lieu'] || null,
            note: row[`[enfant] observations`] || null,
            est_vivant: true,
            pere_est_cite: true,
            mere_est_citee: true,
            multi: row['multi'] || null,
          });

          const entiteId = uuidv4();
          const hasLabel = !!(enfantPrenom || enfantNom);
          entites.push({
            id: entiteId,
            acte_id: acte.id,
            label: hasLabel ? formatNomComplet(enfantPrenom, enfantNom) : null,
            type: 'acteur',
            source_table: 'etat_civil_actes',
          });

          mappings.push({
            entite_id: entiteId,
            cible_type: 'etat_civil_actes',
            cible_id: enfantId,
          });
        }
      }

      // Affichage final en console
      await insertBatch(supabase, 'etat_civil_actes', actes);
      console.log('➡️ etat_civil_actes', actes);
      await insertBatch(supabase, 'transcription_entites_acteurs', acteurs);
      console.log('➡️ transcription_entites_acteurs', acteurs);
      await insertBatch(supabase, 'transcription_entites', entites);
      console.log('➡️ transcription_entites', entites);
      await insertBatch(supabase, 'transcription_entites_mapping', mappings);
      console.log('➡️ transcription_entites_mapping', mappings);

      toast.success('Prévisualisation terminée. Voir console.');
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-xl font-bold'>Import des actes d’état civil</h1>
      <input type='file' accept='.xlsx' onChange={handleFileUpload} disabled={loading} />
      {loading && <p className='text-muted-foreground'>Import en cours...</p>}
    </div>
  );
}
