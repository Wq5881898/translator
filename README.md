# Translator

A lightweight English-learning browser extension.

## Milestone 6: favorites import and export

This milestone adds portable local backups to the tested translation, favorites, pronunciation, and settings flow:

- export all current word and sentence favorites to a readable JSON file
- import a Translator JSON backup from the favorites window
- merge imported entries with existing local favorites
- keep the existing local entry when the same word or sentence already exists
- validate the whole file before changing local favorites
- report invalid or unsupported files without overwriting current data
- show import and export results in the existing diagnostic area
- automatically close the settings window shortly after a successful save

The exported file contains only favorite entries. It does not contain settings, browsing history, screenshots, API keys, or audio.

## Test build

1. Open the latest successful **CI** run for the M06 pull request.
2. Download `translator-m06-<commit-sha>`, extract it, and load it from `chrome://extensions`.
3. Open Translator favorites and confirm **Export JSON** and **Import JSON** appear above the lists.
4. Save at least one word and one sentence, then click **Export JSON**.
5. Confirm a file named like `translator-favorites-2026-07-28.json` downloads.
6. Remove one exported favorite, then import the downloaded JSON file.
7. Confirm the removed favorite returns and existing favorites are not duplicated.
8. Try importing an unrelated or damaged JSON file and confirm existing favorites remain unchanged while an error is shown.
9. Open extension options, change pronunciation, save, and confirm the settings window closes automatically.
10. Confirm translation, pronunciation, heart favorites, and hidden favorites still work.

## Privacy

Favorites and preferences remain in local browser storage. Import and export use a file chosen or downloaded by the user. Nothing is uploaded by this feature.

## Deferred

- translation-count statistics
- screenshot OCR

See [docs/architecture.md](docs/architecture.md) for module boundaries.
