# Translator

A lightweight English-learning browser extension.

## Milestone 2B: local translation and phonetics

This draft turns the tested webpage-selection flow into a long-term free translation path:

- translate English words, sentences, and paragraphs into Simplified Chinese with Chrome's built-in Translator API
- download and run the English-to-Chinese language pack through desktop Chrome
- retrieve English IPA from Free Dictionary API for single words
- keep Azure Translator as an optional fallback that is disabled by default
- store optional Azure credentials only in the local browser profile
- keep providers behind small replaceable interfaces

Selected text is processed locally when Chrome translation is available. Only a single English word is sent to Free Dictionary API for its IPA. Azure receives text only when the user explicitly enables and configures the fallback. Screenshots, favorites, and browsing history are not uploaded.

## Requirements

- desktop Chrome 138 or later
- an internet connection for the first English-to-Chinese language-pack download
- no Azure account or API key for the default path

## Test build

1. Open the latest successful **CI** run for pull request #4.
2. Download the artifact named `translator-m02b-<commit-sha>`.
3. Extract the ZIP and load the directory from `chrome://extensions` using **Load unpacked**.
4. Open the Translator side panel and click **Run local translation check**.
5. If Chrome asks to download the language pack, click **Translate / retry** and wait for the download.
6. Confirm `hello` produces a Chinese translation.
7. Select an English word on a normal webpage, right-click, and choose **Translate selection**.
8. Confirm the panel displays the Chinese translation and, when the dictionary contains it, an IPA value.
9. Select a sentence or paragraph and confirm it translates without Azure settings.

## Optional Azure fallback

Azure is not required. If local translation is unavailable or its quality is insufficient later:

1. Open the extension options.
2. Enable **Use Azure only if local translation fails**.
3. Enter an Azure Translator key and region.
4. Save the settings.

Credentials are never committed to GitHub or included in test artifacts. A distributed extension should not ship a shared Azure key.

## Current exclusions

Favorites, translation counts, screenshot OCR, and pronunciation playback are deferred to later milestones.

See [docs/architecture.md](docs/architecture.md) for module boundaries.
