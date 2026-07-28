# Translator

A lightweight English-learning browser extension.

## Milestone 4: local pronunciation

This draft adds free local English pronunciation to the tested translation and favorites flow:

- play the selected English word, sentence, or paragraph
- use the browser and operating system speech-synthesis voice
- stop the current speech from the same control
- stop previous speech before playing new content
- stop speech when a new selection starts translating
- show an understandable error when speech synthesis or a voice is unavailable
- keep translation and favorites behavior from previous milestones

Pronunciation is local and does not require an account, API key, or paid service. The current milestone uses the available US English voice. UK/US preference selection is deferred to the settings milestone.

## Test build

1. Open the latest successful **CI** run for pull request #6.
2. Download the artifact named `translator-m04-<commit-sha>`.
3. Extract the ZIP and load the directory from `chrome://extensions` using **Load unpacked**.
4. Refresh the webpage used for testing.
5. Select an English word and click **Play pronunciation**.
6. Confirm the button changes to **Stop pronunciation** while speech is active.
7. Select and play a complete sentence.
8. Start another pronunciation while audio is active and confirm the previous speech stops.
9. Start translating a new selection while audio is active and confirm the previous speech stops.
10. Confirm translation, heart favorites, and the hidden favorites view still work.

## Privacy

Speech synthesis runs through the browser or operating system. Favorites remain in local browser storage. No audio, favorites, browsing history, or screenshots are uploaded.

## Deferred

- UK/US voice preference and voice selection
- favorite import/export
- translation-count statistics
- screenshot OCR

See [docs/architecture.md](docs/architecture.md) for module boundaries.
