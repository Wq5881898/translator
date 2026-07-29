# Translator

A lightweight English-learning browser extension.

## Milestone 6: readable favorites transfer

This milestone adds portable local backups and restores reliable repeated webpage selection:

- export favorites as structured CSV with columns for type, English, phonetic, Chinese translation, and first-saved time
- open the CSV directly in Excel or read it in a text editor
- include a UTF-8 marker so Chinese text displays correctly in Excel
- import the same Translator CSV structure from the favorites window
- merge imported entries without duplicating existing words or sentences
- validate the complete CSV before changing local favorites
- report invalid files without overwriting current data
- automatically translate each new webpage selection
- reset selection tracking when the selection is cleared, allowing the same text to be selected again
- automatically close the settings window shortly after a successful save

The CSV contains only favorite entries. It does not contain settings, browsing history, screenshots, API keys, or audio.

## Test build

1. Download the latest `translator-m06-<commit-sha>` artifact, extract it, and load it from `chrome://extensions`.
2. Refresh every webpage used for testing so Chrome installs the updated selection script into the page.
3. Select one English word, then select a different sentence and confirm both translate automatically without using the right-click menu.
4. Clear the selection and select the first word again; confirm it translates again.
5. Save at least one word and one sentence, then open favorites.
6. Click **Export CSV** and open `translator-favorites-<date>.csv` in Excel.
7. Confirm the columns are Type, English, Phonetic, Chinese translation, and First saved, and that Chinese text is readable.
8. Remove one exported favorite, then click **Import CSV** and import the downloaded file.
9. Confirm the removed favorite returns and existing favorites are not duplicated.
10. Try importing an unrelated CSV and confirm existing favorites remain unchanged while an error is shown.
11. Open extension options, change pronunciation, save, and confirm the settings window closes automatically.

## Privacy

Favorites and preferences remain in local browser storage. CSV import and export use a file chosen or downloaded by the user. Nothing is uploaded by this feature.

## Deferred

- translation-count statistics
- screenshot OCR

See [docs/architecture.md](docs/architecture.md) for module boundaries.
