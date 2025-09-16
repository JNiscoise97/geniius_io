export function highlightSearchResult(el: HTMLElement) {
    // Style rouge souligné gras sur le match courant (sans store)
    el.classList.add('text-red-900', 'underline', 'font-semibold');
    setTimeout(() => {
        el.classList.remove('text-red-900', 'underline', 'font-semibold');
    }, 1500);
}

export function highlightTextWithClass(text: string, term: string, cls: string) {
    if (!term) return <span className="inline">{text}</span>;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    // On enveloppe TOUT dans un seul span inline pour ne pas créer plusieurs flex-items
    return (
        <span className="inline">
            {parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <span key={`${cls}-${i}`} className={cls}>
                        {part}
                    </span>
                ) : (
                    <span key={`${cls}-plain-${i}`}>{part}</span>
                ),
            )}
        </span>
    );
}

/**
 * Met d'abord en évidence la recherche (bleu souligné gras),
 * puis le filtre (jaune souligné gras).
 * Chaque passe renvoie un unique <span class="inline">…</span> pour éviter les gaps internes.
 */
export function highlightLabel(text: string, filter: string, search: string) {
    // 1) Search en bleu
    const firstPass = highlightTextWithClass(
        text,
        search,
        'text-blue-600 underline font-semibold',
    );

    // 2) Filter en jaune (appliqué uniquement sur les fragments texte restants)
    if (typeof firstPass !== 'string') {
        // firstPass est un ReactElement <span.inline> contenant children
        const children = (firstPass as any).props?.children ?? text;

        return (
            <span className="inline">
                {Array.isArray(children)
                    ? children.map((chunk: any) =>
                        typeof chunk === 'string'
                            ? highlightTextWithClass(
                                chunk,
                                filter,
                                'text-yellow-600 underline font-semibold',
                            )
                            : chunk,
                    )
                    : typeof children === 'string'
                        ? highlightTextWithClass(
                            children,
                            filter,
                            'text-yellow-600 underline font-semibold',
                        )
                        : children}
            </span>
        );
    }

    // fallback (cas théorique)
    return highlightTextWithClass(
        firstPass,
        filter,
        'text-yellow-600 underline font-semibold',
    );
}
