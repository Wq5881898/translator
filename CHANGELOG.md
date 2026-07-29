# Changelog

## 1.0.0-rc.1 — 2026-07-28

First-stage release candidate.

### Added

- automatic webpage-selection translation;
- right-click translation fallback;
- Chrome local English-to-Chinese translation;
- optional Azure fallback;
- free word phonetics;
- local English pronunciation with US/UK preference;
- local word and sentence favorites;
- hidden favorites window with heart-state controls;
- Excel-friendly CSV favorites import and export;
- two-step local-data clearing;
- privacy, permission, installation, and testing documentation;
- release artifact permission verification.

### Fixed

- removed visible test output after formal translation starts;
- restored automatic translation after repeated selections;
- restored automatic selection behavior across refreshed tabs;
- stopped prior pronunciation when translation or playback changes;
- closed settings after a successful save;
- prevented duplicate imported favorites;
- rejected malformed imports without partial writes;
- added understandable errors for unavailable providers, invalid input, oversized text, timeouts, and storage failures.

### Deferred

- translation-count statistics;
- Windows screenshot OCR;
- browser-store publication.
