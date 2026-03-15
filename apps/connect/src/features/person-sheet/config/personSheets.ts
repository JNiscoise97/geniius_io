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

    subtitle:
      "1868–1955 · Aïeule réunionnaise issue d’une famille d’engagés indiens",

    birth: "16.05.1868",
    death: "12.07.1955",
    burial: "Trois-Bassins",

    occupation: "Cultivatrice · engagée à l’établissement Grande Ravine",

    places: {
      birth: "Saint-Leu (La Réunion)",
      death: "Trois-Bassins · Route Hubert Delisle",
      burial: "Cimetière de Trois-Bassins",
    },

    heroImage: "/images/covindou.jpg",

    summary:
      "Née à Saint-Leu en 1868 dans une famille issue de l’engagisme indien, Covindou Tandiemain fut mère de six enfants et cheffe de famille dans plusieurs dénombrements. Elle vécut entre Saint-Leu et Trois-Bassins dans l’univers des établissements sucriers et transmit à une très vaste descendance une mémoire familiale profondément liée à l’histoire réunionnaise.",

    story: [
      "Covindou TANDIEMAIN est née à Saint-Leu le 16 mai 1868. Sa mère, Ariapoutri TANJAMA, était née en Inde vers 1837 et était arrivée à La Réunion en 1859 sous contrat d’engagement.",
      "Elle grandit dans l’environnement des établissements sucriers de l’ouest de l’île, notamment autour de la Grande Ravine, où de nombreux engagés indiens furent employés après l’abolition de l’esclavage.",
      "Entre 1885 et 1897, Covindou donne naissance à six enfants à Saint-Leu. Elle est la déclarante pour chacun de ces actes de naissance. Les actes indiquent que ces naissances ont lieu dans différentes maisons d’habitation liées aux propriétés sucrières locales.",
      "Ses enfants naissent dans des maisons situées sur les emplacements d’anciens domaines agricoles appartenant notamment à Augustin CERVEAUX et au sieur de CHATEAUVIEUX, ce qui illustre l’organisation résidentielle des travailleurs agricoles autour des habitations sucrières.",
      "Au dénombrement de 1907 à Saint-Leu, elle apparaît comme cheffe de famille dans le quartier des Colimaçons, Petite Ravine, sur le chemin de ligne au-dessous.",
      "Plus tard, Covindou s’installe dans la commune voisine de Trois-Bassins, où elle est recensée à plusieurs reprises dans les quartiers liés à l’établissement de la Grande Ravine.",
      "Dans les dénombrements de 1926 et 1931, elle vit chez sa fille Barlama, épouse d’Augustin VIRAMA, dans le quartier de Grande Ravine. Les documents indiquent qu’elle est illettrée.",
      "Très attachée aux traditions religieuses tamoules transmises par sa mère, elle vit cependant assez longtemps pour voir une partie de la génération suivante se convertir au catholicisme.",
      "En 1949, à l’âge de 81 ans, elle reçoit un ondoyement à l’église de Trois-Bassins.",
      "Elle décède le 12 juillet 1955 à Trois-Bassins, sur la route Hubert Delisle."
    ],

    genealogyNotes: [
      "Elle est la déclarante pour la naissance de ses six enfants.",
      "Les actes de naissance précisent les lieux exacts des habitations où ces enfants sont nés.",
      "Elle apparaît comme cheffe de famille dans plusieurs dénombrements.",
      "Les documents mentionnent qu’elle était illettrée.",
      "Elle a travaillé dans l’environnement agricole de l’établissement Grande Ravine.",
      "À ce jour, plus de 1 190 descendants ont été identifiés dans sa descendance."
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
      { label: "Décès", value: "12.07.1955 · Trois-Bassins" },
      { label: "Inhumation", value: "Cimetière de Trois-Bassins" },
      { label: "Profession", value: "Cultivatrice" },
      { label: "Instruction", value: "Illettrée" },
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
        key: "child-1885",
        label: "Naissance de son fils Candassamy",
        date: "1885",
        place: "Saint-Leu",
        description:
          "Naissance dans une des maisons d’Augustin CERVEAUX.",
      },

      {
        key: "child-1889",
        label: "Naissance de sa fille Barlama",
        date: "1889",
        place: "Saint-Leu",
        description:
          "Naissance dans une des maisons de l’emplacement du sieur de CHATEAUVIEUX.",
      },

      {
        key: "child-1891",
        label: "Naissance de sa fille Coundéaman",
        date: "1891",
        place: "Saint-Leu",
        description:
          "Naissance dans une des maisons de l’emplacement du sieur de CHATEAUVIEUX.",
      },

      {
        key: "child-1893",
        label: "Naissance de sa fille Tévané",
        date: "1893",
        place: "Saint-Leu",
        description:
          "Naissance dans une des maisons de l’emplacement du sieur de CHATEAUVIEUX.",
      },

      {
        key: "child-1895",
        label: "Naissance de sa fille Savoupaquiom",
        date: "1895",
        place: "Saint-Leu",
        description:
          "Naissance dans une des maisons de l’emplacement du sieur de CHATEAUVIEUX.",
      },

      {
        key: "child-1897",
        label: "Naissance et décès de Virassamy",
        date: "1897",
        place: "Saint-Leu",
        description:
          "Enfant né et décédé dans une des maisons de l’emplacement du sieur de CHATEAUVIEUX.",
      },

      {
        key: "census-1907",
        label: "Dénombrement",
        date: "10.09.1907",
        place:
          "Saint-Leu · Quartier Colimaçons · Petite Ravine · Chemin de ligne au-dessous",
        description:
          "Numéro d’ordre 42. Cheffe de famille, ménagère. Présente avec ses filles Coundéaman, Tévané et Savoupaquiom.",
      },

      {
        key: "census-1920",
        label: "Dénombrement",
        date: "27.07.1920",
        place: "Trois-Bassins · Bas de la Grande Ravine",
        description:
          "Numéro d’ordre 9. Cheffe de famille, cultivatrice.",
      },

      {
        key: "census-1921",
        label: "Dénombrement",
        date: "30.07.1921",
        place: "Trois-Bassins · Petite Ravine · établissement",
        description:
          "Numéro d’ordre 36. Cheffe de famille, sans profession.",
      },

      {
        key: "census-1926",
        label: "Dénombrement",
        date: "1926",
        place: "Trois-Bassins · Grande Ravine",
        description:
          "Numéro d’ordre 21. Vit chez sa fille Barlama, épouse d’Augustin VIRAMA. Mentionnée comme illettrée.",
      },

      {
        key: "census-1931",
        label: "Dénombrement",
        date: "1931",
        place: "Trois-Bassins · Grande Ravine les Bas",
        description:
          "Numéro d’ordre 11. Vit toujours chez sa fille Barlama, épouse d’Augustin VIRAMA.",
      },

      {
        key: "baptism",
        label: "Ondoiement",
        date: "05.06.1949",
        place: "Église de Trois-Bassins",
        description:
          "Ondoyée à l’âge de 81 ans. Parrain : Théodore LAVAL. Marraine : Marie Cécilia GRONDIN.",
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
        name: "Nom inconnu · engagé indien",
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
        description: "Acte de naissance et jugement de notoriété",
        src: "/docs/covindou-acte-naissance.pdf",
      },
    ],
  },
};