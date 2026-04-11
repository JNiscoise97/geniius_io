import {
    ArrowLeft,
    CalendarDays,
    Download,
    ExternalLink,
    FileBadge2,
    FileImage,
    FileText,
    Image as ImageIcon,
    MapPinned,
    ScrollText,
    Star,
    User,
    type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getFamilyDocumentBySlug,
    getFamilyDocumentCategoryMeta,
} from "../data/familyDocumentsCatalog";
import type { FamilyDocumentCategory } from "../data/familyDocumentTypes";

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

function buildPdfViewerUrl(fileUrl: string): string {
    return `${fileUrl}#toolbar=1&navpanes=0&view=FitH`;
}

function getFormatLabel(format: "pdf" | "image"): string {
    return format === "pdf" ? "PDF" : "Image";
}

export function FamilyDocumentReaderPage() {
    const nav = useNavigate();
    const { eventSlug, documentSlug } = useParams();

    const resolvedEventSlug = eventSlug ?? "";
    const resolvedDocumentSlug = documentSlug ?? "";

    const document = useMemo(
        () => getFamilyDocumentBySlug(resolvedDocumentSlug),
        [resolvedDocumentSlug],
    );

    if (!resolvedEventSlug) {
        return (
            <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
                <main className="c-container pb-24 pt-4">
                    <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
                        <div className="text-lg font-black text-rose-900">
                            Aucun événement n’a été trouvé
                        </div>
                        <p className="mt-2 text-sm font-medium leading-6 text-rose-800">
                            L’URL ne contient pas de slug d’événement valide.
                        </p>
                    </section>
                </main>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
                <main className="c-container pb-24 pt-4">
                    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">
                                Document introuvable
                            </h1>
                        </div>

                        <button
                            type="button"
                            onClick={() => nav(`/e/${resolvedEventSlug}/documents`)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                        >
                            <ArrowLeft size={14} />
                            Retour
                        </button>
                    </header>

                    <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <div className="text-lg font-black text-amber-900">
                            Ce document n’existe pas ou n’est plus disponible
                        </div>
                        <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
                            Vérifie le catalogue ou reviens à la liste des documents.
                        </p>
                    </section>
                </main>
            </div>
        );
    }

    const Icon = getDocumentIcon(document.category);
    const categoryMeta = getFamilyDocumentCategoryMeta(document.category);
    const viewerUrl =
        document.format === "pdf"
            ? buildPdfViewerUrl(document.fileUrl)
            : document.fileUrl;

    return (
        <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]">
            <main className="c-container pb-24 pt-4">
                <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-blue-700">
                            <Icon size={14} />
                            {categoryMeta.title}
                        </div>

                        {document.description ? (
                            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-700">
                                {document.description}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => nav(`/e/${resolvedEventSlug}/documents`)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                        >
                            <ArrowLeft size={14} />
                            Retour
                        </button>

                        <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                        >
                            <ExternalLink size={14} />
                            Ouvrir
                        </a>

                        <a
                            href={document.fileUrl}
                            download
                            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm"
                        >
                            <Download size={14} />
                            Télécharger
                        </a>
                    </div>
                </header>

                <div className="grid gap-4">
                    <aside className="space-y-4">
                        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-slate-100 p-3 text-slate-900">
                                    <Icon size={20} />
                                </div>

                                <div className="min-w-0">
                                    <div className="text-[18px] font-black text-slate-900">
                                        {document.title}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">

                                        {document.isFeatured ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                                                <Star size={11} />
                                                À la une
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="text-sm font-black text-slate-900">
                                Informations
                            </div>

                            <div className="mt-4 space-y-3">

                                {document.publicationDateLabel ? (
                                    <InfoRow
                                        icon={CalendarDays}
                                        label="Parution"
                                        value={document.publicationDateLabel}
                                    />
                                ) : null}

                                {document.author ? (
                                    <InfoRow icon={User} label="Auteur" value={document.author} />
                                ) : null}

                                {document.writingDate ? (
                                    <InfoRow
                                        icon={CalendarDays}
                                        label="Date de rédaction"
                                        value={document.writingDate}
                                    />
                                ) : null}

                                {document.writingPlace ? (
                                    <InfoRow
                                        icon={MapPinned}
                                        label="Lieu de rédaction"
                                        value={document.writingPlace}
                                    />
                                ) : null}

                                {document.place ? (
                                    <InfoRow
                                        icon={MapPinned}
                                        label="Lieu"
                                        value={document.place}
                                    />
                                ) : null}

                                <InfoRow
                                    icon={FileText}
                                    label="Type"
                                    value={categoryMeta.title}
                                />

                                <InfoRow
                                    icon={document.format === "pdf" ? FileText : ImageIcon}
                                    label="Format"
                                    value={getFormatLabel(document.format)}
                                />

                                {document.personNames?.length ? (
                                    <InfoRow
                                        icon={User}
                                        label="Personnes"
                                        value={document.personNames.join(", ")}
                                    />
                                ) : null}
                            </div>
                        </section>
                    </aside>

                    <section className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
                        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                            {document.format === "pdf" ? (
                                <iframe
                                    title={document.title}
                                    src={viewerUrl}
                                    className="block h-[68vh] w-full border-0 sm:h-[72vh] lg:h-[78vh]"
                                />
                            ) : (
                                <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 p-2 sm:min-h-[60vh] lg:min-h-[78vh]">
                                    <img
                                        src={viewerUrl}
                                        alt={document.title}
                                        className="max-h-[78vh] w-auto max-w-full rounded-[18px] object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-[11px] font-extrabold leading-5 text-slate-500">
                                {document.format === "pdf"
                                    ? "Si l’aperçu intégré ne s’affiche pas correctement sur ton appareil, ouvre le PDF dans un nouvel onglet."
                                    : "Si l’image ne s’affiche pas correctement dans l’application, ouvre-la dans un nouvel onglet."}
                            </div>

                            <a
                                href={document.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm"
                            >
                                <ExternalLink size={14} />
                                {document.format === "pdf" ? "Ouvrir le PDF" : "Ouvrir l’image"}
                            </a>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3">
            <div className="rounded-2xl bg-white p-2 text-slate-700 shadow-sm">
                <Icon size={16} />
            </div>

            <div className="min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-slate-500">
                    {label}
                </div>
                <div className="mt-1 text-sm font-bold leading-6 text-slate-900">
                    {value}
                </div>
            </div>
        </div>
    );
}