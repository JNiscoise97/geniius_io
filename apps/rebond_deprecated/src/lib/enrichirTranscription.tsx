import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ========================
 * Helpers génériques
 * ====================== */

// "10:00" -> "10 h" / "10:30" -> "10 h 30"
function formatHeureFr(hhmm?: string | null) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':');
  if (!m || m === '00') return `${parseInt(h, 10)} h`;
  return `${parseInt(h, 10)} h ${parseInt(m, 10)}`;
}

// "12/07/1848" -> "12 juillet 1848"
function formatDateFr(d?: string | Date | null) {
  if (!d) return '';
  try {
    const date = typeof d === 'string' ? parseISO(d) : d;
    // @ts-ignore
    return format(date, 'd MMMM yyyy', { locale: fr });
  } catch {
    return typeof d === 'string' ? d : '';
  }
}

// "A, B et C" (avec virgule avant "et")
function joinNaturel(items: string[]): string {
  const arr = items.filter(Boolean);
  if (arr.length <= 1) return arr.join('');
  if (arr.length === 2) return `${arr[0]} et ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, et ${arr[arr.length - 1]}`;
}

/* ========================
 * Helpers entités / rôles
 * ====================== */

function cleanBureauName(name?: string | null) {
  if (!name) return '';
  return name.replace(/^mairie\s+de\s+/i, '').trim();
}

function findOne(entites: any[], role: string) {
  return entites?.find((e) => (e.role || '').toLowerCase() === role.toLowerCase()) || null;
}

function findManyStartsWith(entites: any[], prefix: string) {
  const p = prefix.toLowerCase();
  return entites?.filter((e) => (e.role || '').toLowerCase().startsWith(p)) || [];
}

// Etiquette compacte : "Nom Prénom, 49 ans, métier, de Ville"
function personLabel(
  e?: any | null,
  opts: { age?: boolean; prof?: boolean; ville?: boolean } = {}
) {
  if (!e) return '';
  const nom = [e?.prenom, e?.nom].filter(Boolean).join(' ');
  const parts: string[] = [];
  if (opts.age !== false && e?.age) parts.push(`${e.age} ans`);
  if (opts.prof !== false && e?.profession_brut) parts.push(e.profession_brut);
  const ville = e?.domicile || e?.naissance_lieu_commune || e?.deces_lieu_commune;
  if (opts.ville !== false && ville) parts.push(`de ${ville}`);
  return [nom, parts.join(', ')].filter(Boolean).join(', ');
}

function displayNomSimple(e?: any | null) {
  if (!e) return '';
  return [e?.prenom, e?.nom].filter(Boolean).join(' ').trim();
}

function lieuNaissanceEnfant(enfant?: any | null) {
  if (!enfant) return '';
  const morceaux = [enfant.naissance_lieu_commune, enfant.naissance_lieu_precisions]
    .filter(Boolean)
    .join(', ');
  return morceaux ? ` à ${morceaux}` : '';
}

function lieuDecesDefunt(defunt?: any | null) {
  if (!defunt) return '';
  const morceaux = [defunt.deces_lieu_commune, defunt.deces_lieu_precisions]
    .filter(Boolean)
    .join(', ');
  return morceaux ? ` à ${morceaux}` : '';
}

function agentOfficier(entites: any[]) {
  const off = findOne(entites, 'officier');
  return off ? personLabel(off) : '';
}

function extractArreteDateFromNote(note: string): Date | null {
  if (!note) return null;
  const parts = note.split(/;|et/gi).map((p) => p.trim());
  for (const part of parts) {
    if (!/arr[ée]t[ée]/i.test(part)) continue;
    const match = part.match(/(?:en\s+date\s+du|date\s+du)\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (match && match[1]) {
      const [day, month, year] = match[1].split('/');
      const parsed = new Date(`${year}-${month}-${day}`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
}

/* ========================
 * Signatures
 * ====================== */
function buildParagrapheSignatures(entites: any[]) {
  const temoins = findManyStartsWith(entites, 'témoin');
  const off = findOne(entites, 'officier');

  const temoinsPresence = temoins.length
    ? `En présence de ${joinNaturel(
        temoins.map((t) => personLabel(t, { age: true, prof: false, ville: true }))
      )}.`
    : '';

  const habeant = `Lecture faite, les comparants${temoins.length ? ' et témoins' : ''} ont signé l’acte avec l’officier.`;

  const nomsSignataires = [
    ...temoins.map((t: any) => displayNomSimple(t)),
    off ? displayNomSimple(off) : '',
  ].filter(Boolean);

  const officierTxt = nomsSignataires.length
    ? `Ont signé : ${joinNaturel(nomsSignataires)}.`
    : '';

  return [temoinsPresence, habeant, officierTxt].filter(Boolean).join(' ');
}

/* ========================
 * Transcription narrative
 * ====================== */
export function buildTranscriptionNarrative({
  acte,
  entites,
  registre,
  bureau,
}: {
  acte: any;
  entites: any[];
  registre?: any | null;
  bureau?: any | null;
}): string {
  if (!acte) return '';

  // Ouverture
  const dateActe = formatDateFr(acte.date);
  const heure = formatHeureFr(acte.heure);
  const heureTxt = heure ? ` à ${heure}` : '';
  const lieuMairie = bureau?.nom
    ? `en la maison commune de ${cleanBureauName(bureau.nom)}${
        bureau.departement ? ` (${bureau.departement})` : ''
      }`
    : '';
  const officierTxt = agentOfficier(entites);
  const ouverture = [
    dateActe ? `Le ${dateActe}${heureTxt}` : '',
    lieuMairie,
    officierTxt ? `devant ${officierTxt}, officier de l’état civil` : 'devant l’officier de l’état civil',
  ]
    .filter(Boolean)
    .join(', ')
    .replace(/,\s*$/, '');

  const type = (acte.type_acte || '').toLowerCase();

  // Acteurs principaux
  const enfant = findOne(entites, 'enfant');
  const defunt = findOne(entites, 'défunt');
  const sujet = findOne(entites, 'sujet');
  const epoux = findOne(entites, 'époux');
  const epouse = findOne(entites, 'épouse');

  const declarants = findManyStartsWith(entites, 'déclarant');
  const temoins = findManyStartsWith(entites, 'témoin');
  const parents = [
    findOne(entites, 'père'),
    findOne(entites, 'mère'),
    findOne(entites, 'père de l’époux'),
    findOne(entites, 'mère de l’époux'),
    findOne(entites, 'père de l’épouse'),
    findOne(entites, 'mère de l’épouse'),
  ].filter(Boolean) as any[];

  let corps = '';

  /* === Naissance === */
  if (type === 'naissance' && enfant) {
    const declarantTxt = declarants.length
      ? joinNaturel(declarants.map((d) => personLabel(d, { age: true, prof: true, ville: true })))
      : 'Un déclarant';

    const enfantTxt = personLabel(enfant, { age: false, prof: true, ville: false });
    let neMot = 'né';
    if (enfant?.sexe?.toLowerCase() === 'f') neMot = 'née';

    const dateN = enfant?.naissance_date ? `le ${formatDateFr(enfant.naissance_date)}` : '';
    const lieuN = lieuNaissanceEnfant(enfant);
    const naissancePhrase = [neMot, dateN].filter(Boolean).join(' ') + (lieuN || '');

    const parentsTxt = parents.length
      ? `L’enfant est issu de ${joinNaturel(
          parents.map((p) => personLabel(p, { age: true, prof: true, ville: true }))
        )}.`
      : '';

    const obs = acte?.comparution_observations ? ` ${acte.comparution_observations}` : '';

    const p1 = `${ouverture}, la naissance de ${enfantTxt}, ${naissancePhrase} a été déclarée. ${declarantTxt}. ${obs}`.replace(/\s+\./g, '.');

    corps = [p1, parentsTxt].filter(Boolean).join('\n\n');
  }

  /* === Décès === */
  else if (type === 'décès' && defunt) {
    const declTxt = declarants.length
      ? `Le décès a été déclaré par ${joinNaturel(
          declarants.map((d) => personLabel(d, { age: true, prof: true, ville: true }))
        )}.`
      : `Le décès a été déclaré.`;

    const defuntTxt = personLabel(defunt, { age: true, prof: true, ville: true });
    const dateD = defunt?.deces_date ? `le ${formatDateFr(defunt.deces_date)}` : '';
    const lieuD = lieuDecesDefunt(defunt);

    const p1 = `${ouverture}. ${declTxt}`;
    const p2 = `${defuntTxt} est décédé ${[dateD, lieuD].filter(Boolean).join(' ')}.`.replace(/\s+\./g, '.');

    corps = [p1, p2].filter(Boolean).join('\n\n');
  }

  /* === Mariage === */
  else if (type === 'mariage' && epoux && epouse) {
    const conjoints = joinNaturel([personLabel(epoux), personLabel(epouse)]);
    const p1 = `${ouverture}. ${conjoints} se sont présentés pour contracter mariage.`;

    const parentsEpoux = [findOne(entites, 'père de l’époux'), findOne(entites, 'mère de l’époux')].filter(Boolean) as any[];
    const parentsEpouse = [findOne(entites, 'père de l’épouse'), findOne(entites, 'mère de l’épouse')].filter(Boolean) as any[];
    const pParents =
      parentsEpoux.length || parentsEpouse.length
        ? [
            parentsEpoux.length ? `Parents de l’époux : ${joinNaturel(parentsEpoux.map((p) => personLabel(p)))}.` : '',
            parentsEpouse.length ? `Parents de l’épouse : ${joinNaturel(parentsEpouse.map((p) => personLabel(p)))}.` : '',
          ]
            .filter(Boolean)
            .join(' ')
        : '';

    const presenceTemoins = temoins.length
      ? `En présence de ${joinNaturel(temoins.map((t) => personLabel(t, { age: true, prof: false, ville: true })))}.`
      : '';

    // Formule finale selon genre
    let unionTxt = `unis par le mariage`;
    if (epoux?.sexe && epouse?.sexe && epoux.sexe.toLowerCase() === epouse.sexe.toLowerCase()) {
      unionTxt = `mariés`;
    }

    const p2 = `Après lecture des pièces exigées par la loi et recueil des consentements, nous les avons déclarés ${unionTxt}.`;

    corps = [p1, pParents, presenceTemoins, p2].filter(Boolean).join('\n\n');
  }

  /* === Reconnaissance === */
  else if (type === 'reconnaissance' && sujet) {
    const s = personLabel(sujet);
    const p1 = `${ouverture}. ${s} a déclaré reconnaître l’enfant mentionné à l’acte.`;
    corps = [p1].join('\n\n');
  }

  /* === Affranchissement === */
  else if (type === 'affranchissement' && sujet) {
    const s = personLabel(sujet);
    const arrete =
      extractArreteDateFromNote(sujet?.note || '') || (acte?.date ? parseISO(acte.date) : null);
    const dateArr = arrete ? ` L’arrêté du Gouverneur est daté du ${formatDateFr(arrete)}.` : '';
    const p1 = `${ouverture}. A été transcrit l’arrêté d’affranchissement concernant ${s}.${dateArr}`;
    corps = [p1].join('\n\n');
  }

  /* === Fallback === */
  else {
    const p1 = `${ouverture}. A été dressé le présent acte de type « ${acte.type_acte} ».`;
    const p2 = entites?.length
      ? `Y sont mentionnés : ${entites.map((e: any) => `${e.role || 'personne'} (${personLabel(e)})`).join(' ; ')}.`
      : '';
    corps = [p1, p2].filter(Boolean).join('\n\n');
  }

  // Signatures
  const signataires = buildParagrapheSignatures(entites);

  // Références
  const refs: string[] = [];
  if (registre?.annee) refs.push(`Registre ${registre.annee}`);
  if (acte?.numero_acte) refs.push(`acte n°${acte.numero_acte}`);
  const footer = refs.length ? `\n\n— ${refs.join(', ')}.` : '';

  return [corps, signataires, footer].filter(Boolean).join('\n\n').trim();
}
