"""Corrige, dans le texte transcrit, les mots proches des mots-cles fournis
par l'utilisateur (dictation/dictationPrompt.ts cote client) mais mal
reconnus par le modele - initial_prompt biaise la reconnaissance mais ne la
force pas, certains mots proches phonetiquement passent quand meme (constate
en usage reel : "Gourbert" au lieu de "Gourbeyre", "Negret" au lieu de
"Negre").

Pas une vraie comparaison phonetique (aucune lib phonetique francaise fiable
disponible sans risquer un nouveau probleme de dependance native - cf.
l'historique onnxruntime/ctranslate2 du meme jour) : similarite de chaine sur
la forme normalisee (minuscule, sans accents, sans ponctuation). Rattrape les
fautes d'orthographe proches (Gourbert/Gourbeyre, Negret/Negre, Gaultius/
Golius) mais PAS les cas ou la graphie corrigee est tres differente de ce
qui a ete transcrit malgre une proximite phonetique reelle (constate :
"Badaudan" transcrit pour "Bas-Dos-D'Ane", score 0.667 - sous le seuil).

Seuil choisi (0.75) par mesure empirique sur un cas reel, en priorisant la
precision : a 0.65-0.70, "Badaudan" est bien corrige mais "faites" est aussi
remplace a tort par "Favieres" (score 0.714) - une correction qui casse une
phrase correcte est pire que ne rien corriger. Prefere donc rater une
correction plutot que d'en inventer une fausse.
"""

import re
import unicodedata
from difflib import SequenceMatcher

_WORD_RE = re.compile(r"\S+")

DEFAULT_THRESHOLD = 0.75


def _normalize(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def apply_keyword_corrections(text: str, keywords: list[str], threshold: float = DEFAULT_THRESHOLD) -> str:
    if not keywords or not text:
        return text

    # Mots-cles tries par nombre de mots decroissant : les correspondances
    # multi-mots sont tentees avant les correspondances mot-a-mot, pour ne
    # pas fragmenter un match multi-mots par un match partiel plus court.
    kw_list = sorted({k.strip() for k in keywords if k.strip()}, key=lambda k: -len(k.split()))
    if not kw_list:
        return text

    words = _WORD_RE.findall(text)
    spans = [m.span() for m in _WORD_RE.finditer(text)]
    consumed = [False] * len(words)
    replacements: list[tuple[int, int, str]] = []  # (debut mot, fin mot exclu, texte de remplacement)

    for kw in kw_list:
        n = len(kw.split())
        kw_norm = _normalize(kw)
        if not kw_norm:
            continue
        # Cherche la meilleure fenetre restante (pas la premiere qui
        # depasse le seuil) : sinon une fenetre decalee/mal alignee mais
        # partageant beaucoup de caracteres peut etre acceptee avant la
        # vraie fenetre alignee (bug constate en pratique : "nous Germain
        # Edouard" acceptee a la place de "Germain Edouard Negret").
        # Recommence apres chaque acceptation pour rattraper les
        # occurrences multiples du meme mot-cle (ex. un lieu cite 2 fois).
        while True:
            best_score = 0.0
            best_i = None
            i = 0
            while i + n <= len(words):
                if any(consumed[i:i + n]):
                    i += 1
                    continue
                window_norm = _normalize(" ".join(words[i:i + n]))
                if window_norm == kw_norm:
                    i += 1
                    continue  # deja correct, rien a faire a cette position
                score = _similarity(window_norm, kw_norm)
                if score > best_score:
                    best_score = score
                    best_i = i
                i += 1
            if best_i is None or best_score < threshold:
                break
            for j in range(best_i, best_i + n):
                consumed[j] = True
            replacements.append((best_i, best_i + n, kw))

    if not replacements:
        return text

    replacements.sort(key=lambda r: r[0])
    result = []
    cursor = 0
    for start_idx, end_idx, replacement in replacements:
        char_start = spans[start_idx][0]
        char_end = spans[end_idx - 1][1]
        original_span = text[char_start:char_end]
        result.append(text[cursor:char_start])
        # Conserve la ponctuation d'origine attachee en debut/fin (virgule,
        # point...) - le mot-cle lui-meme n'en porte pas, sinon perdue au
        # remplacement (ex. "Gourbert," -> "Gourbeyre" sans la virgule).
        leading = re.match(r"^\W*", original_span, flags=re.UNICODE).group()
        trailing = re.search(r"\W*$", original_span, flags=re.UNICODE).group()
        # Conserve la majuscule de debut si le mot d'origine en avait une
        # (ex. debut de phrase) et que le mot-cle est fourni en minuscule.
        first_letter_idx = len(leading)
        if len(original_span) > first_letter_idx and original_span[first_letter_idx].isupper() and replacement[:1].islower():
            replacement = replacement[0].upper() + replacement[1:]
        result.append(leading + replacement + trailing)
        cursor = char_end
    result.append(text[cursor:])
    return "".join(result)
