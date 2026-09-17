"""Convertit les nombres en toutes lettres dans le texte transcrit -
convention des actes anciens (etat civil, notariat) ecrits a la main, jamais
en chiffres. Whisper transcrit nativement les nombres en chiffres quel que
soit le contexte ; ceci est une passe de post-traitement systematique.

- Cardinaux (dates, ages...) : num2words, ex. 41 -> "quarante et un".
- Ordinaux abreges (1er, 2nd, 22e) : convertis en toutes lettres aussi,
  ex. "1er" -> "premier", "22e" -> "vingt-deuxieme".
- Annees a 4 chiffres commencant par 1 (1000-1999) : "mil" plutot que
  "mille" (convention notariale/etat civil historique, ex. "mil huit cent
  cinquante-sept"), pas la sortie brute de num2words.
"""

import re

from num2words import num2words

_ORDINAL_RE = re.compile(r"\b(\d+)(er|ère|ere|nd|nde|ème|eme|e)\b", re.IGNORECASE)
_CARDINAL_RE = re.compile(r"\b\d+\b")


def _cardinal_words(n: int) -> str:
    words = num2words(n, lang="fr")
    if 1000 <= n <= 1999:
        words = re.sub(r"^mille\b", "mil", words)
    return words


def _replace_ordinal(m: re.Match) -> str:
    return num2words(int(m.group(1)), lang="fr", to="ordinal")


def _replace_cardinal(m: re.Match) -> str:
    return _cardinal_words(int(m.group(0)))


def spell_out_numbers(text: str) -> str:
    if not text:
        return text
    # Les ordinaux abreges (1er, 22e...) doivent etre traites avant les
    # cardinaux, sinon le chiffre seul serait deja converti par la regle
    # cardinale avant que le suffixe (er/e/nd...) ne soit pris en compte.
    text = _ORDINAL_RE.sub(_replace_ordinal, text)
    text = _CARDINAL_RE.sub(_replace_cardinal, text)
    return text
