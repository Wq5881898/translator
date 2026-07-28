# Translator

A lightweight English-learning browser extension.

## Milestone 1: extension foundation

This draft implements only the engineering foundation:

- Manifest V3 extension powered by WXT and React
- side panel and options page
- content script and background worker
- typed message contracts
- replaceable translation provider with a local mock
- unit tests, type checking, build script, and GitHub Actions CI
- downloadable test extension for every pull request build

Selection translation, favorites, translation counts, OCR, and real translation services are intentionally deferred to later milestones.

## Test without a local build

1. Open the latest successful **CI** run for the pull request.
2. Download the artifact named `translator-m01-<commit-sha>`.
3. Extract the ZIP file.
4. Open `chrome://extensions` or `edge://extensions`.
5. Enable developer mode and choose **Load unpacked**.
6. Select the extracted directory.
7. Open the Translator side panel and click **Run foundation check**.

The mock result should display `你好`. Test artifacts are retained for 90 days. Source commits and CI history remain in GitHub.

## Run locally

Requirements: Node.js 22+ and Chrome or Edge.

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run check
npm run build
```

Load `.output/chrome-mv3` as an unpacked extension.

See [docs/architecture.md](docs/architecture.md) for the module boundaries.
