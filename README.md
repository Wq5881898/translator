# Translator

Translator is a lightweight, local-first browser extension for daily English learning.

## Stage 1 final release candidate

Core workflow:

**Select English on a webpage → translate → view phonetics → listen → favorite → export or import CSV**

Features:

- automatic translation for selected English words, sentences, and paragraphs;
- right-click translation fallback;
- Chrome local English-to-Chinese translation by default;
- optional Azure fallback, disabled by default;
- free word phonetics;
- local English pronunciation with US/UK preference;
- heart-based word and sentence favorites;
- hidden local favorites window;
- Excel-friendly UTF-8 CSV import and export;
- import progress and row-specific errors inside the favorites window;
- understandable retry, timeout, provider, input, import, and storage errors;
- two-step local data clearing;
- no Translator backend, analytics, ads, or account requirement.

## Final documentation

- [中文安装与使用说明书](docs/FINAL_USER_GUIDE_ZH.md)
- [中文功能架构与维护设计方案](docs/FINAL_DESIGN_ZH.md)
- [中文第一阶段最终交付索引](docs/FINAL_DELIVERY_INDEX_ZH.md)
- [Concise Chrome and Edge installation instructions](docs/INSTALLATION.md)

After loading or reloading an unpacked build, refresh webpages that were already open so the updated selection script can run.

## Browser requirements

- Desktop Chromium browser with Manifest V3 side-panel support.
- Chrome 138 or later is recommended for the built-in local Translator API.
- Edge can load the same unpacked build, but local Translator API availability may differ. Translator reports an understandable unavailable state when it is absent.

Browser-protected pages such as `chrome://`, `edge://`, extension stores, and some built-in document viewers do not allow normal content-script selection capture.

## Privacy

Favorites, preferences, and optional Azure configuration stay in extension-local storage. Chrome local translation is the default. Azure receives selected English text only when the user enables fallback and local translation fails. Word phonetic lookup may send only the selected word to Free Dictionary API.

Translator does not upload favorites, complete webpages, browsing history, screenshots, or audio. See [PRIVACY.md](PRIVACY.md).

## Quality and release evidence

- [Stage 1 test report](docs/TEST_REPORT_STAGE_1.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Changelog](CHANGELOG.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [MIT license](LICENSE)

CI type-checks, runs unit tests, builds the Manifest V3 extension, audits the expected permissions and host access, verifies release documents, and publishes an unpacked test artifact.

## Deferred

The following are intentionally not part of Stage 1:

- translation-count statistics;
- Windows screenshot OCR;
- automatic GPT integration and commercial dictionaries;
- browser-store publication.
