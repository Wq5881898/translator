# Lightweight architecture

## Goal

Keep the first release easy to understand, test, and replace. The browser extension is one TypeScript project with no backend, no global state library, and no microservice split.

## Boundaries

1. **Entrypoints** contain browser-specific code: content script, background worker, side panel, and options page.
2. **Core** contains typed messages shared by entrypoints.
3. **Providers** hide translation implementations behind one small interface.
4. Future persistence will use a local repository interface so IndexedDB details do not leak into UI code.

The UI talks to the background worker through typed messages. The background worker is the only layer that calls translation providers. This keeps API keys and provider changes away from webpage content scripts.

## Milestones

- M01 — extension foundation and mock provider
- M02 — webpage selection and real translation
- M03 — word and sentence favorites
- M04 — translation count statistics
- M05 — local OCR input for screenshots

M01 deliberately does not implement product behavior from later milestones.
