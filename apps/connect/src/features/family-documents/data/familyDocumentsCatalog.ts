import type {
  FamilyDocumentCategory,
  FamilyDocumentDefinition,
} from "./familyDocumentTypes";

type AssetModule = {
  default: string;
};

type FamilyDocumentResolved = FamilyDocumentDefinition & {
  fileUrl: string;
};

const pdfModules = import.meta.glob<AssetModule>(
  "../../../assets/documents/**/*.pdf",
  { eager: true },
);

const imageModules = import.meta.glob<AssetModule>(
  "../../../assets/documents/**/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

const assetModules: Record<string, AssetModule> = {
  ...pdfModules,
  ...imageModules,
};

const documentDefinitions: FamilyDocumentDefinition[] = [
  {
    id: "avant-propos",
    slug: "avant-propos",
    title: "Avant propos",
    category: "livret",
    format: "pdf",
    assetPath: "livrets/avant-propos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 1,
    isFeatured: true,
    tags: ["introduction", "famille", "livret"],
  },
  {
    id: "nout-zarlor",
    slug: "nout-zarlor",
    title: "Nout zarlor",
    category: "livret",
    format: "pdf",
    assetPath: "livrets/nout-zarlor.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 2,
    isFeatured: true,
    tags: ["patrimoine", "famille", "livret"],
  },
  {
    id: "gromer-covindou-enfants-petits-enfants-photos",
    slug: "gromer-covindou-enfants-petits-enfants-photos",
    title: "Liste des enfants et petits-enfants de Gromèr Covindou avec photo",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/gromer-covindou-enfants-petits-enfants-photos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 10,
    personNames: ["Gromèr Covindou"],
    tags: ["descendance", "photos", "branche familiale"],
  },
  {
    id: "candassamy-tanjama-enfants-photos",
    slug: "candassamy-tanjama-enfants-photos",
    title: "Liste des enfants de Candassamy TANJAMA avec photo",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/candassamy-tanjama-enfants-photos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 11,
    personNames: ["Candassamy TANJAMA"],
    tags: ["descendance", "photos", "branche familiale"],
  },
  {
    id: "manicon-tanjama-virama-enfants-photos",
    slug: "manicon-tanjama-virama-enfants-photos",
    title: "Liste des enfants de Manicon TANJAMA/VIRAMA avec photo",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/manicon-tanjama-virama-enfants-photos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 12,
    personNames: ["Manicon TANJAMA", "VIRAMA"],
    tags: ["descendance", "photos", "branche familiale"],
  },
  {
    id: "coudeaman-tanjama-bluker-enfants-photos",
    slug: "coudeaman-tanjama-bluker-enfants-photos",
    title: "Liste des enfants de Coudéaman TANJAMA/BLUKER avec photo",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/coudeaman-tanjama-bluker-enfants-photos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 13,
    personNames: ["Coudéaman TANJAMA", "BLUKER"],
    tags: ["descendance", "photos", "branche familiale"],
  },
  {
    id: "canou-tanjama-enfants-photos",
    slug: "canou-tanjama-enfants-photos",
    title: "Liste des enfants de Canou TANJAMA avec photo",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/canou-tanjama-enfants-photos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 14,
    personNames: ["Canou TANJAMA"],
    tags: ["descendance", "photos", "branche familiale"],
  },
  {
    id: "molotte-tanjama-calety-enfants-photos",
    slug: "molotte-tanjama-calety-enfants-photos",
    title: "Liste des enfants de Molotte TANJAMA/CALÉTY avec photo",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/molotte-tanjama-calety-enfants-photos.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 15,
    personNames: ["Molotte TANJAMA", "CALÉTY"],
    tags: ["descendance", "photos", "branche familiale"],
  },
  {
    id: "recit-familial-famille-tanjama",
    slug: "recit-familial-famille-tanjama",
    title: "Récit familial de la famille TANJAMA",
    category: "recit",
    format: "pdf",
    assetPath: "recits/recit-familial-famille-tanjama.pdf",
    orientation: "landscape",
    year: 2023,
    publicationDateLabel: "2023",
    author: "Jordan N.",
    order: 20,
    isFeatured: true,
    tags: ["récit", "transmission", "famille TANJAMA"],
  },
  {
    id: "gromer-covindou-parrains-marraines",
    slug: "gromer-covindou-parrains-marraines",
    title: "Liste des parrains et marraines des membres des enfants et petits-enfants de Gromèr Covindou",
    category: "liste_familiale",
    format: "pdf",
    assetPath: "listes-familiales/gromer-covindou-parrains-marraines.pdf",
    orientation: "portrait",
    year: 2024,
    publicationDateLabel: "2024",
    author: "Jordan N.",
    order: 16,
    personNames: ["Gromèr Covindou"],
    tags: ["parrains", "marraines", "branche familiale"],
  },
  {
    id: "acte-deces-ariapoutry-tanjama",
    slug: "acte-deces-ariapoutry-tanjama",
    title: "Acte de décès de Ariapoutry TANJAMA",
    category: "image_archive",
    format: "image",
    assetPath: "images/actes/acte-deces-ariapoutry-tanjama-1901.jpg",
    orientation: "landscape",
    writingDate: "12/05/1901",
    writingPlace: "Mairie de Trois-Bassins",
    order: 30,
    personNames: ["Ariapoutry TANJAMA"],
    tags: ["acte de décès", "archive", "Trois-Bassins"],
    isFeatured: true,
  },
];

function normalizeAssetPath(assetPath: string): string {
  return assetPath.replace(/^\/+/, "");
}

function getAssetUrl(assetPath: string): string {
  const normalized = normalizeAssetPath(assetPath);
  const fullPath = `../../../assets/documents/${normalized}`;
  const mod = assetModules[fullPath];

  if (!mod?.default) {
    throw new Error(
      `Document introuvable dans src/assets/documents : ${normalized}`,
    );
  }

  return mod.default;
}

export function listFamilyDocuments(): FamilyDocumentResolved[] {
  return [...documentDefinitions]
    .map((doc) => ({
      ...doc,
      fileUrl: getAssetUrl(doc.assetPath),
    }))
    .sort((a, b) => {
      const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.title.localeCompare(b.title, "fr");
    });
}

export function getFamilyDocumentBySlug(
  slug: string,
): FamilyDocumentResolved | undefined {
  return listFamilyDocuments().find((doc) => doc.slug === slug);
}

export function getFamilyDocumentCategoryMeta(
  category: FamilyDocumentCategory,
): { title: string; subtitle: string } {
  switch (category) {
    case "livret":
      return {
        title: "Livrets",
        subtitle: "Documents d’introduction et de présentation familiale.",
      };
    case "liste_familiale":
      return {
        title: "Listes familiales",
        subtitle: "Descendances, groupes familiaux, parrains et marraines.",
      };
    case "recit":
      return {
        title: "Récits",
        subtitle: "Textes rédigés pour transmettre l’histoire familiale.",
      };
    case "archive_acte":
      return {
        title: "Actes d’archives",
        subtitle: "Documents d’archives au format PDF.",
      };
    case "image_archive":
      return {
        title: "Images d’archives",
        subtitle: "Documents d’archives conservés sous forme d’image.",
      };
    default:
      return {
        title: "Documents",
        subtitle: "",
      };
  }
}