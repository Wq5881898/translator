# Translator

A lightweight English-learning browser extension.

## Milestone 5: local pronunciation settings

This milestone adds one small local preference to the tested translation, favorites, and pronunciation flow:

- choose US English (`en-US`) or UK English (`en-GB`) pronunciation
- save the preference in local browser storage
- apply the preference to words, sentences, and paragraphs
- default safely to US English when upgrading from an older version
- keep Chrome local translation as the default
- keep Azure as an optional fallback only
- keep all translation, favorites, and pronunciation behavior from previous milestones

No account, API key, or paid speech service is required. The actual voice depends on the English voices installed in Chrome and the operating system.

## Test build

1. Open the latest successful **CI** run for the M05 pull request.
2. Download the artifact named `translator-m05-<commit-sha>`.
3. Extract the ZIP and load the directory from `chrome://extensions` using **Load unpacked**.
4. Open the extension's **Options** page from `chrome://extensions` → Translator → **Details** → **Extension options**.
5. Choose **UK English**, click **Save settings**, and confirm the saved message.
6. Return to the Translator side panel, select English text, and play its pronunciation.
7. Reopen the options page and confirm UK English is still selected.
8. Change back to **US English**, save, and play the same text again.
9. Confirm translation, heart favorites, and the hidden favorites view still work.

## Privacy

The pronunciation preference and favorites remain in local browser storage. Speech synthesis runs through the browser or operating system. No audio, favorites, browsing history, or screenshots are uploaded.

## Deferred

- favorite import/export
- translation-count statistics
- screenshot OCR

See [docs/architecture.md](docs/architecture.md) for module boundaries.
