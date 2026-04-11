import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileBadge2,
  FileImage,
  FileText,
  ScrollText,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFamilyDocumentCategoryMeta,
  listFamilyDocuments,
} from "../data/familyDocumentsCatalog";
import type {
  FamilyDocumentCategory,
  FamilyDocumentDefinition,
} from "../data/familyDocumentTypes";

type FamilyDocumentResolved = FamilyDocumentDefinition & {
  fileUrl: string;
};

type DocumentGroup = {
  key: FamilyDocumentCategory;
  title: string;
  subtitle: string;
  documents: FamilyDocumentResolved[];
};

type DocumentMetric = {
  key: string;
  label: string;
  value: string;
};

function getDocumentIcon(category: FamilyDocumentCategory): LucideIcon {
  switch (category) {
    case "livret":
      return FileText;
    case "liste_familiale":
      return FileBadge2;
    case "recit":
      return ScrollText;
    case "archive_acte":
      return FileBadge2;
    case "image_archive":
      return FileImage;
    default:
      return FileText;
  }
}

function getFormatLabel(format: "pdf" | "image"): string {
  return format === "pdf" ? "PDF" : "Image";
}

function buildGroups(documents: FamilyDocumentResolved[]): DocumentGroup[] {
  const categoryOrder: FamilyDocumentCategory[] = [
    "livret",
    "recit",
    "liste_familiale",
    "archive_acte",
    "image_archive",
  ];

  return categoryOrder
    .map((category) => {
      const docs = documents.filter((doc) => doc.category === category);
      if (docs.length === 0) return null;

      const meta = getFamilyDocumentCategoryMeta(category);

      return {
        key: category,
        title: meta.title,
        subtitle: meta.subtitle,
        documents: docs,
      };
    })
    .filter((group): group is DocumentGroup => group !== null);
}

export function FamilyDocumentsPage() {
  const nav = useNavigate();
  const { eventSlug } = useParams();
  const resolvedEventSlug = eventSlug ?? "";

  const documents = useMemo(() => listFamilyDocuments(), []);
  const groupedDocuments = useMemo(() => buildGroups(documents), [documents]);

  const metrics: DocumentMetric[] = useMemo(() => {
    const featuredCount = documents.filter((doc) => doc.isFeatured).length;
    const pdfCount = documents.filter((doc) => doc.format === "pdf").length;
    const imageCount = documents.filter((doc) => doc.format === "image").length;

    return [
      {
        key: "documents",
        label: "Documents",
        value: String(documents.length),
      },
      {
        key: "featured",
        label: "À la une",
        value: String(featuredCount),
      },
      {
        key: "formats",
        label: "PDF / images",
        value: `${pdfCount} / ${imageCount}`,
      },
    ];
  }, [documents]);

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
      <main className="c-container pb-24 pt-4">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
              Documents de famille
            </h1>
          </div>

          <button
            type="button"
            onClick={() => nav(`/e/${resolvedEventSlug}/home`)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-blue-700">
            <BookOpen size={14} />
            Archives familiales
          </div>

          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            Retrouve ici les livrets, récits, listes familiales et documents
            d’archives de la famille. Tu peux les consulter directement dans
            l’application.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-[22px] leading-none font-black text-slate-900">
                  {metric.value}
                </div>
                <div className="mt-1 text-[11px] font-extrabold leading-4 text-slate-600">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {groupedDocuments.map((group) => (
            <section key={group.key}>
              <div className="mb-3">
                <h2 className="text-[18px] font-black text-slate-900">
                  {group.title}
                </h2>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                  {group.subtitle}
                </p>
              </div>

              <div className="grid gap-3">
                {group.documents.map((document) => (
                  <FamilyDocumentCard
                    key={document.id}
                    document={document}
                    onClick={() =>
                      nav(`/e/${resolvedEventSlug}/documents/${document.slug}`)
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function FamilyDocumentCard({
  document,
  onClick,
}: {
  document: FamilyDocumentResolved;
  onClick: () => void;
}) {
  const Icon = getDocumentIcon(document.category);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.99] active:shadow-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-3 text-slate-900">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[15px] font-black text-slate-900">
              {document.title}
            </div>

            {document.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
                <Star size={10} />
                À la une
              </span>
            ) : null}

            {typeof document.year === "number" ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
                {document.year}
              </span>
            ) : null}

            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
              {getFormatLabel(document.format)}
            </span>
          </div>

          {document.description ? (
            <p className="mt-1 text-xs font-bold leading-5 text-slate-700">
              {document.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {document.author ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                {document.author}
              </span>
            ) : null}

            {document.writingPlace ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                {document.writingPlace}
              </span>
            ) : null}

            {document.personNames?.slice(0, 2).map((personName) => (
              <span
                key={personName}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700"
              >
                {personName}
              </span>
            ))}

            {document.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-slate-100 p-2 text-slate-900">
          <ArrowRight size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <div className="text-[11px] font-extrabold text-slate-500">
          {document.format === "pdf" ? "Ouvrir le document" : "Ouvrir l’image"}
        </div>
      </div>
    </button>
  );
}