"""Minimal deterministic translator example."""

from __future__ import annotations

DICTIONARY: dict[str, dict[str, str]] = {
    "en-es": {"hello": "hola", "goodbye": "adiós"},
    "es-en": {"hola": "hello", "adiós": "goodbye"},
}


def translate(text: str, source: str = "en", target: str = "es") -> str:
    """Translate a supported word while preserving unknown input."""
    normalized = text.strip().lower()
    if not normalized:
        raise ValueError("text must not be empty")

    translations = DICTIONARY.get(f"{source}-{target}")
    if translations is None:
        raise ValueError(f"unsupported language pair: {source}-{target}")
    return translations.get(normalized, text)
