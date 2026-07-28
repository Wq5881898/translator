# Translator

A lightweight English-learning browser extension.

## Milestone 2B: real translation and phonetics

This draft adds real translation to the tested webpage-selection flow:

- translate English sentences and paragraphs into Simplified Chinese with Azure Translator
- look up alternative Chinese meanings for English words with Azure Dictionary Lookup
- retrieve English IPA from Free Dictionary API
- store the Azure key and region only in the local browser profile
- show authentication, quota, throttling, and missing-configuration errors
- keep all network providers behind replaceable interfaces

Only selected text is sent to the two providers. Screenshots, favorites, and browsing history are not uploaded.

## Configure and test

1. Create an Azure Translator F0 resource.
2. Copy its key and region from **Keys and Endpoint**.
3. Load the latest `translator-m02b-<commit-sha>` test artifact.
4. Open the extension options page and enter the key and region.
5. Save, then select `hello` on a normal webpage.
6. Confirm the side panel displays Chinese meanings and an IPA value.
7. Select a sentence and confirm it displays a natural Simplified Chinese translation.

Credentials are never committed to GitHub or included in test artifacts. They are stored locally in `browser.storage.local`. A locally stored extension key is appropriate only for this personal unpacked build; a distributed production extension should use a secure proxy or token service.

## Current exclusions

Favorites, translation counts, screenshot OCR, pronunciation playback, and a hosted credential proxy are deferred to later milestones.

See [docs/architecture.md](docs/architecture.md) for module boundaries.
