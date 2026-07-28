# Translator

A lightweight English-learning browser extension.

## Milestone 2A: webpage selection flow

This draft adds the first product interaction on top of the tested extension foundation:

- capture a word, sentence, or paragraph selected on a normal webpage
- normalize whitespace, ignore empty or duplicate selections, and cap input at 5,000 characters
- send the selection through the background worker and mock translation provider
- retain the latest result in session storage
- update the side panel with the selected English, mock Chinese result, text type, and source page
- open the side panel by clicking the extension toolbar icon or choosing **Translate selection** from the selection context menu

Real translation, phonetics, favorites, counts, OCR, and cloud services remain intentionally deferred.

## Test build

1. Open the latest successful **CI** run for pull request #3.
2. Download the artifact named `translator-m02a-<commit-sha>`.
3. Extract the ZIP and load the directory from `chrome://extensions` using **Load unpacked**.
4. Open a normal webpage and select `hello`.
5. Click the Translator toolbar icon, or right-click the selection and choose **Translate selection**.
6. Confirm the side panel displays the selected English and the mock result `你好`.
7. Select another sentence and confirm the open side panel updates automatically.

Artifacts are retained for 90 days. Source commits and CI history remain in GitHub.

## Run locally

Requirements: Node.js 22+ and Chrome or Edge.

```bash
npm install
npm run check
npm run build
```

Load `.output/chrome-mv3` as an unpacked extension.

See [docs/architecture.md](docs/architecture.md) for the module boundaries.
