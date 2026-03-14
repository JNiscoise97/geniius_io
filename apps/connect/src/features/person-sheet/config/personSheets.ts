export type PersonSheetMedia = {
  key: string;
  type: "image" | "document";
  title: string;
  description?: string;
  src: string;
};

export type PersonSheetEvent = {
  key: string;
  label: string;
  date?: string;
  place?: string;
  description?: string;
};

export type PersonSheetRelative = {
  key: string;
  label: string;
  name: string;
  years?: string;
  linkId?: string;
};

export type PersonSheetBranchStat = {
  key: string;
  label: string;
  count: number;
};

export type PersonSheetData = {
  id: string;
  displayName: string;
  primaryName: string;
  subtitle: string;
  birth?: string;
  death?: string;
  burial?: string;
  occupation?: string;
  places: {
    birth?: string;
    death?: string;
    burial?: string;
  };
  heroImage?: string;
  summary: string;
  story: string[];
  genealogyNotes: string[];
  aliases: Array<{
    label: string;
    surname: string;
    givenNames: string;
  }>;
  keyFacts: Array<{
    label: string;
    value: string;
  }>;
  timeline: PersonSheetEvent[];
  parents: PersonSheetRelative[];
  spouses: PersonSheetRelative[];
  children: PersonSheetRelative[];
  stats?: {
    identifiedDescendants?: number;
    branchStats?: PersonSheetBranchStat[];
    note?: string;
  };
  media: PersonSheetMedia[];
};

export const personSheets: Record<string, PersonSheetData> = {
  "@7398@": {
    id: "@7398@",
    displayName: "Covindou Tandiemain",
    primaryName: "COVINDOU TANDIEMAIN",
    subtitle: "1868–1955 · Aïeule réunionnaise née d’engagés indiens",
    birth: "16.05.1868",
    death: "12.07.1955",
    burial: "Trois-Bassins",
    occupation: "Cultivatrice",
    places: {
      birth: "Saint-Leu (97436)",
      death: "Trois-Bassins (97426) · Route Hubert Delisle",
      burial: "Cimetière de Trois-Bassins",
    },
    heroImage: "/images/covindou.jpg",
    summary:
      "Née à La Réunion en 1868 dans une famille issue de l’engagisme indien, Covindou Tandiemain a transmis à une très nombreuse descendance un héritage familial et culturel profondément ancré dans l’histoire réunionnaise.",
    story: [
      "La communauté tamoule, à laquelle cette famille est liée, constitue une composante essentielle de la culture réunionnaise. L’histoire de cette lignée trouve ses racines en Inde, avec Ariapoutri Tanjama et Salléyen Vélaïdon, son compagnon, arrivés à La Réunion en 1859 sous contrat d’engagement.",
      "Covindou TANJAMA, née à La Réunion en 1868, grandit dans une famille marquée par cette migration. Elle donne naissance à plusieurs enfants avec un jeune homme né en Inde, venu lui aussi à La Réunion sous contrat, sans que leur union ne soit officialisée à l’état civil.",
      "L’histoire familiale rapporte que ce compagnon souhaitait retourner en Inde avec sa famille. Mais, au moment du départ, une tempête aurait effrayé Covindou, née à La Réunion et n’ayant jamais traversé les mers. Elle choisit finalement de rester sur l’île avec ses enfants, tandis que son compagnon repart seul vers l’Inde.",
      "Covindou vécut entre Saint-Leu et Trois-Bassins, dans l’univers des établissements sucriers et des familles d’engagés. Elle fut cultivatrice, cheffe de famille dans les recensements, et demeura un point d’ancrage majeur pour sa descendance.",
      "Très attachée à la religion tamoule et à la langue de sa mère, elle transmit à ses enfants des pratiques ancestrales, même si une partie de la génération suivante se convertit ensuite au catholicisme. Son histoire illustre à la fois l’enracinement réunionnais et la persistance d’une mémoire indienne."
    ],
    genealogyNotes: [
      "Sa mère, Ariapoutri, était née en Inde vers 1837 et arrivée à La Réunion en 1859 à bord du navire Le Georges.",
      "Covindou est née à Saint-Leu le 16 mai 1868.",
      "Elle fut ondoyée le 5 juin 1949 à l’église de Trois-Bassins.",
      "Elle est décédée le 12 juillet 1955 à Trois-Bassins et y fut inhumée.",
      "La recherche et les échanges familiaux ont permis d’identifier à ce jour 1193 descendants de ses descendants."
    ],
    aliases: [
      {
        label: "Nom de naissance",
        surname: "TANDIEMAIN",
        givenNames: "Govindaman",
      },
      {
        label: "Nom de baptême",
        surname: "TANJAMA",
        givenNames: "Govindama Marie",
      },
    ],
    keyFacts: [
      { label: "Naissance", value: "16.05.1868 · Saint-Leu" },
      { label: "Baptême / ondoyée", value: "05.06.1949 · Église de Trois-Bassins" },
      { label: "Décès", value: "12.07.1955 · Trois-Bassins" },
      { label: "Inhumation", value: "Cimetière de Trois-Bassins" },
      { label: "Profession", value: "Cultivatrice" },
      { label: "Établissement lié", value: "Grande Ravine" },
      { label: "Matricule commune", value: "8537" },
      { label: "Matricule général", value: "117710" },
    ],
    timeline: [
      {
        key: "birth",
        label: "Naissance",
        date: "16.05.1868",
        place: "Saint-Leu",
      },
      {
        key: "domicile-1891",
        label: "Domicile",
        date: "24.03.1891",
        place: "Saint-Leu",
      },
      {
        key: "judgment",
        label: "Acte de notoriété",
        date: "30.11.1897",
        place: "Saint-Leu",
        description: "Jugement pour suppléer à son acte de naissance.",
      },
      {
        key: "census-1907",
        label: "Recensement",
        date: "10.09.1907",
        place: "Saint-Leu",
        description: "Cheffe de famille, ménagère.",
      },
      {
        key: "domicile-1911",
        label: "Domicile",
        date: "24.10.1911",
        place: "Trois-Bassins",
      },
      {
        key: "census-1920",
        label: "Recensement",
        date: "27.07.1920",
        place: "Trois-Bassins",
        description: "Cheffe de famille, cultivatrice.",
      },
      {
        key: "census-1921",
        label: "Recensement",
        date: "30.07.1921",
        place: "Trois-Bassins",
        description: "Cheffe de famille, sans profession.",
      },
      {
        key: "baptism",
        label: "Ondoiement / baptême",
        date: "05.06.1949",
        place: "Église de Trois-Bassins",
      },
      {
        key: "death",
        label: "Décès",
        date: "12.07.1955",
        place: "Trois-Bassins · Route Hubert Delisle",
      },
    ],
    parents: [
      {
        key: "father",
        label: "Père",
        name: "Salléyen Vaillaydon",
      },
      {
        key: "mother",
        label: "Mère",
        name: "Ariapoutri Tanjama",
        years: "1837-1901",
      },
    ],
    spouses: [
      {
        key: "spouse-1",
        label: "Compagnon",
        name: "Nom inconnu",
      },
    ],
    children: [
      { key: "c1", label: "Enfant", name: "Candassamy TANJAMA", years: "1885-1945" },
      { key: "c2", label: "Enfant", name: "Barlama TANJAMA", years: "1889-1967" },
      { key: "c3", label: "Enfant", name: "Coundéaman TANJAMA", years: "1891-1975" },
      { key: "c4", label: "Enfant", name: "Tévané TANJAMA", years: "1893-1982" },
      { key: "c5", label: "Enfant", name: "Savoupaquiom TANJAMA", years: "1895-1992" },
      { key: "c6", label: "Enfant", name: "Virassamy ARIAPOUTRY", years: "1897-1897" },
    ],
    stats: {
      identifiedDescendants: 1193,
      branchStats: [
        { key: "candassamy", label: "Descendance de Candassamy dit Candé", count: 313 },
        { key: "barlama", label: "Descendance de Barlama dite Manicon", count: 374 },
        { key: "coundeaman", label: "Descendance de Coundéaman", count: 165 },
        { key: "tevane", label: "Descendance de Tévané dite Canou", count: 146 },
        { key: "savoupaquiom", label: "Descendance de Savoupaquiom dite Molotte", count: 202 },
      ],
      note: "Quelques implexes existent dans la descendance.",
    },
    media: [
      {
        key: "photo",
        type: "image",
        title: "Portrait de Covindou",
        src: "/images/covindou.jpg",
      },
      {
        key: "birth-record",
        type: "document",
        title: "Acte de naissance",
        description: "Document source à consulter",
        src: "/docs/covindou-acte-naissance.pdf",
      },
    ],
  },
};