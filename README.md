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

Selection translation, favorites, translation counts, OCR, and real translation services are intentionally deferred to later milestones.

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

Load `.output/chrome-mv3` as an unpacked extension, open the Translator side panel, and click **Run foundation check**. The mock result should display `你好`.

See [docs/architecture.md](docs/architecture.md) for the module boundaries.
