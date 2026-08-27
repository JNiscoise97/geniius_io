//IndividuFiche.tsx

import { useIndividuStore } from '@/store/useIndividuStore';
import {
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  User,
  Users,
  ListTree,
  MapPin,
  Layers3,
  Briefcase,
  Archive,
  BookOpen,
  Mail,
  Settings,
  X,
  Share2,
  FileText,
  Mars,
  Venus,
  Circle,
  UsersIcon,
  InfoIcon,
  Loader2,
  SpellCheck,
  Navigation,
  Pen,
  Link2,
  ClipboardCheck,
  CheckCircle2,
} from 'lucide-react';
import IndividuLigneDeVieTable from './IndividuLigneDeVieTable';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase, supabaseRebond } from '@/lib/supabase';
import { Separator } from '@/components/ui/separator';
import {
  getChronoProfessions,
  getDeces,
  getNaissance,
  getTopNomsPrenoms,
} from '@/lib/enrichirIndividu';
import IndividuBiographie from '../mock-up/composants/IndividuBiographie';
import { EnfantCard } from './EnfantCard';
import AnalyseNomPrenom from './AnalyseNomPrenom';
import { Button } from '@/components/ui/button';
import AnalyseFamille from './analyse-famille/AnalyseFamille';
import AnalyseProfessionStatutFonction from './AnalyseProfessionStatutFonction';
import AnalyseSignature from './AnalyseSignature';
import RelationsAccordion from './RelationsAccordion';
import { displayNom } from '@/lib/nom';
import { formatDateToFrench } from '@/utils/date';
import { fetchEntityAttributes, fetchEntityDetail, upsertEntityAttribute } from '@/features/entites/entites.service';
import type { EntityAttribute, EntityDetail, EntityFact } from '@/features/entites/entites.types';
import { RefSinglePickerSmart } from '@/components/shared/RefSinglePickerSmart';
import { resolveRefTableClient } from '@/lib/supabase/refSchemaRouting';
import { TriStateButton, type TriState } from '@/components/shared/TriStateButton';

const tabs = [
  { label: 'Synthèse', icon: User },
  { label: 'Relations & faits', icon: Link2 },
  { label: 'Informations à valider', icon: ClipboardCheck },
  { label: 'Détails', icon: ListTree },
  { label: 'Ligne de vie', icon: Layers3 },
  { label: 'Famille', icon: Users },
  { label: 'Lieux', icon: MapPin },
  { label: 'Appellations', icon: SpellCheck },
  { label: 'Signature', icon: Pen },
  { label: 'Activités', icon: Briefcase },
  { label: 'Mentions', icon: Archive },
  { label: 'Sources', icon: BookOpen },
  { label: 'Hypothèses', icon: AlertCircle },
  { label: 'Réseau relationnel', icon: Share2 },
  { label: 'Notes de recherche', icon: FileText },
];

// Prédicats retenus comme "attributs d'identité" analysables dans l'onglet
// "Informations à valider" — liste volontairement restreinte aux faits qui
// décrivent la personne elle-même de façon stable (curatée à la main, même
// esprit que RELATION_PREDICATES dans entites.service.ts). Exclut les rôles
// dans un acte (comparant, témoin...), les relations (père/conjoint...) déjà
// couvertes par l'onglet "Relations & faits", et "age"/"name" qui ne sont
// pas des attributs stables à figer (l'âge varie par acte, le nom se gère
// par le renommage de la fiche canonique).
const ATTRIBUTE_PREDICATES: Record<string, string> = {
  sex: 'Sexe',
  birth_date: 'Date de naissance',
  birth_place: 'Lieu de naissance',
  death_date: 'Date de décès',
  death_place: 'Lieu de décès',
  occupation: 'Profession',
  residence: 'Résidence',
  domicile: 'Domicile',
  nationality: 'Nationalité',
  marital_status: 'Statut matrimonial',
};

type AttributeCandidate = {
  value: string;
  normalizedValue: string;
  factIds: string[];
  documentTitres: string[];
};

type AttributeGroup = {
  code: string;
  label: string;
  candidates: AttributeCandidate[];
};

// Regroupe les faits par attribut d'identité, puis par valeur normalisée —
// un attribut avec plusieurs candidats est un conflit entre actes (ex. deux
// dates de naissance différentes) à trancher manuellement ; un seul
// candidat est simplement à confirmer (synthèse, même sans désaccord).
function analyzeAttributes(facts: EntityFact[]): AttributeGroup[] {
  const byCode = new Map<string, Map<string, AttributeCandidate>>();

  for (const f of facts) {
    const label = ATTRIBUTE_PREDICATES[f.predicateCode];
    if (!label) continue;
    const raw = f.valueDate ?? f.valueText ?? (f.valueNumber != null ? String(f.valueNumber) : null);
    const value = raw?.trim();
    if (!value) continue;

    const normalized = value.toLowerCase();
    const byValue = byCode.get(f.predicateCode) ?? new Map<string, AttributeCandidate>();
    const existing = byValue.get(normalized);
    if (existing) {
      existing.factIds.push(f.id);
      if (!existing.documentTitres.includes(f.documentTitre)) existing.documentTitres.push(f.documentTitre);
    } else {
      byValue.set(normalized, { value, normalizedValue: normalized, factIds: [f.id], documentTitres: [f.documentTitre] });
    }
    byCode.set(f.predicateCode, byValue);
  }

  return [...byCode.entries()]
    .map(([code, byValue]) => ({ code, label: ATTRIBUTE_PREDICATES[code], candidates: [...byValue.values()] }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Interprète la valeur brute d'un attribut "sex" validé (texte libre issu de
// l'extraction : "masculin", "F", "femme"...) en code M/F pour l'icône et
// les accords du header — retourne null si non reconnaissable plutôt que de
// deviner.
function inferSexeCode(raw: string): 'M' | 'F' | null {
  const v = raw.trim().toLowerCase();
  if (v === 'f' || v === 'm') return v.toUpperCase() as 'M' | 'F';
  if (v.includes('fémin') || v.includes('femin') || v === 'femme') return 'F';
  if (v.includes('mascul') || v === 'homme') return 'M';
  return null;
}

// --- Onglet "Informations à valider" > "Par acte" ---
//
// Champs "acteur" pouvant être sourcés sur un fait précis d'un acte donné —
// reprend la structure de l'ancienne table acteurs (acteurFieldGroups dans
// types/analyse.ts), MAIS sans les champs "_ref" (sélecteurs de dictionnaire
// de l'ancien modèle : id vers une table de référence, pas une valeur
// textuelle en soi) ni les "_mention_toponyme" (spans bruts d'un outil de
// liaison toponymique distinct). Demande explicite de l'utilisateur : "tous
// les champs de l'ancienne table acteurs" — interprété comme "tous les
// champs qui portent une valeur exploitable", pas les artefacts de
// sélection d'UI qui n'ont aucun sens comme "valeur + fait source".
type ActeurField = { key: string; label: string };
type ActeurFieldGroup = { label: string; fields: ActeurField[] };

const ACTEUR_FIELD_GROUPS: ActeurFieldGroup[] = [
  { label: 'Identité', fields: [
    { key: 'role', label: 'Rôle dans l’acte' },
    { key: 'qualite', label: 'Qualité' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'sexe', label: 'Sexe' },
  ] },
  { label: 'Âge & vie', fields: [
    { key: 'age', label: 'Âge' },
    { key: 'est_vivant', label: 'Vivant(e)' },
  ] },
  { label: 'Profession & statut', fields: [
    { key: 'profession_brut', label: 'Profession' },
    { key: 'statut_brut', label: 'Statut' },
    { key: 'fonction', label: 'Fonction' },
    { key: 'titre_honneur', label: 'Titre d’honneur' },
  ] },
  { label: 'Filiation', fields: [
    { key: 'filiation', label: 'Filiation' },
    { key: 'pere_est_cite', label: 'Père cité' },
    { key: 'mere_est_citee', label: 'Mère citée' },
  ] },
  { label: 'Domicile & origine', fields: [
    { key: 'domicile', label: 'Domicile' },
    { key: 'residence_brut', label: 'Résidence' },
    { key: 'origine', label: 'Origine' },
  ] },
  { label: 'Naissance', fields: [
    { key: 'naissance_date', label: 'Date de naissance' },
    { key: 'naissance_heure', label: 'Heure de naissance' },
    { key: 'naissance_lieux', label: 'Lieu de naissance' },
  ] },
  { label: 'Décès', fields: [
    { key: 'deces_date', label: 'Date de décès' },
    { key: 'deces_heure', label: 'Heure de décès' },
    { key: 'deces_lieux', label: 'Lieu de décès' },
  ] },
  { label: 'Lien avec l’acte', fields: [
    { key: 'lien', label: 'Lien' },
  ] },
  { label: 'Déclarations', fields: [
    { key: 'est_declarant', label: 'Déclarant(e)' },
    { key: 'est_present', label: 'Présent(e)' },
    { key: 'est_consentant', label: 'Consentant(e)' },
    { key: 'a_assiste_naissance', label: 'A assisté à la naissance' },
    { key: 'a_assiste_deces', label: 'A assisté au décès' },
  ] },
  { label: 'Signature', fields: [
    { key: 'a_signe', label: 'A signé' },
    { key: 'signature', label: 'Signature' },
    { key: 'signature_libelle', label: 'Libellé de la signature' },
  ] },
  { label: 'Note', fields: [
    { key: 'note', label: 'Note' },
  ] },
];

// Prédicat de fait/relation -> champ acteur qu'il peut sourcer directement
// (clic = pré-remplit + lie). Un prédicat absent de cette table reste
// visible dans le panneau des faits pour contexte, mais n'est pas cliquable
// — pas de champ où le ranger automatiquement.
// Construite d'après la liste RÉELLE de rebond.ref_assertion_predicates
// (81 codes actifs, vérifiés en base le 2026-08-14 — bien plus large que
// les ~20 supposés lors de la première version, d'où le bug "Dame" non
// reconnu : le prédicat est "title" (Titre de civilité), pas "function").
// "quality" (Qualité / statut, distinct de la profession — ex. "fille
// légitime", "propriétaire") reste volontairement NON mappé : sa valeur est
// trop variable selon le contexte de l'acte pour un champ unique fiable ;
// il reste visible dans "Faits non repris" plutôt que mal aiguillé.
const PREDICATE_TO_FIELD: Record<string, string> = {
  name: 'nom',
  sex: 'sexe',
  age: 'age',
  occupation: 'profession_brut',
  domicile: 'domicile',
  residence: 'residence_brut',
  marital_status: 'statut_brut',
  title: 'qualite',
  function: 'qualite',
  birth_date: 'naissance_date',
  birth_place: 'naissance_lieux',
  birth_time: 'naissance_heure',
  death_date: 'deces_date',
  death_place: 'deces_lieux',
  death_time: 'deces_heure',
  witness: 'role',
  comparant: 'role',
  declarant: 'role',
  officer_role: 'role',
  present: 'est_present',
  signs: 'a_signe',
  cannot_sign: 'a_signe',
  consent: 'est_consentant',
};

// Champs à vocabulaire contrôlé (2026-08-15, demande explicite) — ces
// tables `ref_*` existent déjà, peuplées de données réelles de l'ancien
// modèle (schéma `public`, jamais migrées vers `rebond` — d'où l'usage du
// client par défaut via resolveRefTableClient, pas supabaseRebond) :
// ref_qualite (5 : monsieur/dame/sieur/demoiselle/mademoiselle),
// ref_profession (54), ref_situation_matrimoniale (9),
// ref_filiation (8). Pas de "fonction" ici : aucune table équivalente pour
// une fonction PERSONNELLE n'existe (ref_etat_civil_registre_fonction
// concerne le REGISTRE, pas la personne) — reste en texte libre.
const FIELD_REF_TABLE: Record<string, string> = {
  qualite: 'ref_qualite',
  profession_brut: 'ref_profession',
  statut_brut: 'ref_situation_matrimoniale',
  filiation: 'ref_filiation',
};

// "sexe" : pas de table ref_* dédiée dans l'ancien modèle (contrairement
// aux 4 ci-dessus) — un vocabulaire à 2-3 valeurs fixes ne justifie pas un
// tiroir de recherche, juste ces boutons inline (2026-08-15, décision
// explicite après discussion : "je ne ferais pas un ref_* complet ici").
const SEXE_OPTIONS = [
  { value: 'masculin', label: 'Masculin' },
  { value: 'féminin', label: 'Féminin' },
  { value: 'indéterminé', label: 'Indéterminé' },
];

// Champs booléens (présence/absence/non-observé) rendus avec TriStateButton
// (@/components/shared/TriStateButton, déjà utilisé ailleurs dans l'app)
// plutôt qu'un champ texte — même esprit que "sexe" : le vocabulaire est
// fixe (oui/non/inconnu), pas la peine d'un champ libre.
const TRISTATE_FIELDS = new Set(['est_vivant', 'pere_est_cite', 'mere_est_citee']);

function parseTriState(text: string | undefined): TriState {
  if (!text) return null;
  const v = text.trim().toLowerCase();
  if (v === 'oui' || v === 'true') return true;
  if (v === 'non' || v === 'false') return false;
  return null;
}

// La valeur métier stockée (rebond.entity_attributes.value) est le LIBELLÉ
// texte, pas l'id de la ligne ref_* choisie (cohérent avec tous les autres
// champs, qui sont déjà du texte libre) — ce composant se contente donc de
// résoudre l'id choisi en libellé avant de le remonter. Comme il n'existe
// pas de colonne pour retrouver l'id déjà choisi à partir du texte
// sauvegardé, le chip affiché est un texte "posé" via placeholderEmpty
// plutôt qu'une vraie sélection résolue — limite acceptée pour cette
// première version (le texte actuel reste visible, juste pas présélectionné
// si on rouvre le tiroir).
function RefFieldPicker({ table, currentValue, onPick }: { table: string; currentValue: string; onPick: (label: string) => void }) {
  return (
    <RefSinglePickerSmart
      table={table}
      mode='edit'
      multi={false}
      value={null}
      placeholderEmpty={currentValue || 'Non renseigné'}
      onChange={async (id) => {
        if (!id) { onPick(''); return; }
        const { data } = await resolveRefTableClient(table).from(table).select('label').eq('id', id).maybeSingle();
        onPick((data as any)?.label ?? '');
      }}
    />
  );
}

type ActeItem = {
  id: string;
  label: string;
  sourceText: string;
  fieldKey: string | null;
  fieldValue: string;
};

// Faits + relations d'un acte précis, ramenés à une forme commune pour le
// panneau de gauche du formulaire "Par acte".
function buildActeItems(detail: EntityDetail | null, versionId: string): ActeItem[] {
  if (!detail) return [];
  const items: ActeItem[] = [];
  for (const f of detail.facts) {
    if (f.versionId !== versionId) continue;
    const value = f.valueText ?? f.valueDate ?? (f.valueNumber != null ? String(f.valueNumber) : '');
    items.push({ id: f.id, label: f.label, sourceText: f.sourceText, fieldKey: PREDICATE_TO_FIELD[f.predicateCode] ?? null, fieldValue: value ?? '' });
  }
  for (const r of detail.relations) {
    if (r.versionId !== versionId) continue;
    items.push({ id: r.id, label: `${r.predicateLabel} : ${r.targetLabel}`, sourceText: '', fieldKey: 'role', fieldValue: r.ownRoleLabel });
  }
  return items;
}

// Ligne de vie : une ligne par acte, remplie UNIQUEMENT à partir des champs
// déjà validés/sourcés ("Informations à valider" > "Par acte") — plus de
// déduction automatique non tracée (la version précédente devinait la
// correspondance prédicat->colonne sans validation, rejetée explicitement
// par l'utilisateur : "ça ne va pas").
function buildValidatedActeRows(detail: EntityDetail | null, attrs: EntityAttribute[]): any[] {
  if (!detail) return [];
  const byVersion = new Map<string, any>();
  for (const doc of detail.documents) {
    byVersion.set(doc.versionId, {
      id: doc.versionId,
      acte_id: doc.versionId,
      exemplaire_id: doc.exemplaireId,
      version_id: doc.versionId,
      acte_label: doc.titre,
      acte_date: doc.date,
    });
  }
  for (const a of attrs) {
    if (!a.versionId) continue;
    const row = byVersion.get(a.versionId);
    if (row) row[a.attributeCode] = a.value;
  }
  return [...byVersion.values()];
}

// Affiche une date validée en français si elle est au format ISO
// (rebond.entity_attributes.value garde le texte brut de l'attribut, qui
// peut être une date ISO comme un texte libre selon ce que l'extraction a
// trouvé) — sinon affiche la valeur telle quelle.
function formatAttributeValue(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDateToFrench(value) : value;
}

export default function IndividuLayout() {
  const { individuId } = useParams();

  const individus = useIndividuStore((s) => s.individus);
  const fetchIndividus = useIndividuStore((s) => s.fetchIndividus);
  const { fetchIndividuById } = useIndividuStore();

  const [openedTabs, setOpenedTabs] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | undefined>(individuId);
  const [activeSection, setActiveSection] = useState<string>(tabs[0].label);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchIndividus();
  }, [fetchIndividus]);

  useEffect(() => {
    if (!individuId) return;

    const found = individus.find((i) => i.id === individuId);
    if (found) {
      setOpenedTabs([found]);
      setActiveTabId(found.id);
      return;
    }

    // Repli : l'id vient du registre canonique du nouveau rebond
    // (rebond.entities), pas de l'ancien modèle (rebond_individus) — ce
    // composant est rapatrié depuis rebond_deprecated mais pas encore
    // reconnecté aux vraies données de cet ancien modèle (demande
    // explicite : le brancher même non câblé). On affiche au moins le nom
    // canonique pour que l'écran ne soit pas vide ; tous les onglets basés
    // sur les RPC de l'ancien modèle resteront vides tant que ce module
    // n'est pas reconnecté à une source de données réelle.
    let cancelled = false;
    supabaseRebond
      .from('entities')
      .select('id, label')
      .eq('id', individuId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const [prenom, ...reste] = data.label.split(' ');
        setOpenedTabs([
          {
            id: data.id,
            prenom: prenom ?? data.label,
            nom: reste.join(' ') || null,
            sexe: null,
            naissance_date: null,
            naissance_lieu: null,
            deces_naissance: null,
            deces_lieu: null,
          },
        ]);
        setActiveTabId(data.id);
      });
    return () => {
      cancelled = true;
    };
  }, [individuId, individus]);

  // Onglet "Relations & faits" : sourcé directement depuis le registre
  // canonique (rebond.entities), pas depuis l'ancien modèle — même service
  // que la fiche Entités (`fetchEntityDetail`), pour ne pas dupliquer le
  // calcul des relations/faits/actes à deux endroits.
  const [entityDetail, setEntityDetail] = useState<EntityDetail | null>(null);
  const [entityDetailLoading, setEntityDetailLoading] = useState(false);

  useEffect(() => {
    if (!individuId) return;
    let cancelled = false;
    setEntityDetailLoading(true);
    fetchEntityDetail(individuId)
      .then((data) => {
        if (!cancelled) setEntityDetail(data);
      })
      .catch((err) => {
        console.error('[IndividuFiche] Erreur fetchEntityDetail', err);
        if (!cancelled) setEntityDetail(null);
      })
      .finally(() => {
        if (!cancelled) setEntityDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [individuId]);

  // Onglet "Informations à valider" : analyse des faits (entityDetail.facts)
  // groupés par attribut d'identité, comparés aux choix déjà validés
  // manuellement (rebond.entity_attributes).
  const [validatedAttributes, setValidatedAttributes] = useState<EntityAttribute[]>([]);
  const [savingAttribute, setSavingAttribute] = useState<string | null>(null);

  useEffect(() => {
    if (!individuId) return;
    let cancelled = false;
    fetchEntityAttributes(individuId)
      .then((data) => {
        if (!cancelled) setValidatedAttributes(data);
      })
      .catch((err) => console.error('[IndividuFiche] Erreur fetchEntityAttributes', err));
    return () => {
      cancelled = true;
    };
  }, [individuId]);

  const attributeGroups = analyzeAttributes(entityDetail?.facts ?? []);
  const enrichisRows = buildValidatedActeRows(entityDetail, validatedAttributes);

  async function handleValidateAttribute(code: string, candidate: AttributeCandidate) {
    if (!individuId) return;
    setSavingAttribute(code);
    try {
      await upsertEntityAttribute(individuId, code, candidate.value, candidate.factIds);
      const refreshed = await fetchEntityAttributes(individuId);
      setValidatedAttributes(refreshed);
      toast.success('Information validée');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de la validation');
    } finally {
      setSavingAttribute(null);
    }
  }

  // Sous-onglet "Par acte" : liste des actes -> fiche acteur. La fiche
  // s'auto-suggère (un champ dont un seul fait de l'acte porte le
  // prédicat correspondant se pré-remplit tout seul, sourcé, à confirmer
  // d'un clic) plutôt que d'obliger à cliquer chaque fait un par un dans
  // un panneau séparé (rejeté explicitement : "l'écran n'est pas très
  // intuitif"). Rien n'est écrit en base tant que le champ n'est pas
  // confirmé ("Valider ce champ") ou édité à la main (sauvegarde au blur).
  const [infoSubTab, setInfoSubTab] = useState<'synthese' | 'parActe'>('synthese');
  const [selectedActeVersionId, setSelectedActeVersionId] = useState<string | null>(null);
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>({});
  const [fieldDraftFactId, setFieldDraftFactId] = useState<Record<string, string | null>>({});
  const [perActeSaving, setPerActeSaving] = useState<string | null>(null);
  // Lien manuel (2026-08-15, demande explicite : "comment je peux lier un
  // fait à un champ") — jusqu'ici seul PREDICATE_TO_FIELD pouvait proposer
  // un candidat ; un fait sans correspondance mappée (ou mal mappée) n'avait
  // aucun moyen d'être lié à un champ. Ce sélecteur permet de choisir
  // N'IMPORTE QUEL fait/relation de l'acte pour N'IMPORTE QUEL champ.
  const [linkPickerField, setLinkPickerField] = useState<string | null>(null);

  const acteItems = selectedActeVersionId ? buildActeItems(entityDetail, selectedActeVersionId) : [];
  const itemsByField = new Map<string, ActeItem[]>();
  const unmappedItems: ActeItem[] = [];
  for (const item of acteItems) {
    if (!item.fieldKey) { unmappedItems.push(item); continue; }
    const arr = itemsByField.get(item.fieldKey) ?? [];
    arr.push(item);
    itemsByField.set(item.fieldKey, arr);
  }

  useEffect(() => {
    if (!selectedActeVersionId) {
      setFieldDrafts({});
      setFieldDraftFactId({});
      return;
    }
    const drafts: Record<string, string> = {};
    const draftFactIds: Record<string, string | null> = {};
    for (const group of ACTEUR_FIELD_GROUPS) {
      for (const field of group.fields) {
        const existing = validatedAttributes.find((a) => a.attributeCode === field.key && a.versionId === selectedActeVersionId);
        if (existing) {
          drafts[field.key] = existing.value;
          draftFactIds[field.key] = existing.sourceFactIds[0] ?? null;
          continue;
        }
        const candidates = itemsByField.get(field.key) ?? [];
        if (candidates.length === 1) {
          drafts[field.key] = candidates[0].fieldValue;
          draftFactIds[field.key] = candidates[0].id;
        }
      }
    }
    setFieldDrafts(drafts);
    setFieldDraftFactId(draftFactIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActeVersionId, entityDetail, validatedAttributes]);

  function handleCandidatePick(fieldKey: string, item: ActeItem) {
    setFieldDrafts((prev) => ({ ...prev, [fieldKey]: item.fieldValue }));
    setFieldDraftFactId((prev) => ({ ...prev, [fieldKey]: item.id }));
  }

  async function handleConfirmField(fieldKey: string) {
    if (!individuId || !selectedActeVersionId) return;
    const value = fieldDrafts[fieldKey]?.trim();
    if (!value) return;
    const factId = fieldDraftFactId[fieldKey];
    setPerActeSaving(fieldKey);
    try {
      await upsertEntityAttribute(individuId, fieldKey, value, factId ? [factId] : [], selectedActeVersionId);
      const refreshed = await fetchEntityAttributes(individuId);
      setValidatedAttributes(refreshed);
      toast.success('Champ validé');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de l’enregistrement');
    } finally {
      setPerActeSaving(null);
    }
  }

  async function handleFieldBlur(fieldKey: string) {
    if (!individuId || !selectedActeVersionId) return;
    const value = fieldDrafts[fieldKey]?.trim();
    const existing = validatedAttributes.find((a) => a.attributeCode === fieldKey && a.versionId === selectedActeVersionId);
    if (!value || existing?.value === value) return;
    setPerActeSaving(fieldKey);
    try {
      await upsertEntityAttribute(individuId, fieldKey, value, existing?.sourceFactIds ?? [], selectedActeVersionId);
      const refreshed = await fetchEntityAttributes(individuId);
      setValidatedAttributes(refreshed);
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de l’enregistrement');
    } finally {
      setPerActeSaving(null);
    }
  }

  // Choix depuis un référentiel (ref_qualite/ref_profession/...) — sauvegarde
  // immédiate (contrairement à la saisie libre, pas besoin d'attendre un
  // blur : le choix dans le tiroir est déjà un geste déliberé). Conserve la
  // source déjà liée si le champ était sourcé — un choix dans le
  // référentiel est une normalisation du texte, pas un reniement du fait.
  async function handleRefPick(fieldKey: string, label: string) {
    setFieldDrafts((prev) => ({ ...prev, [fieldKey]: label }));
    if (!individuId || !selectedActeVersionId || !label) return;
    const existing = validatedAttributes.find((a) => a.attributeCode === fieldKey && a.versionId === selectedActeVersionId);
    setPerActeSaving(fieldKey);
    try {
      await upsertEntityAttribute(individuId, fieldKey, label, existing?.sourceFactIds ?? [], selectedActeVersionId);
      const refreshed = await fetchEntityAttributes(individuId);
      setValidatedAttributes(refreshed);
      toast.success('Champ mis à jour');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erreur lors de l’enregistrement');
    } finally {
      setPerActeSaving(null);
    }
  }

  const closeTab = (id: string) => {
    setOpenedTabs((prev) => {
      const updated = prev.filter((tab) => tab?.id !== id);
      if (activeTabId === id && updated.length > 0) {
        setActiveTabId(updated[0].id); // active le premier onglet restant
      }
      return updated;
    });
  };

  const openIndividu = (id: string) => {
    const existing = openedTabs.find((t) => t?.id === id);
    if (existing) {
      setActiveTabId(id);
    } else {
      const found = individus.find((t) => t.id === id);
      if (found) {
        setOpenedTabs((prev) => [...prev, found]);
        setActiveTabId(found.id);
      }
    }
  };

  const activeIndividu = openedTabs.find((t) => t?.id === activeTabId);

  const [acteursByIndividu, setActeursByIndividu] = useState<any[] | null>(null);

  const { prenoms, noms } = getTopNomsPrenoms(acteursByIndividu || []);
  const professionsChrono = getChronoProfessions(acteursByIndividu || []);

  const naissance = getNaissance(acteursByIndividu || []);
  const deces = getDeces(acteursByIndividu || []);

  const [parents, setParents] = useState<
    { parent_role: string; parent_acteur_id: string; parent_individu_id: string | null }[]
  >([]);
  const [parentsDetails, setParentsDetails] = useState<any[]>([]);

  const [siblings, setSiblings] = useState<
    {
      sibling_individu_id: string;
      nom: string | null;
      prenom: string | null;
      sexe: 'M' | 'F' | null;
      type_lien: string;
      via_pere: boolean;
      via_mere: boolean;
    }[]
  >([]);

  const [enfants, setEnfants] = useState<any[] | null>(null);

  const [unions, setUnions] = useState<any[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadIndividuData = async (id: string) => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchIndividuById(id),
        fetchActeursByIndividu(id),
        fetchParents(id),
        fetchChildren(id),
        fetchUnions(id),
        fetchSiblings(id),
      ]);
    } catch (e) {
      console.error('Erreur chargement données individu', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeIndividu?.id) {
      loadIndividuData(activeIndividu.id);
    }
  }, [activeIndividu?.id]);

  useEffect(() => {
    const parentIds = parents.map((p) => p.parent_acteur_id);
    if (parentIds.length === 0) return;

    supabase
      .from('v_acteurs_enrichis')
      .select('id, nom, prenom')
      .in('id', parentIds)
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur récupération détails parents:', error);
        } else {
          setParentsDetails(data ?? []);
        }
      });
  }, [parents]);

  const fetchActeursByIndividu = async (id: string) => {
    const { data } = await supabase.from('v_acteurs_enrichis').select('*').eq('individu_id', id);

    setActeursByIndividu(data ?? []);
  };

  const fetchParents = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_parents_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
      console.error('Erreur fetchParents:', error);
    } else {
      setParents(data ?? []);
    }
  };

  const fetchChildren = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_enfants_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
    } else {
      setEnfants(data ?? []);
    }
  };

  const fetchUnions = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_unions_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
      console.error('Erreur fetchUnions:', error);
    } else {
      setUnions(data ?? []);
    }
  };

  useEffect(() => {
    if (!enfants) return;

    const enrichirEnfants = async () => {
      const enfantsEnrichis = await Promise.all(
        enfants.map(async (enfant) => {
          if (!enfant.enfant_individu_id) return enfant;

          const { data } = await supabase
            .from('v_acteurs_enrichis')
            .select('*')
            .eq('individu_id', enfant.enfant_individu_id);

          const enrichis = data ?? [];
          return {
            ...enfant,
            enrichis,
            naissance: getNaissance(enrichis),
            deces: getDeces(enrichis),
            professions: getChronoProfessions(enrichis),
          };
        }),
      );

      setEnfants(enfantsEnrichis);
    };

    enrichirEnfants();
  }, [enfants?.length]);

  const fetchSiblings = async (individuId: string) => {
    const { data, error } = await supabase.rpc('get_siblings_for_individu', {
      p_individu_id: individuId,
    });

    if (error) {
      console.error('Erreur fetchSiblings:', error);
    } else {
      setSiblings(data ?? []);
    }
  };

  const { regroupements: unionsAvecEnfants, enfantsHorsUnion } =
    unions && enfants
      ? grouperEnfantsParUnion(unions, enfants)
      : { regroupements: [], enfantsHorsUnion: [] };

  const parentsPersonnes = {
    pere: (() => {
      const parent = parents.find((p) => p.parent_role === 'père');
      const detail = parent ? parentsDetails.find((d) => d.id === parent.parent_acteur_id) : null;

      if (parent?.parent_individu_id) {
        return individus.find((i) => i.id === parent.parent_individu_id) ?? detail;
      }

      return detail ?? null;
    })(),

    mere: (() => {
      const parent = parents.find((p) => p.parent_role === 'mère');
      const detail = parent ? parentsDetails.find((d) => d.id === parent.parent_acteur_id) : null;

      if (parent?.parent_individu_id) {
        return individus.find((i) => i.id === parent.parent_individu_id) ?? detail;
      }

      return detail ?? null;
    })(),
  };

  // Header : priorité aux informations validées manuellement (onglet
  // "Informations à valider", rebond.entity_attributes) sur les données de
  // l'ancien modèle — pour une entité du nouveau registre canonique, seules
  // les informations validées existent. "date indéterminée"/valeur absente
  // ne s'affichent plus (avant, le header montrait toujours ces placeholders
  // même sans aucune donnée).
  const validatedSex = validatedAttributes.find((a) => a.attributeCode === 'sex' && a.versionId === null);
  const sexeCode: 'M' | 'F' | null =
    (validatedSex ? inferSexeCode(validatedSex.value) : null) ??
    (activeIndividu?.sexe === 'M' || activeIndividu?.sexe === 'F' ? activeIndividu.sexe : null);

  const validatedBirthDate = validatedAttributes.find((a) => a.attributeCode === 'birth_date' && a.versionId === null);
  const naissanceDisplay = validatedBirthDate
    ? formatAttributeValue(validatedBirthDate.value)
    : naissance.date && naissance.date !== 'date indéterminée'
      ? naissance.date
      : null;

  const validatedDeathDate = validatedAttributes.find((a) => a.attributeCode === 'death_date' && a.versionId === null);
  const decesDisplay = validatedDeathDate
    ? formatAttributeValue(validatedDeathDate.value)
    : deces.date && deces.date !== 'date indéterminée'
      ? deces.date
      : null;

  return (
    <>
      {isLoading && (
        <div className='flex items-center justify-center h-[60vh]'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        </div>
      )}
      {!isLoading && activeIndividu ? (
        <div className='flex max-h-auto flex-col'>
          <div className='sticky top-0 z-10 bg-white'>
            {openedTabs.length > 1 && (
              <div className='flex items-center space-x-1 bg-gray-100 px-4 py-2 border-b overflow-x-auto'>
                {openedTabs.map((tab) => (
                  <div
                    key={tab?.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-t text-sm cursor-pointer transition ${
                      activeTabId === tab?.id
                        ? 'bg-white border border-b-0 border-gray-300 font-medium'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    onClick={() => setActiveTabId(tab?.id)}
                  >
                    {`${tab?.prenom} ${tab?.nom}`}
                    <X
                      className='w-4 h-4 ml-1 hover:text-red-500'
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab?.id);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className='flex items-center justify-between px-6 py-3 border-b bg-white'>
              {/* Gauche : infos de l'individu */}
              <div className='flex items-center gap-3'>
                {openedTabs.length == 1 && (
                  <Link to={`/entites`}>
                    <ArrowLeft className='w-4 h-4 text-gray-600 cursor-pointer'>
                      <title>Retour</title>
                    </ArrowLeft>
                  </Link>
                )}

                {sexeCode === 'M' && (
                  <Mars className='w-4 h-4 text-blue-500'>
                    <title>Homme</title>
                  </Mars>
                )}
                {sexeCode === 'F' && (
                  <Venus className='w-4 h-4 text-pink-500'>
                    <title>Femme</title>
                  </Venus>
                )}
                {!sexeCode && (
                  <Circle className='w-4 h-4 text-gray-400'>
                    <title>Genre non précisé</title>
                  </Circle>
                )}

                <span className='text-base font-semibold text-gray-800'>
                  {displayNom(activeIndividu.prenom, activeIndividu.nom)}
                </span>

                <span className='text-sm text-gray-500'>
                  {[
                    naissanceDisplay && (sexeCode === 'F' ? 'née ' : 'né ') + naissanceDisplay,
                    decesDisplay && (sexeCode === 'F' ? 'décédée ' : 'décédé ') + decesDisplay,
                  ]
                    .filter(Boolean)
                    .join(' - ')}

                  {unions && unions.length > 0 && (
                    <>
                      {' • ' + (sexeCode === 'F' ? 'épouse' : 'époux') + ' de : '}
                      {unions
                        .filter((union) => union.type_union === 'mariage civil')
                        .map((union, index) => {
                          const person = individus.find((i) => i.id === union.conjoint_individu_id);
                          return person ? (
                            <button
                              key={union.conjoint_individu_id}
                              className='text-indigo-800 underline ml-1 hover:text-indigo-600'
                              onClick={() => openIndividu(union.conjoint_individu_id)}
                            >
                              {person.prenom} {person.nom}
                              {index < unions.length - 1 ? ', ' : ''}
                            </button>
                          ) : (
                            <span key={union.conjoint_individu_id}>
                              {union.conjoint_prenom} {union.conjoint_nom}
                              {index < unions.length - 1 ? ', ' : ''}
                            </span>
                          );
                        })}
                    </>
                  )}
                </span>
              </div>

              {/* Droite : actions */}
              <div className='flex items-center gap-4'>
                <button className='flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
                  <PlusCircle className='w-4 h-4' />
                  Ajouter une source
                </button>
                {activeTabId != individuId && (
                  <Link to={`/individu/${activeTabId}`}>
                    <Button variant='ghost' className='text-sm'>
                      <Navigation className='w-4 h-4 opacity-70 text-indigo-600' />
                    </Button>
                  </Link>
                )}
                <Mail className='w-5 h-5 text-gray-700 cursor-pointer' />
                <Settings className='w-5 h-5 text-gray-700 cursor-pointer' />
              </div>
            </div>

            <div className='flex items-center gap-8 px-6 text-sm border-b bg-white'>
              {tabs.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveSection(label)}
                  className={`py-3 -mb-px border-b-2 flex items-center gap-2 transition-all ${
                    activeSection === label
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span className='flex items-center gap-1'>
                    {label}
                    {label === 'Sources' && acteursByIndividu && (
                      <span className='inline-flex items-center justify-center px-1.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'>
                        {acteursByIndividu.length}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className='flex flex-1 overflow-hidden'>
            <section className='flex-1 overflow-y-auto p-6  mb-4 prose prose-sm'>
              <h2 className='text-lg font-semibold mb-4'>{activeSection}</h2>
              {activeSection === 'Ligne de vie' ? (
                <div className='space-y-4'>
                  <IndividuLigneDeVieTable enrichis={enrichisRows} pageSize={-1} />
                </div>
              ) : activeSection === 'Synthèse' ? (
                <>
                  <div className='space-y-4'>
                    <div className='bg-gray-50 border-l-4 border-gray-400 p-4 rounded-md shadow-sm'>
                      <h2 className='text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2'>
                        <InfoIcon className='w-5 h-5 text-gray-500' /> Informations synthétiques
                      </h2>
                      <dl className='grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm'>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Prénoms</dt>
                          <dd className='mt-1 text-gray-800'>{prenoms}</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Noms</dt>
                          <dd className='mt-1 text-gray-800'>{noms}</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Naissance</dt>
                          <dd className='mt-1 text-gray-800'>
                            {' '}
                            {naissance.date} à {naissance.lieu}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Décès</dt>
                          <dd className='mt-1 text-gray-800'>
                            {' '}
                            {deces.date} à {deces.lieu}
                          </dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Professions</dt>
                          <dd className='mt-1 text-gray-800'>{professionsChrono}</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>🚧 Statuts</dt>
                          <dd className='mt-1 text-gray-800'>Fille d'engagée, épouse</dd>
                        </div>
                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>Parents</dt>
                          <dd className='mt-1 text-gray-800 flex flex-wrap gap-2'>
                            {['père', 'mère'].map((role) => {
                              const parent = parents.find((p) => p.parent_role === role);
                              const detail = parent
                                ? parentsDetails.find((d) => d.id === parent.parent_acteur_id)
                                : null;
                              const person = parentsPersonnes[role === 'père' ? 'pere' : 'mere'];

                              if (person && parent?.parent_individu_id) {
                                return (
                                  <span key={parent.parent_individu_id}>
                                    <button
                                      className='text-indigo-800 underline hover:text-indigo-600'
                                      onClick={() => openIndividu(parent.parent_individu_id!)}
                                    >
                                      {person.prenom} {person.nom}
                                    </button>{' '}
                                    ({role})
                                  </span>
                                );
                              } else if (detail) {
                                return (
                                  <span key={detail.id}>
                                    {[detail.prenom, detail.nom].filter(Boolean).join(' ')} ({role})
                                  </span>
                                );
                              } else {
                                return (
                                  <span key={role}>
                                    {role} inconnu{role === 'mère' ? 'e' : ''}
                                  </span>
                                );
                              }
                            })}
                          </dd>
                        </div>

                        <div>
                          <dt className='text-sm font-semibold text-gray-900'>🚧 Fratrie</dt>
                          <dd className='mt-1 text-gray-800'>
                            {siblings.filter((s) => s.sexe === 'M').length} frère
                            {siblings.filter((s) => s.sexe === 'M').length > 1 ? 's' : ''} et{' '}
                            {siblings.filter((s) => s.sexe === 'F').length} sœur
                            {siblings.filter((s) => s.sexe === 'F').length > 1 ? 's' : ''} connu
                            {siblings.length > 1 ? 's' : ''}
                          </dd>
                        </div>
                        {unions && unions.length > 0 && (
                          <div>
                            <dt className='text-sm font-semibold text-gray-900'>
                              Union{unions.length > 1 ? 's' : ''}
                            </dt>
                            <dd className='mt-1 text-gray-800'>
                              {unions.length} union{unions.length > 1 ? 's' : ''} connue
                              {unions.length > 1 ? 's' : ''}
                            </dd>
                          </div>
                        )}
                        {enfants && enfants.length > 0 && (
                          <div>
                            <dt className='text-sm font-semibold text-gray-900'>
                              Enfant{enfants.length > 1 ? 's' : ''}
                            </dt>
                            <dd className='mt-1 text-gray-800'>
                              {enfants.length} enfant{enfants.length > 1 ? 's' : ''} connu
                              {enfants.length > 1 ? 's' : ''}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <h1>Contenu suggéré :</h1>

                    <ul>
                      <IndividuBiographie />

                      <li>Statut (source complète, incertitude, hypothèses)</li>
                      <li>Dates clés : naissance, mariage, décès</li>
                      <li>Profils liés (parents, conjoints, enfants)</li>
                      <li>Résumé visuel : chronologie simplifiée, carte rapide, graphe</li>
                    </ul>
                    <p>
                      <strong>But : </strong>offrir une vue d’ensemble immédiate – idéale pour un
                      premier regard.
                    </p>
                  </div>
                </>
              ) : activeSection === 'Relations & faits' ? (
                <div className='space-y-4 not-prose'>
                  {entityDetailLoading && !entityDetail ? (
                    <p className='text-xs text-gray-400 italic flex items-center gap-1.5'>
                      <Loader2 className='w-3.5 h-3.5 animate-spin' />Chargement…
                    </p>
                  ) : (
                    <>
                      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                        <h2 className='text-sm font-semibold text-gray-800 mb-3'>Relations directes</h2>
                        {!entityDetail || entityDetail.relations.length === 0 ? (
                          <p className='text-xs text-gray-400 italic'>Aucune relation connue pour l’instant.</p>
                        ) : (
                          <div className='flex flex-col gap-1.5'>
                            {entityDetail.relations.map((r, i) =>
                              r.targetEntityId ? (
                                <Link
                                  key={i}
                                  to={`/individu/${r.targetEntityId}`}
                                  className='flex items-center justify-between text-sm text-gray-700 hover:text-indigo-700 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors'
                                >
                                  <span><span className='text-gray-400'>{r.predicateLabel} :</span> {r.targetLabel}</span>
                                  <Navigation className='w-3.5 h-3.5 text-gray-300' />
                                </Link>
                              ) : (
                                <div key={i} className='text-sm text-gray-700 py-1.5 px-2'>
                                  <span className='text-gray-400'>{r.predicateLabel} :</span> {r.targetLabel}
                                  <span className='text-[11px] text-gray-300 ml-1.5'>(pas encore une fiche)</span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                        <h2 className='text-sm font-semibold text-gray-800 mb-3'>
                          Faits ({entityDetail?.facts.length ?? 0})
                        </h2>
                        {!entityDetail || entityDetail.facts.length === 0 ? (
                          <p className='text-xs text-gray-400 italic'>Aucun fait validé pour l’instant.</p>
                        ) : (
                          <div className='flex flex-col gap-2.5'>
                            {entityDetail.facts.map((f) => (
                              <div key={f.id} className='rounded-lg border border-gray-100 p-3'>
                                <p className='text-sm text-gray-800'>{f.label}</p>
                                {f.sourceText && (
                                  <p className='text-xs text-gray-400 italic mt-1'>« {f.sourceText} »</p>
                                )}
                                <p className='text-[11px] text-gray-400 mt-1.5 flex items-center gap-1'>
                                  <FileText className='w-3 h-3' />{f.documentTitre}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                        <h2 className='text-sm font-semibold text-gray-800 mb-3'>
                          Mentionné{activeIndividu?.sexe === 'F' ? 'e' : ''} dans {entityDetail?.documents.length ?? 0} acte
                          {(entityDetail?.documents.length ?? 0) > 1 ? 's' : ''}
                        </h2>
                        {!entityDetail || entityDetail.documents.length === 0 ? (
                          <p className='text-xs text-gray-400 italic'>Aucun acte pour l’instant.</p>
                        ) : (
                          <div className='flex flex-col gap-1.5'>
                            {entityDetail.documents.map((d) => (
                              <Link
                                key={d.versionId}
                                to={`/atelier-documentaire/exemplaires/${d.exemplaireId}/versions/${d.versionId}/extraction`}
                                className='flex items-center justify-between text-sm text-gray-700 hover:text-indigo-700 py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors group'
                              >
                                <span className='flex items-center gap-1.5'>
                                  <FileText className='w-3.5 h-3.5 text-gray-300' />{d.titre}
                                </span>
                                <Navigation className='w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors' />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : activeSection === 'Informations à valider' ? (
                <div className='space-y-4 not-prose'>
                  <div className='flex items-center gap-2'>
                    {([
                      ['synthese', 'Synthèse'],
                      ['parActe', 'Par acte'],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setInfoSubTab(key); setSelectedActeVersionId(null); }}
                        className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                          infoSubTab === key ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {infoSubTab === 'synthese' ? (
                    <div className='space-y-4'>
                      <p className='text-xs text-gray-500'>
                        Faits regroupés par type d'information, tous actes confondus. Quand plusieurs actes se
                        contredisent, choisis la valeur à retenir ; sinon, confirme la valeur trouvée.
                      </p>
                      {entityDetailLoading && !entityDetail ? (
                        <p className='text-xs text-gray-400 italic flex items-center gap-1.5'>
                          <Loader2 className='w-3.5 h-3.5 animate-spin' />Chargement…
                        </p>
                      ) : attributeGroups.length === 0 ? (
                        <p className='text-xs text-gray-400 italic'>Aucune information analysable pour l’instant.</p>
                      ) : (
                        attributeGroups.map((group) => {
                          const validated = validatedAttributes.find((a) => a.attributeCode === group.code && a.versionId === null);
                          return (
                            <div key={group.code} className='bg-white rounded-xl border border-gray-200 shadow-sm p-5'>
                              <div className='flex items-center justify-between mb-3'>
                                <h2 className='text-sm font-semibold text-gray-800'>{group.label}</h2>
                                {group.candidates.length > 1 && (
                                  <span className='text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5'>
                                    {group.candidates.length} valeurs concurrentes
                                  </span>
                                )}
                              </div>

                              {validated && (
                                <div className='flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mb-3'>
                                  <CheckCircle2 className='w-3.5 h-3.5 shrink-0' />
                                  Validé : {validated.value}
                                </div>
                              )}

                              <div className='flex flex-col gap-1.5'>
                                {group.candidates.map((c) => {
                                  const isRetenue = validated?.value.trim().toLowerCase() === c.normalizedValue;
                                  return (
                                    <div
                                      key={c.normalizedValue}
                                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                                        isRetenue ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-100'
                                      }`}
                                    >
                                      <div className='min-w-0'>
                                        <p className='text-sm text-gray-800'>{c.value}</p>
                                        <p className='text-[11px] text-gray-400 mt-0.5'>
                                          {c.factIds.length} fait{c.factIds.length > 1 ? 's' : ''} · {c.documentTitres.join(', ')}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleValidateAttribute(group.code, c)}
                                        disabled={savingAttribute === group.code || isRetenue}
                                        className='shrink-0 flex items-center gap-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-40 transition-colors'
                                      >
                                        {savingAttribute === group.code ? (
                                          <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                        ) : isRetenue ? (
                                          <CheckCircle2 className='w-3.5 h-3.5' />
                                        ) : null}
                                        {isRetenue ? 'Retenue' : 'Valider'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : entityDetailLoading && !entityDetail ? (
                    <p className='text-xs text-gray-400 italic flex items-center gap-1.5'>
                      <Loader2 className='w-3.5 h-3.5 animate-spin' />Chargement…
                    </p>
                  ) : !selectedActeVersionId ? (
                    <div className='space-y-2'>
                      <p className='text-xs text-gray-500'>
                        Choisis un acte pour reconstituer sa fiche acteur, champ par champ, sourcée sur les faits
                        de cet acte précis.
                      </p>
                      {!entityDetail || entityDetail.documents.length === 0 ? (
                        <p className='text-xs text-gray-400 italic'>Aucun acte pour l’instant.</p>
                      ) : (
                        <div className='flex flex-col gap-1.5'>
                          {[...entityDetail.documents]
                            .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
                            .map((doc) => {
                              const filledCount = validatedAttributes.filter((a) => a.versionId === doc.versionId).length;
                              return (
                                <button
                                  key={doc.versionId}
                                  onClick={() => setSelectedActeVersionId(doc.versionId)}
                                  className='flex items-center justify-between text-left bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:border-indigo-300 transition-colors'
                                >
                                  <span className='text-sm text-gray-800'>
                                    {doc.titre}
                                    {doc.date && <span className='text-gray-400'> — {formatAttributeValue(doc.date)}</span>}
                                  </span>
                                  <span className='text-[11px] text-gray-400'>
                                    {filledCount > 0 ? `${filledCount} champ${filledCount > 1 ? 's' : ''} sourcé${filledCount > 1 ? 's' : ''}` : 'rien de sourcé'}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : (
                    (() => {
                      const acteDoc = entityDetail?.documents.find((d) => d.versionId === selectedActeVersionId);
                      return (
                        <div className='space-y-4'>
                          <button
                            onClick={() => setSelectedActeVersionId(null)}
                            className='flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700'
                          >
                            <ArrowLeft className='w-3.5 h-3.5' />Retour à la liste des actes
                          </button>
                          <p className='text-sm font-medium text-gray-800'>{acteDoc?.titre}</p>

                          <div className='space-y-4'>
                            {ACTEUR_FIELD_GROUPS.map((group) => (
                              <div key={group.label} className='bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3'>
                                <p className='text-[11px] font-semibold text-gray-400 uppercase tracking-wide'>{group.label}</p>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                  {group.fields.map((field) => {
                                    const sourced = validatedAttributes.find((a) => a.attributeCode === field.key && a.versionId === selectedActeVersionId);
                                    const candidates = itemsByField.get(field.key) ?? [];
                                    const activeFactId = fieldDraftFactId[field.key] ?? null;
                                    const activeCandidate = candidates.find((c) => c.id === activeFactId);
                                    const isConfirmed = !!sourced && (!activeFactId || sourced.sourceFactIds[0] === activeFactId);
                                    const showConfirmButton = !!activeFactId && !isConfirmed;

                                    return (
                                      <div
                                        key={field.key}
                                        className={`rounded-lg border p-2.5 ${
                                          isConfirmed ? 'border-emerald-200 bg-emerald-50/40' : showConfirmButton ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'
                                        }`}
                                      >
                                        <div className='flex items-center justify-between'>
                                          <span className='text-xs text-gray-500'>{field.label}</span>
                                          <div className='flex items-center gap-1'>
                                            <button
                                              onClick={() => setLinkPickerField((cur) => (cur === field.key ? null : field.key))}
                                              title='Lier un fait de cet acte à ce champ'
                                              className={`p-0.5 rounded ${linkPickerField === field.key ? 'text-indigo-600 bg-indigo-100' : 'text-gray-300 hover:text-indigo-500 hover:bg-gray-50'}`}
                                            >
                                              <Link2 className='w-3.5 h-3.5' />
                                            </button>
                                            {isConfirmed && <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500 shrink-0' />}
                                          </div>
                                        </div>
                                        {field.key === 'sexe' ? (
                                          <div className='flex flex-wrap gap-1 mt-1'>
                                            {SEXE_OPTIONS.map((opt) => (
                                              <button
                                                key={opt.value}
                                                onClick={() => handleRefPick(field.key, opt.value)}
                                                className={`text-[11px] rounded-full px-2 py-0.5 border transition-colors ${
                                                  (fieldDrafts[field.key] ?? '').toLowerCase() === opt.value
                                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                              >
                                                {opt.label}
                                              </button>
                                            ))}
                                          </div>
                                        ) : TRISTATE_FIELDS.has(field.key) ? (
                                          <div className='mt-1'>
                                            <TriStateButton
                                              value={parseTriState(fieldDrafts[field.key])}
                                              onChange={(v) => handleRefPick(field.key, v === null || v === undefined ? '' : v ? 'oui' : 'non')}
                                              compact
                                              unknownLabel='Non renseigné'
                                              noLabel='Non'
                                              yesLabel='Oui'
                                            />
                                          </div>
                                        ) : FIELD_REF_TABLE[field.key] ? (
                                          <div className='mt-1'>
                                            <RefFieldPicker
                                              table={FIELD_REF_TABLE[field.key]}
                                              currentValue={fieldDrafts[field.key] ?? ''}
                                              onPick={(label) => handleRefPick(field.key, label)}
                                            />
                                          </div>
                                        ) : (
                                          <input
                                            value={fieldDrafts[field.key] ?? ''}
                                            onChange={(e) => {
                                              setFieldDrafts((prev) => ({ ...prev, [field.key]: e.target.value }));
                                              setFieldDraftFactId((prev) => ({ ...prev, [field.key]: null }));
                                            }}
                                            onBlur={() => handleFieldBlur(field.key)}
                                            className='w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'
                                          />
                                        )}
                                        {activeCandidate && (
                                          <p className='text-[11px] text-gray-400 italic mt-1'>
                                            Source : « {activeCandidate.sourceText || activeCandidate.label} »
                                          </p>
                                        )}
                                        {candidates.length > 1 && (
                                          <div className='flex flex-wrap gap-1 mt-1.5'>
                                            {candidates.map((c) => (
                                              <button
                                                key={c.id}
                                                onClick={() => handleCandidatePick(field.key, c)}
                                                className={`text-[11px] rounded-full px-2 py-0.5 border transition-colors ${
                                                  activeFactId === c.id
                                                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                              >
                                                {c.fieldValue}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                        {linkPickerField === field.key && (
                                          <div className='mt-1.5 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto divide-y divide-gray-100'>
                                            {acteItems.length === 0 ? (
                                              <p className='text-[11px] text-gray-400 italic p-2'>Aucun fait sur cet acte.</p>
                                            ) : (
                                              acteItems.map((item) => (
                                                <button
                                                  key={item.id}
                                                  onClick={() => { handleCandidatePick(field.key, item); setLinkPickerField(null); }}
                                                  className='block w-full text-left px-2 py-1.5 text-[11px] hover:bg-indigo-50'
                                                >
                                                  <span className='text-gray-700'>{item.label}</span>
                                                  {item.sourceText && <span className='text-gray-400 italic'> — « {item.sourceText} »</span>}
                                                </button>
                                              ))
                                            )}
                                          </div>
                                        )}
                                        {showConfirmButton && (
                                          <button
                                            onClick={() => handleConfirmField(field.key)}
                                            disabled={perActeSaving === field.key}
                                            className='mt-1.5 flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40'
                                          >
                                            {perActeSaving === field.key ? (
                                              <Loader2 className='w-3 h-3 animate-spin' />
                                            ) : (
                                              <CheckCircle2 className='w-3 h-3' />
                                            )}
                                            Valider ce champ
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          {unmappedItems.length > 0 && (
                            <details className='bg-white rounded-xl border border-gray-100 p-4'>
                              <summary className='text-xs font-medium text-gray-500 cursor-pointer'>
                                Faits non repris dans la fiche ({unmappedItems.length})
                              </summary>
                              <div className='mt-3 space-y-2'>
                                {unmappedItems.map((item) => (
                                  <div key={item.id} className='text-sm text-gray-700'>
                                    {item.label}
                                    {item.sourceText && <p className='text-xs text-gray-400 italic'>« {item.sourceText} »</p>}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              ) : activeSection === 'Détails' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Champs de saisie structurés :</li>
                    <ul>
                      <li>Identité : prénoms, nom, surnoms, sexe</li>
                      <li>Dates : naissance, baptême, décès, inhumation</li>
                      <li>Statuts civils : marital, social, juridique</li>
                      <li>Qualité généalogique : probabilité, hypothèse</li>
                    </ul>
                    <li>Provenance des données (source par champ)</li>
                    <li>Commentaires de recherche</li>
                  </ul>
                  <p>
                    <strong>But :</strong> garantir l’exactitude et la transparence des données
                    individuelles.
                  </p>
                </div>
              ) : activeSection === 'Famille' ? (
                <div className='space-y-4'>
                  <AnalyseFamille
                    activeIndividu={activeIndividu}
                    parents={parents}
                    pere={parentsPersonnes.pere}
                    mere={parentsPersonnes.mere}
                  />
                  <Separator />
                  <section id='union' className='scroll-mt-24 bg-yellow-100'>
                    <h2 className='text-2xl font-semibold flex items-center gap-2'>
                      <UsersIcon className='w-5 h-5' /> 🚧 Union & Enfants
                    </h2>

                    {unionsAvecEnfants.length > 0 && (
                      <div className='space-y-4 mt-2'>
                        {unionsAvecEnfants.map((union: any, index: number) => (
                          <div key={index}>
                            <p>
                              <strong>Conjoint :</strong> {union.conjoint_prenom}{' '}
                              {union.conjoint_nom}
                            </p>
                            {union.type_union && (
                              <p>
                                <strong>Type d’union :</strong> {union.type_union}
                              </p>
                            )}
                            {union.date_mariage && (
                              <p>
                                <strong>Mariage :</strong> {union.date_mariage}
                                {union.lieu_mariage && ` à ${union.lieu_mariage}`}
                              </p>
                            )}

                            {union.enfants && union.enfants.length > 0 ? (
                              <div className='mt-2 ml-4'>
                                <p className='font-semibold'>Enfants :</p>
                                <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                                  {union.enfants.map((enfant: any, i: number) => (
                                    <EnfantCard key={i} enfant={enfant} />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className='italic text-sm text-muted-foreground ml-4'>
                                Aucun enfant connu pour cette union.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {enfantsHorsUnion.length > 0 && (
                      <section className='mt-8 bg-yellow-50 p-4 rounded'>
                        <h3 className='text-lg font-semibold mb-2'>
                          Enfants sans union identifiée
                        </h3>
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                          {enfantsHorsUnion.map((enfant: any, i: any) => (
                            <EnfantCard key={i} enfant={enfant} />
                          ))}
                        </div>
                      </section>
                    )}
                  </section>
                </div>
              ) : activeSection === 'Appellations' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>A déterminer</li>
                  </ul>
                  <p>
                    <strong>But :</strong> contextualiser la trajectoire géographique de l’individu.
                  </p>
                  {acteursByIndividu && (
                    <AnalyseNomPrenom
                      activeIndividu={activeIndividu}
                      mentions={acteursByIndividu}
                    />
                  )}
                </div>
              ) : activeSection === 'Signature' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>A déterminer</li>
                  </ul>
                  {acteursByIndividu && (
                    <AnalyseSignature
                      activeIndividu={activeIndividu}
                      mentions={acteursByIndividu}
                    />
                  )}
                </div>
              ) : activeSection === 'Lieux' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Liste des lieux de vie, avec dates</li>
                    <li>Carte interactive</li>
                    <li>Corrélation avec les événements de la vie</li>
                  </ul>
                  <p>
                    <strong>But :</strong> contextualiser la trajectoire géographique de l’individu.
                  </p>
                </div>
              ) : activeSection === 'Activités' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Liste chronologique des professions</li>
                    <li>Cartographie sociale : évolution de statut, métiers héréditaires</li>
                  </ul>
                  <p>
                    <strong>But :</strong> éclairer les parcours professionnels dans leur contexte
                    social et familial.
                  </p>
                  <AnalyseProfessionStatutFonction
                    mentions={acteursByIndividu}
                    activeIndividu={activeIndividu}
                  />
                </div>
              ) : activeSection === 'Mentions' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Mentions marginales</li>
                    <li>Apparitions dans d’autres actes (témoins, parrains/marraines, etc.)</li>
                  </ul>
                  <p>
                    <strong>But :</strong> identifier les interactions sociales et présences
                    indirectes.
                  </p>
                </div>
              ) : activeSection === 'Sources' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Liste des sources primaires et secondaires</li>
                    <li>Accès aux images ou transcriptions</li>
                    <li>Niveau de confiance attribué</li>
                  </ul>
                  <p>
                    <strong>But :</strong> garantir la traçabilité et la vérifiabilité de chaque
                    information.
                  </p>
                  <IndividuLigneDeVieTable
                    enrichis={acteursByIndividu}
                    visibleColumns={[
                      'acteLabel',
                      'acteStatut',
                      'acteType',
                      'date',
                      'bureauNom',
                      'notaire',
                      'acteNumero',
                      'role',
                    ]}
                    pageSize={-1}
                  />
                </div>
              ) : activeSection === 'Hypothèses' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Zones d’incertitude ou d’interprétation</li>
                    <li>Scénarios envisagés, pistes en cours</li>
                    <li>Contre-hypothèses</li>
                  </ul>
                  <p>
                    <strong>But :</strong> expliciter les raisonnements derrière les hypothèses
                    généalogiques.
                  </p>
                </div>
              ) : activeSection === 'Réseau relationnel' ? (
                <div className='space-y-4'>
                  {individuId && <RelationsAccordion individuId={individuId}/>}
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Graphes de co-présence dans les actes</li>
                    <li>Groupes sociaux (paroisse, quartier, profession)</li>
                    <li>Visualisation des liens faibles et forts</li>
                  </ul>
                  <p>
                    <strong>But :</strong> comprendre les dynamiques sociales autour de l’individu.
                  </p>
                  <ul>
                    <li>Individus pour lesquels je suis apparu dans l'acte</li>
                    <li>Individus qui sont apparus dans mes actes</li>
                    <li>Individus avec qui j'ai une relation</li>
                    <li>Individus qui ont une relation avec moi</li>
                  </ul>
                </div>
              ) : activeSection === 'Notes de recherche' ? (
                <div className='space-y-4'>
                  <h1>Contenu suggéré :</h1>
                  <ul>
                    <li>Journal de bord des recherches</li>
                    <li>Rappels, blocages, idées à tester</li>
                    <li>Commentaires libres ou collaboratifs</li>
                  </ul>
                  <p>
                    <strong>But :</strong> documenter la progression et les raisonnements du
                    chercheur.
                  </p>
                </div>
              ) : (
                <p className='text-gray-600 italic text-sm'>
                  (Contenu de l’onglet "{activeSection}" pour "{activeIndividu?.prenom}{' '}
                  {activeIndividu?.nom}")
                </p>
              )}
            </section>

            {rightPanelOpen && (
              <aside className='w-80 border-l bg-gray-50 p-4 overflow-y-auto'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                    Panneau contextuel
                  </h3>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className='text-xs text-gray-500 hover:text-gray-700'
                  >
                    Fermer
                  </button>
                </div>
                <div className='space-y-4 text-sm text-gray-700'>
                  <div>
                    <h4 className='font-semibold mb-1'>Sources liées</h4>
                    <ul className='list-disc list-inside text-gray-600'>
                      <li>Acte de naissance (1832)</li>
                      <li>Recensement (1886)</li>
                      <li>Inventaire après décès</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-1'>Individus liés</h4>
                    <ul className='list-disc list-inside text-gray-600'>
                      <li>Jean RIVIÈRE (époux)</li>
                      <li>Louise RIVIÈRE (fille)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-semibold mb-1'>Hypothèses</h4>
                    <p className='text-gray-600'>
                      Éventuellement née à Basse-Terre, probable lien avec les familles DELORIEUX.
                    </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function grouperEnfantsParUnion(
  unions: any[],
  enfants: any[],
): { regroupements: any[]; enfantsHorsUnion: any[] } {
  if (!unions || !enfants) return { regroupements: [], enfantsHorsUnion: enfants ?? [] };

  const regroupements = unions.map((union) => {
    const enfantsDeCetteUnion = enfants.filter((enfant) => {
      return (
        (union.conjoint_individu_id &&
          enfant.autre_parent_individu_id === union.conjoint_individu_id) ||
        (union.conjoint_acteur_id && enfant.autre_parent_acteur_id === union.conjoint_acteur_id)
      );
    });

    return {
      ...union,
      enfants: enfantsDeCetteUnion,
    };
  });

  // Liste des IDs des enfants déjà assignés à une union
  const enfantsAssignes = new Set(
    regroupements.flatMap((u) =>
      u.enfants.map((e: any) => e.enfant_individu_id ?? e.enfant_acteur_id),
    ),
  );

  // Enfants sans correspondance avec une union
  const enfantsHorsUnion = enfants.filter((e) => {
    const id = e.enfant_individu_id ?? e.enfant_acteur_id;
    return !enfantsAssignes.has(id);
  });

  return { regroupements, enfantsHorsUnion };
}
