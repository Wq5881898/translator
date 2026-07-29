# Translator Stage 1 Test Report

Report date: 2026-07-29  
Target: `1.0.0-rc.1`  
Browsers: desktop Chrome primary; Edge compatibility uses the same Chromium Manifest V3 unpacked build.

## 1. Scope

Included:

- webpage selection and right-click capture;
- Chrome local translation and optional Azure fallback;
- word phonetics and local pronunciation;
- word and sentence favorites;
- CSV import/export;
- local settings, privacy controls, and data clearing;
- error handling, unit tests, build, and release checks.

Explicitly deferred:

- translation-count statistics;
- screenshot OCR;
- Chrome Web Store and Edge Add-ons publication.

## 2. Automated verification

The GitHub Actions release workflow performs:

1. dependency installation;
2. WXT type generation;
3. TypeScript strict type-checking;
4. Vitest unit tests;
5. Manifest V3 production build;
6. release artifact, permissions, hosts, version, and required-document verification;
7. upload of the unpacked Chromium test extension.

Covered business rules include:

- text classification;
- selection normalization;
- empty, non-English, oversized, and timed-out translation guards;
- Chrome and Azure provider behavior;
- settings normalization;
- speech play, stop, and error behavior;
- favorite creation, removal, and deduplication;
- CSV quoting, Unicode, validation, round-trip, merge, and deduplication.

### Recorded release-candidate run

- GitHub Actions run: `30417191586` (`CI #43`)
- Result: passed
- TypeScript strict type-check: passed
- Unit tests: 29 passed in 9 test files
- Chromium Manifest V3 production build: passed, 224.16 kB unpacked
- Release verification: permissions, hosts, version, artifact, and required documents passed
- Uploaded artifact: `translator-stage1-rc-c5ac56e2d3f7b2cbb93ec39f9d4d04e745ac266d`
- Artifact contents: 10 files, 73,505-byte ZIP, SHA-256 `9e61244c80a5b6e5961bc290c830a126bc19076047bf095b9f07f87b453d6eb2`

## 3. User-reported defects and results

| ID | Observation | Root cause | Resolution | Result |
|---|---|---|---|---|
| U-01 | Foundation check displayed “你好” below the formal result | Test success output shared the formal diagnostic area | Successful checks no longer render result text; the area is reserved for problems | Passed user retest |
| U-02 | Selection required the right-click menu in a later build | Automatic selection listener behavior regressed | Mouse, keyboard, and `selectionchange` capture restored; right-click retained as fallback | Passed user retest |
| U-03 | Re-selecting text did not translate again | Previous selection was not reset when the selection became empty | Empty selections reset deduplication; delayed capture reads the completed selection | Passed user retest after refreshing the webpage |
| U-04 | Automatic selection worked in one tab but not an already-open tab | Reloaded extensions do not inject updated content scripts into pages that were already open | Test instructions now require refreshing existing tabs after extension reload | Passed user retest |
| U-05 | Favorites occupied too much of the translation interface | Favorites were shown inline | Favorites moved to a hidden modal opened by a button | Passed user retest |
| U-06 | Save state was unclear in settings | Success message remained below the fold and the settings window stayed open | Success is shown briefly and the settings window closes automatically | Passed user retest |
| U-07 | JSON export was difficult to read | Backup format prioritized machine structure | Export/import changed to UTF-8 CSV readable in Excel and text editors | Passed user retest |
| U-08 | Pronunciation displayed phonetics but could not play audio | No speech module existed | Local Web Speech playback, stop control, and US/UK preference added | Passed user retest |
| U-09 | Invalid edited CSV appeared to keep importing because its error was only visible on the translation page | Import feedback used the page-level status area outside the open favorites dialog | Import progress, success, and failure now render inside the favorites dialog; invalid rows identify their CSV row number and the busy state always ends | Fixed; automated regression passed, awaiting user retest |

## 4. CI defects found during development

| ID | Failure | Resolution | Status |
|---|---|---|---|
| C-01 | Native speech objects did not match the injected test interface | Added a narrow native adapter | Fixed |
| C-02 | Azure provider depended on the complete settings object | Reduced dependency to Azure key and region only | Fixed |
| C-03 | CSV columns remained possibly undefined after runtime length validation | Added safe destructuring defaults | Fixed |
| C-04 | Malformed-CSV test expected a different valid error message | Aligned the assertion with the user-facing validation message | Fixed |

## 5. Manual release-candidate checklist

### Chrome

- Load the unpacked artifact from `chrome://extensions`.
- Refresh existing test pages after loading or reloading the extension.
- Select a word, sentence, and paragraph on two normal HTTPS sites.
- Clear and reselect the same text.
- Confirm the right-click fallback remains available.
- Confirm local translation, retry, phonetics, pronunciation, stop, and US/UK preference.
- Add and remove word and sentence favorites.
- Export CSV, open it in Excel, and verify Chinese text and five columns.
- Re-import the CSV and verify merge without duplicates.
- Import malformed CSV and verify the error appears inside the favorites dialog, includes the row number, makes no partial changes, and restores the Import CSV button.
- Save settings and verify automatic window closure.
- Clear local data: first click arms the action, second click clears; cancel prevents clearing.

### Edge

- Enable Developer mode in `edge://extensions`.
- Load the same unpacked Manifest V3 directory.
- Repeat selection, translation, speech, favorites, CSV, settings, and clear-data smoke tests.
- Chrome's built-in Translator API availability may differ by Edge version; an understandable unavailable message is acceptable when the API is absent.

## 6. Known browser restrictions

Automatic webpage selection cannot run on browser-protected pages such as `chrome://` or `edge://` pages, browser extension stores, and some built-in PDF surfaces. Existing pages must be refreshed once after loading a new unpacked extension build. Right-click translation remains the fallback where the browser permits it.

## 7. Privacy and permission audit

Expected extension permissions:

- `contextMenus`;
- `sidePanel`;
- `storage`.

Expected external hosts:

- Microsoft Azure Translator, optional fallback only;
- Free Dictionary API, word phonetics only.

The extension does not request tabs, history, downloads, clipboard, microphone, camera, location, or screenshot permissions. The webpage content script exists because automatic selection is a core feature. No favorites, settings, complete HTML, screenshots, or audio are uploaded.

## 8. Exit criteria

The release candidate is acceptable when:

- CI type-check, unit tests, build, and release verification pass;
- the Chrome checklist passes;
- Edge smoke testing has no extension-specific blocker;
- no P0 privacy, data-loss, or translation-path defect remains.
