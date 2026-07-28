# Translator

A lightweight English-learning browser extension.

## Milestone 3: local favorites

This draft adds local learning lists to the tested translation flow:

- translate selected English locally with Chrome
- retrieve English IPA from Free Dictionary API for single words
- save and remove translated words, sentences, and paragraphs
- keep separate word and sentence lists in the side panel
- store word text, IPA when available, Chinese translation, and first favorite time
- store sentence or paragraph text, Chinese translation, and first favorite time
- keep all favorite data in the current browser profile with `browser.storage.local`
- keep Azure Translator as an optional, disabled-by-default fallback

Translation counts are intentionally not implemented in this milestone.

## Requirements

- desktop Chrome 138 or later
- an internet connection for the first English-to-Chinese language-pack download
- no Azure account or API key for the default path

## Test build

1. Open the latest successful **CI** run for pull request #5.
2. Download the artifact named `translator-m03-<commit-sha>`.
3. Extract the ZIP and load the directory from `chrome://extensions` using **Load unpacked**.
4. Refresh the webpage used for testing.
5. Select an English word and confirm the side panel opens and translates it.
6. Click **Save to favorites**.
7. Confirm the word appears under **Words** with its translation, IPA when available, and first saved time.
8. Select a sentence or paragraph, save it, and confirm it appears under **Sentences**.
9. Select the same saved content again and confirm the action says **Remove from favorites**, with no duplicate entry.
10. Remove an item and confirm it disappears after the browser or panel is reopened.

## Privacy

Favorites remain only in the local browser profile. No favorites, browsing history, or screenshots are uploaded. A single English word is sent to Free Dictionary API only to retrieve IPA. Azure receives selected text only when the user explicitly enables and configures the optional fallback.

## Current exclusions

Translation counts, screenshot OCR, and pronunciation playback are deferred to later milestones.

See [docs/architecture.md](docs/architecture.md) for module boundaries.
