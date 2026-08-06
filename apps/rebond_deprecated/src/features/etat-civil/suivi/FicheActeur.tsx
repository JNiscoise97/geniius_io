//FicheActeur.tsx

import { Button } from '@/components/ui/button';
import { displayNom } from '@/lib/nom';
import { cn } from '@/lib/utils';
import { sanitizeActeurFields } from '@/store/useEntityStore';
import { useEtatCivilActesStore } from '@/store/useEtatCivilActesStore';
import { ChevronRight, Circle, Mars, Navigation, Pencil, Trash, Venus } from 'lucide-react';
import type { FC } from 'react';
import { getErrorsForActeur, type Incoherence } from '../ActeCoherence-complet';
import { champsParRole, sections } from '@/types/analyse';

export const FicheActeur: FC<{
  acteur: any;
  mode?: 'view' | 'edit';
  relations?: any[];
  onEdit?: (acteur: any) => void;
  onDelete?: (id: string) => void;
}> = ({ acteur, mode = 'view', relations = [], onEdit, onDelete }) => {
  const champ = (label: string, value: any, wide = false) => (
    <div className={cn('flex flex-col', wide ? 'col-span-2' : 'col-span-1')}>
      <span className='text-xs text-gray-500'>{label}</span>
      <span className='text-sm font-medium text-gray-800'>
        {value ?? <span className='text-gray-300'>—</span>}
      </span>
    </div>
  );
  console.log('FicheActeur.acteur', acteur);
  const { acte, entites } = useEtatCivilActesStore();
  let erreurs: Incoherence[] = [];
  if (acte && entites) erreurs = getErrorsForActeur(acteur, acte, entites, relations);

  const role = acteur.role || '—';
  const champsAttendues = champsParRole[role] ?? [];
  const champsValorises = Object.keys(acteur).filter((key) => {
    const val = acteur[key];
    if (val === null || val === '' || val === undefined) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  const champsAAfficher = Array.from(new Set([...champsAttendues, ...champsValorises]));
  console.log('champsAttendues', champsAttendues);
  console.log('champsValorises', champsValorises);

  function renderSection(key: string) {
    const section = sections[key];
    const fields = section.fields.filter((f) => champsAAfficher.includes(f));

    if (fields.length === 0) return null;

    return (
      <div key={key}>
        <h4 className='text-xs uppercase text-gray-400 mb-1 tracking-wide'>{section.title}</h4>
        <div className='grid grid-cols-2 gap-3'>
          {fields.map((field) =>
            champ(
              labelFor(field),
              formatValue(field, acteur[field], acteur),
              field === 'note' ||
                field === 'notes_ref' ||
                field === 'liens_matrimoniaux_ref' ||
                field === 'liens_non_matrimoniaux_ref' ||
                field === 'naissance_mention_toponyme' ||
                field === 'deces_mention_toponyme' ||
                field === 'domicile_mention_toponyme' ||
                field === 'residence_mention_toponyme' ||
                field === 'origine_mention_toponyme' ||
                field === 'naissance_lieu_brut' ||
                field === 'deces_lieu_brut' ||
                field === 'domicile_brut' ||
                field === 'residence_brut' ||
                field === 'origine_brut',
            ),
          )}
        </div>
      </div>
    );
  }

  const labelFor = (key: string): string =>
    ({
      est_nommee_par_nom_epoux: 'Nom de son époux ?',
      qualite: 'Qualité',
      sexe: 'Sexe',
      age: 'Âge',
      est_vivant: 'Vivant ?',
      profession_ref: 'Profession',
      profession_brut: 'Profession brut',
      statut_proprietaire_ref: 'Statut propriétaire',
      categorie_couleur_ref: 'Couleur',
      filiation_ref: 'Filiation',
      qualite_ref: 'Qualité',
      situation_fiscale_ref: 'Situation fiscale',
      situation_matrimoniale_ref: 'Situation matrimoniale',
      liens_matrimoniaux_ref: 'Liens matrimoniaux',
      statut_juridique_ref: 'Statut juridique',
      statut_brut: 'Statut brut',
      fonction: 'Fonction',
      domicile_mention_toponyme: 'Domicile',
      domicile_brut: 'Domicile brut',
      domicile: 'Domicile historique',
      residence_mention_toponyme: 'Résidence',
      residence_brut: 'Résidence brut',
      origine_mention_toponyme: 'Origine',
      origine_brut: 'Origine brut',
      origine: 'Origine historique',
      naissance_date: 'Date',
      naissance_heure: 'Heure',
      naissance_mention_toponyme: 'Lieu',
      naissance_lieu_brut: 'Lieu brut',
      naissance_lieux: 'Lieu historique',
      naissance_lieu_commune: 'Commune historique',
      naissance_lieu_section: 'Section historique',
      naissance_lieu_hameau: 'Hameau historique',
      naissance_lieu_précisions: 'Précisions historique',
      deces_date: 'Date',
      deces_heure: 'Heure',
      deces_mention_toponyme: 'Lieu',
      deces_lieu_brut: 'Lieu brut',
      deces_lieux: 'Lieu historique',
      deces_lieu_commune: 'Commune historique',
      deces_lieu_section: 'Section historique',
      deces_lieu_hameau: 'Hameau historique',
      deces_lieu_précisions: 'Précisions historique',
      lien: 'Lien',
      liens_non_matrimoniaux_ref: 'Autres liens',
      filiation: 'Filiation',
      pere_est_cite: 'Père cité ?',
      mere_est_citee: 'Mère citée ?',
      est_present: 'Présent ?',
      est_declarant: 'Déclarant ?',
      a_assiste_naissance: 'A assisté à la naissance ?',
      a_assiste_deces: 'A assisté au décès ?',
      a_signe: 'A signé ?',
      signature: 'Signature',
      signature_ref: 'Signature',
      signature_libelle: 'Libellé signature',
      note: 'Note',
      notes_ref: 'Notes structurées',
    })[key] ?? key;

  const formatValue = (key: string, value: any, acteur: any) => {
    if (key === 'naissance_mention_toponyme') {
      const path_labels = acteur.naissance_path_labels;
      if (!path_labels || path_labels.length == 0) return <span className='text-gray-300'>—</span>;
      return renderMentionToponyme(path_labels);
    }

    if (key === 'deces_mention_toponyme') {
      const path_labels = acteur.deces_path_labels;
      if (!path_labels || path_labels.length == 0) return <span className='text-gray-300'>—</span>;
      return renderMentionToponyme(path_labels);
    }

    if (key === 'domicile_mention_toponyme') {
      const path_labels = acteur.domicile_path_labels;
      if (!path_labels || path_labels.length == 0) return <span className='text-gray-300'>—</span>;
      return renderMentionToponyme(path_labels);
    }

    if (key === 'residence_mention_toponyme') {
      const path_labels = acteur.residence_path_labels;
      if (!path_labels || path_labels.length == 0) return <span className='text-gray-300'>—</span>;
      return renderMentionToponyme(path_labels);
    }

    if (key === 'origine_mention_toponyme') {
      const path_labels = acteur.origine_path_labels;
      if (!path_labels || path_labels.length == 0) return <span className='text-gray-300'>—</span>;
      return renderMentionToponyme(path_labels);
    }

    if (key === 'profession_ref') {
      const labels = acteur.profession_labels as string[] | undefined;
      const positions = acteur.profession_positions as number[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderProfessions(labels, positions);
    }

    if (key === 'statut_proprietaire_ref') {
      const labels = acteur.statut_proprietaire_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'categorie_couleur_ref') {
      const labels = acteur.categorie_couleur_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'filiation_ref') {
      const labels = acteur.filiation_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'qualite_ref') {
      const labels = acteur.qualite_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'situation_fiscale_ref') {
      const labels = acteur.situation_fiscale_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'situation_matrimoniale_ref') {
      const labels = acteur.situation_matrimoniale_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'signature_ref') {
      const labels = acteur.signature_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'statut_juridique_ref') {
      const labels = acteur.statut_juridique_labels as string[] | undefined;
      if (!labels || labels.length === 0) return <span className='text-gray-300'>—</span>;
      return renderStatutItem(labels);
    }

    if (key === 'liens_non_matrimoniaux_ref') {
      const items = acteur.liens_non_matrimoniaux_ref as any[] | undefined;
      return renderLiens(items ?? [], acteur.sexe);
    }

    if (key === 'liens_matrimoniaux_ref') {
      const items = acteur.liens_matrimoniaux_ref as any[] | undefined;
      return renderLiens(items ?? [], acteur.sexe);
    }

    if (key === 'notes_ref') {
      const items = acteur.notes_ref as any[] | undefined;
      return renderLiens(items ?? [], acteur.sexe);
    }

    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }

    return value ?? null;
  };

  return (
    <>
      <div className='relative rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-4 transition hover:shadow-md'>
        <div className='absolute top-3 right-3 flex gap-2'>
          {acteur.individu_id && (
            <Button size='icon' variant='outline' className='w-8 h-8' asChild>
              <a
                href={`/individu/${acteur.individu_id}`}
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Voir la fiche individu'
              >
                <Navigation className='w-4 h-4 opacity-70 text-indigo-600' />
              </a>
            </Button>
          )}
          {/* Boutons d’action */}
          {mode == 'edit' && onEdit && (
            <Button
              size='icon'
              variant='outline'
              className='w-8 h-8'
              onClick={() => onEdit(sanitizeActeurFields(acteur))}
            >
              <Pencil className='w-4 h-4' />
            </Button>
          )}

          {mode == 'edit' && onDelete && (
            <Button
              size='icon'
              variant='ghost'
              className='rounded-full border border-red-200 hover:bg-red-100'
              onClick={() => onDelete(acteur.id)}
              aria-label='Supprimer'
            >
              <Trash className='w-4 h-4 text-red-600' />
            </Button>
          )}
        </div>

        {/* En-tête */}
        <div>
          <div className='flex items-center gap-3'>
            {acteur.sexe === 'M' && (
              <Mars className='w-4 h-4 text-blue-500'>
                <title>Homme</title>
              </Mars>
            )}
            {acteur.sexe === 'F' && (
              <Venus className='w-4 h-4 text-pink-500'>
                <title>Femme</title>
              </Venus>
            )}
            {!['M', 'F'].includes(acteur.sexe) && (
              <Circle className='w-4 h-4 text-gray-400'>
                <title>Genre non précisé</title>
              </Circle>
            )}
            <h3 className='text-base font-semibold text-gray-800'>
              {displayNom(acteur.prenom, acteur.nom)}
            </h3>
          </div>
          <p className='text-sm text-gray-500'>{acteur.role || '—'}</p>
        </div>
        {erreurs.length > 0 && (
          <ul className='list-disc list-inside space-y-1 text-xs mt-1'>
            {erreurs.map((err, i) => (
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
        )}

        {Object.keys(sections).map(renderSection)}
      </div>
    </>
  );
};

function renderMentionToponyme(path_labels: any) {
  return (
    <ol className='flex flex-wrap items-center gap-x-1 gap-y-2'>
      {path_labels.map((label: any, idx: any) => {
        const isLeaf = idx === path_labels.length - 1;
        return (
          <li key={`${label}-${idx}`} className='flex items-center'>
            <span className={'border-transparent text-gray-700'} title={label}>
              {label}
            </span>
            {!isLeaf && <ChevronRight aria-hidden className='mx-1 h-4 w-4 text-gray-400' />}
          </li>
        );
      })}
    </ol>
  );
}

function renderProfessions(labels: string[], positions?: number[]) {
  const items = labels.map((label, i) => ({
    label,
    pos: Array.isArray(positions) && typeof positions[i] === 'number' ? positions[i] : i + 1,
  }));
  items.sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));

  return (
    <div className='flex flex-wrap gap-1'>
      {items.map((it, idx) => (
        <span
          key={`${it.label}-${idx}`}
          className='px-2 py-0.5 text-xs rounded-full border bg-gray-50'
          title={`#${it.pos}`}
        >
          {it.label}
        </span>
      ))}
    </div>
  );
}

function renderStatutItem(labels: string[]) {
  const items = labels.map((label) => ({
    label,
  }));

  return (
    <div className='flex flex-wrap gap-1'>
      {items.map((it, idx) => (
        <span
          key={`${it.label}-${idx}`}
          className='px-2 py-0.5 text-xs rounded-full border bg-gray-50'
        >
          {it.label}
        </span>
      ))}
    </div>
  );
}

// Supprime un " de" terminal (avec espaces normaux/insécables)
function stripTrailingDe(s?: string | null) {
  if (!s) return '';
  // espaces: normal \u0020, NBSP \u00A0, fine NBSP \u202F
  return s.replace(/[\u0020\u00A0\u202F]*de[\u0020\u00A0\u202F]*$/i, '').trim();
}

// Choisir la bonne forme du libellé selon le sexe du PORTEUR, puis retirer le " de"
function pickLienLabel(l: any, sourceSexe?: 'M' | 'F' | null) {
  const label = l.lien_label ?? l.label ?? null;
  const label_m = l.label_m ?? null;
  const label_f = l.label_f ?? null;
  const inv = !!l.invariable;

  let chosen: string | null;
  if (inv) {
    chosen = label ?? label_m ?? label_f ?? l.lien_code ?? l.code ?? 'lien';
  } else if (sourceSexe === 'F') {
    chosen = label_f ?? label ?? label_m ?? l.lien_code ?? l.code ?? 'lien';
  } else if (sourceSexe === 'M') {
    chosen = label_m ?? label ?? label_f ?? l.lien_code ?? l.code ?? 'lien';
  } else {
    chosen = label ?? label_m ?? label_f ?? l.lien_code ?? l.code ?? 'lien';
  }

  return stripTrailingDe(chosen);
}

function deArticlePour(role: string) {
  const r = (role || '').trim().toLowerCase();
  const dict: Record<string, string> = {
    père: 'du père',
    pere: 'du père',
    mère: 'de la mère',
    mere: 'de la mère',
    enfant: 'de l’enfant',
    défunt: 'du défunt',
    defunt: 'du défunt',
    défunte: 'de la défunte',
    defunte: 'de la défunte',
    époux: 'de l’époux',
    epoux: 'de l’époux',
    épouse: 'de l’épouse',
    epouse: 'de l’épouse',
    déclarant: 'du déclarant',
    declarant: 'du déclarant',
    déclarante: 'de la déclarante',
    declarante: 'de la déclarante',
  };
  if (dict[r]) return dict[r];

  const first = role?.trim()?.[0]?.toLowerCase() || '';
  const elision = 'aeiouyéèêàâîïôœùûh'.includes(first);
  return elision ? `de l’${role}` : `de ${role}`;
}

function cibleToText(l: any) {
  if (l.cible_type === 'role' && l.cible_role) return deArticlePour(l.cible_role);
  if (l.cible_type === 'texte' && l.cible_label) return `de ${l.cible_label}`;
  if (l.cible_type === 'acteur') {
    const a = l.cible_acteur;
    if (a?.role) {
      if (a?.role != 'mention') {
        return deArticlePour(a.role);
      } else {
        const nom = [a?.qualite, a?.prenom, a?.nom].filter(Boolean).join(' ');
        return `de ${nom} (${a?.role})`;
      }
    }
    const nom = [a?.qualite, a?.prenom, a?.nom].filter(Boolean).join(' ');
    return nom ? `de ${nom}` : 'de cet acteur';
  }
  return '';
}

function formatQualifs(l: any) {
  const q: string[] = [];
  if (l.fratrie_qualif) q.push(l.fratrie_qualif === 'uterin' ? 'utérin' : l.fratrie_qualif);
  if (Number.isFinite(l.cousin_degre)) {
    q.push(l.cousin_degre === 1 ? 'germain' : `${l.cousin_degre}\u1D49 degré`);
  }
  if (Number.isFinite(l.cousin_removal) && Math.abs(l.cousin_removal) > 0) {
    q.push(
      Math.abs(l.cousin_removal) === 1
        ? 'issu de germain'
        : `issu de ${Math.abs(l.cousin_removal)} fois germain`,
    );
  }
  if (l.cousin_double) q.push('double');
  if (l.cote) q.push('du côté ' + l.cote);
  return q.length ? ` — ${q.join(', ')}` : '';
}

function renderLiens(items: any[], sourceSexe?: 'M' | 'F' | null) {
  if (!items || items.length === 0) return <span className='text-gray-300'>—</span>;
  console.log('renderLiens.items', items)
  return (
    <ul className='list-disc pl-5 space-y-1'>
      {items
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((l, i) => {
          const base = pickLienLabel(l, sourceSexe); // ex. "grand-mère"
          const cible = cibleToText(l); // ex. "de l’enfant"
          const qualifs = formatQualifs(l); // ex. " — maternel"
          return <li key={i}>{`${base}${cible ? ` ${cible}` : ''}${qualifs}`}</li>;
        })}
    </ul>
  );
}
